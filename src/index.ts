import { Schema, Node } from 'prosemirror-model';
import { EditorState, Transaction, Plugin, PluginKey, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo, history } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, joinUp, joinDown, lift, selectParentNode, setBlockType } from 'prosemirror-commands';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import { inputRules, InputRule, smartQuotes, emDash, ellipsis, undoInputRule } from 'prosemirror-inputrules';

import { IPandocEngine } from './pandoc/engine';
import { pandocReaders } from './pandoc/readers';
import { markdownToDoc } from './pandoc/to_doc';

import { ExtensionManager } from './extensions/manager';

import { editorSchema, emptyDoc } from './schema';
import { Command, IEditorUI, BlockCommand } from './extensions/api';
import { CommandFn } from './utils/command';

// standard prosemirror + additional built-in styles
// (these styles are about behavior not appearance)
import 'prosemirror-view/style/prosemirror.css';
import './styles/prosemirror.css';

// re-exports from extension api
export  { IEditorUI, 
          IImageEditor, IImageProps,
          ILinkEditor, ILinkEditResult, ILinkProps } 
  from './extensions/api';

export interface IEditorOptions {
  autoFocus?: boolean;
}

export interface IEditorHooks {
  isEditable?: () => boolean;
}

export interface IEditorConfig {
  parent: HTMLElement;
  pandoc: IPandocEngine;
  ui: IEditorUI;
  options?: IEditorOptions;
  hooks?: IEditorHooks;
}

export interface IEditorCommand {
  name: string;
  isEnabled: () => boolean;
  isActive: () => boolean;
  execute: () => void;
}
export interface IEditorCommands {
  [name: string]: IEditorCommand;
}

export const kEventUpdate = 'update';
export const kEventSelectionChange = 'selectionChange';

export class Editor {
  private parent: HTMLElement;
  private pandoc: IPandocEngine;
  private ui: IEditorUI;
  private options: IEditorOptions;
  private hooks: IEditorHooks;
  private events: { [key: string]: Event };
  private schema: Schema;
  private state: EditorState;
  private view: EditorView;
  private extensions: ExtensionManager;
  private onClickBelow: (ev: MouseEvent) => void;

  constructor(config: IEditorConfig) {
    
    // maintain references to config
    this.parent = config.parent;
    this.pandoc = config.pandoc;
    this.ui = config.ui;
    this.options = config.options || {};

    // initialize hooks
    this.hooks = config.hooks || {};
    this.initHooks();

    // initialize custom events
    this.events = {
      [kEventUpdate]: new Event(kEventUpdate),
      [kEventSelectionChange]: new Event(kEventSelectionChange)
    };

    // create extensions
    this.extensions = ExtensionManager.create();

    // create schema
    this.schema = editorSchema(this.extensions);

    // create state
    this.state = EditorState.create({
      schema: this.schema,
      doc: emptyDoc(this.schema),
      plugins: [...this.basePlugins()],
    });

    // create view
    this.view = new EditorView(this.parent, {
      state: this.state,
      dispatchTransaction: this.dispatchTransaction.bind(this),
    });

    // set some css invariants on the editor and it's container
    this.parent.style.overflowY = 'scroll';
    const editorStyle = (this.view.dom as HTMLElement).style;
    editorStyle.outline = 'none';
    editorStyle.width = '100%';

    // focus editor when container below it is clicked
    this.onClickBelow = () => this.focus();
    this.parent.addEventListener('click', this.onClickBelow);

    // focus editor immediately if requested
    if (this.options.autoFocus) {
      setTimeout(() => {
        this.focus();
      }, 10);
    }
  }

  public destroy() {
    this.parent.removeEventListener('click', this.onClickBelow);
    this.view.destroy();
  }

  public subscribe(event: string, handler: VoidFunction) : VoidFunction {
    if (!this.events.hasOwnProperty(event)) {
      throw new Error(`Unknown event ${event}. Valid events are ${Object.keys(this.events).join(', ')}`);
    }
    this.parent.addEventListener(event, handler);
    return () => { this.parent.removeEventListener(event, handler); };
  }

