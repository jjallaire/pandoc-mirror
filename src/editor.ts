import OrderedMap from 'orderedmap';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { MarkSpec, Node, NodeSpec, Schema } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import 'prosemirror-view/style/prosemirror.css';

import { Command, CommandFn } from 'api/command';
import { PandocMark } from 'api/mark';
import { PandocNode } from 'api/node';
import { EditorUI } from 'api/ui';
import { Extension } from 'api/extension';
import { ExtensionManager } from './extensions';
import { PandocEngine } from 'api/pandoc';

import { PandocTranslator } from 'pandoc/translator';

import { initExtensions } from './extensions';

import './styles/prosemirror.css';

export interface EditorConfig {
  parent: HTMLElement;
  pandoc: PandocEngine;
  ui: EditorUI;
  options?: EditorOptions;
  hooks?: EditorHooks;
  extensions?: Extension[];
}

export interface EditorOptions {
  autoFocus?: boolean;
}

export interface EditorHooks {
  isEditable?: () => boolean;
  applyDevTools?: (view: EditorView, stateClass: any) => void;
}

export interface EditorCommand {
  name: string;
  isEnabled: () => boolean;
  isActive: () => boolean;
  execute: () => void;
}

export const kEventUpdate = 'update';
export const kEventSelectionChange = 'selectionChange';

export class Editor {
  
  private readonly parent: HTMLElement;
  private readonly pandocTranslator: PandocTranslator;
  private readonly ui: EditorUI;
  private readonly options: EditorOptions;
  private readonly hooks: EditorHooks;
  private readonly events: { [key: string]: Event };
  private readonly schema: Schema;
  private readonly view: EditorView;
  private readonly extensions: ExtensionManager;
  private readonly onClickBelow: (ev: MouseEvent) => void;
  private state: EditorState;

  constructor(config: EditorConfig) {
    // initialize references
    this.parent = config.parent;
    this.ui = config.ui;
    this.options = config.options || {};
    this.hooks = config.hooks || {};

    // initialize custom events
    this.events = this.initEvents();

    // create extensions
    this.extensions = initExtensions(config);

    // create schema
    this.schema = this.initSchema();

    // create state
    this.state = EditorState.create({
      schema: this.schema,
      doc: this.emptyDoc(),
      plugins: this.initPlugins(),
    });

    // create view
    this.view = new EditorView(this.parent, {
      state: this.state,
      dispatchTransaction: this.dispatchTransaction.bind(this),
    });

    // create pandoc translator
    this.pandocTranslator = new PandocTranslator(
      this.schema,
      this.extensions.pandocReaders(),
      this.extensions.pandocNodeWriters(),
      config.pandoc
    );

    // apply devtools if they are available
    if (this.hooks.applyDevTools) {
      this.hooks.applyDevTools(this.view, { EditorState });
    }

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

  public subscribe(event: string, handler: VoidFunction): VoidFunction {
    if (!this.events.hasOwnProperty(event)) {
      throw new Error(`Unknown event ${event}. Valid events are ${Object.keys(this.events).join(', ')}`);
    }
    this.parent.addEventListener(event, handler);
    return () => {
      this.parent.removeEventListener(event, handler);
    };
  }

  public setMarkdown(markdown: string, emitUpdate = true) {
    
    return this.pandocTranslator.toProsemirror(markdown).then((doc: Node) => {
      
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

  public getMarkdown(): Promise<string> {
    return this.pandocTranslator.fromProsemirror(this.state.doc);
  }

  public getJSON(): any {
    return this.state.doc.toJSON();
  }

  public focus() {
    this.view.focus();
  }

  public blur() {
    (this.view.dom as HTMLElement).blur();
  }

  public commands(): { [name: string]: EditorCommand } {
    return this.extensions
      .commands(this.schema, this.ui)
      .reduce((commands: { [name: string]: EditorCommand }, command: Command) => {
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

  private initEvents() {
    return {
      [kEventUpdate]: new Event(kEventUpdate),
      [kEventSelectionChange]: new Event(kEventSelectionChange),
    };
  }

  private initSchema(): Schema {
    // build in doc node + nodes from extensions
    const nodes: { [name: string]: NodeSpec } = {
      doc: {
        content: 'block+',
      },
    };
    this.extensions.pandocNodes().forEach((node: PandocNode) => {
      nodes[node.name] = node.spec;
    });

    // marks from extensions
    const marks: { [name: string]: MarkSpec } = {};
    this.extensions.pandocMarks().forEach((mark: PandocMark) => {
      marks[mark.name] = mark.spec;
    });

    // return schema
    return new Schema({
      nodes: OrderedMap.from(nodes),
      marks: OrderedMap.from(marks),
    });
  }

  private initPlugins(): Plugin[] {
    return [
      ...this.keymapPlugins(),
      ...this.extensions.plugins(this.schema, this.ui),
      inputRules({ rules: this.extensions.inputRules(this.schema) }),
      new Plugin({
        key: new PluginKey('editable'),
        props: {
          editable: this.hooks.isEditable || (() => true),
        },
      }),
    ];
  }

  private keymapPlugins(): Plugin[] {
    // command keys from extensions
    const commandKeys: { [key: string]: CommandFn } = {};
    const commands: Command[] = this.extensions.commands(this.schema, this.ui);
    commands.forEach((command: Command) => {
      if (command.keymap) {
        command.keymap.forEach((key: string) => {
          commandKeys[key] = command.execute;
        });
      }
    });

    // keymap from extensions
    const mac = typeof navigator !== 'undefined' ? /Mac/.test(navigator.platform) : false;
    const extensionKeys = this.extensions.keymap(this.schema, mac);

    // return plugins
    return [keymap(commandKeys), keymap(extensionKeys)];
  }

  private emptyDoc(): Node {
    return this.schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    });
  }
}