  public setContent(content: string, emitUpdate = true) {
    // convert from pandoc markdown to prosemirror doc
    return markdownToDoc(content, this.schema, this.pandoc, pandocReaders(this.extensions)).then((doc: Node) => {
      // re-initialize editor state
      this.state = EditorState.create({
        schema: this.state.schema,
        doc,
        plugins: this.state.plugins,
      });
      this.view.updateState(this.state);

      // notify listeners if requested
      if (emitUpdate) {
        this.emitUpdate();
        this.emitSelectionChanged();
      }
    });
  }

  public focus() {
    this.view.focus();
  }

  public blur() {
    (this.view.dom as HTMLElement).blur();
  }

  public commands(): IEditorCommands {

    const allCommands: Command[] = [
      new Command('undo', null, undo),
      new Command('redo', null, redo),
      new BlockCommand('paragraph', null, this.schema.nodes.paragraph, this.schema.nodes.paragraph),
      ...this.extensions.commands(this.schema, this.ui)
    ];

    return allCommands.reduce((commands: IEditorCommands, command: Command) => {
      return {
        ...commands,
        [command.name]: {
          name: command.name,
          isActive: () => command.isActive(this.state),
          isEnabled: () => command.isEnabled(this.state),
          execute: () => command.execute(this.state, this.view.dispatch, this.view),
        },
      };
    }, {});
  }
 
  private dispatchTransaction(transaction: Transaction) {
    // apply the transaction
    this.state = this.state.apply(transaction);
    this.view.updateState(this.state);

    // notify listeners of selection change
    this.emitSelectionChanged();

    // notify listeners of updates
    if (transaction.docChanged) {
      this.emitUpdate();
    }
  }

  private emitSelectionChanged() {
    this.parent.dispatchEvent(this.events.selectionChange);
  }

  private emitUpdate() {
    this.parent.dispatchEvent(this.events.update);
  }

  private initHooks() {
    if (this.hooks.isEditable === undefined) {
      this.hooks.isEditable = () => true;
    }
  }

  private basePlugins(): Plugin[] {
    return [
      history(),
      ...this.keymapPlugins(),
      this.inputRulesPlugin(),
      gapCursor(),
      dropCursor(),
      new Plugin({
        key: new PluginKey('editable'),
        props: {
          editable: this.hooks.isEditable,
        },
      }),
    ];
  }

  private keymapPlugins(): Plugin[] {
    // detect mac
    const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;

    // start with standard editing keys
    const keys: { [key: string]: CommandFn } = {};
    function bindKey(key: string, cmd: CommandFn) {
      keys[key] = cmd;
    }
    bindKey('Mod-z', undo);
    bindKey('Shift-Mod-z', redo);
    if (!mac) {
      bindKey('Mod-y', redo);
    }
    bindKey('Backspace', undoInputRule);
    bindKey('Alt-ArrowUp', joinUp);
    bindKey('Alt-ArrowDown', joinDown);
    bindKey('Mod-BracketLeft', lift);
    bindKey('Escape', selectParentNode);

    bindKey('Shift-Ctrl-0', setBlockType(this.schema.nodes.paragraph));

    // command keys from extensions
    const commands: Command[] = this.extensions.commands(this.schema, this.ui);
    commands.forEach((command: Command) => {
      if (command.keymap) {
        command.keymap.forEach((key: string) => bindKey(key, command.execute));
      }
    });

    // keymap from extensions
    const extensionKeys = this.extensions.keymap(this.schema, mac);

    return [keymap(keys), keymap(extensionKeys), keymap(baseKeymap)];
  }

  private inputRulesPlugin(): Plugin {
    // base input rules
    let rules: InputRule[] = [...smartQuotes, ellipsis, emDash];

    // add rules from extensions
    rules = rules.concat(this.extensions.inputRules(this.schema));

    // return plugin
    return inputRules({ rules });
  }
}
