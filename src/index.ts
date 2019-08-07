
// pandoc schema:
//  https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94

// TODO: debugging tools (selected node/mark view, markdown output view)

// TODO: parse and forward Attr for elements that support them (results in id, class,
// and data-attribs in PM schema)

// TOOD: error handling for pandoc

// TODO: handle duplicate ids when block elements are split (required once
//       we support ids on divs)
// TODO: handle section divs (when active headers imply an enclosing node, perhaps
//       though this could be implemented via node decorator?

// TODO: support pandoc {} syntax for fenced code regions

// TODO: support for image figures (where alt text is displayed in a <p> below the image).
// note that alt text supports arbitrary markup so need a structured way to allow
// selection and editing of just the alt text

// TODO: toggleMark from prosemirror shows commands enabled even when marks: false


import OrderedMap from 'orderedmap';

import { Schema, Node, NodeSpec, MarkSpec } from 'prosemirror-model';
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { inputRules } from 'prosemirror-inputrules';

import { IPandocEngine } from './pandoc/engine';
import { markdownToDoc } from './pandoc/to_doc';
import { markdownFromDoc } from './pandoc/from_doc';

import { ExtensionManager } from './extensions/manager';

import { Command, CommandFn, IEditorUI, INode, IMark } from './extensions/api';

// standard prosemirror + additional built-in styles
// (these styles are about behavior not appearance)
import 'prosemirror-view/style/prosemirror.css';
import './styles/prosemirror.css';

// re-exports from extension api
export { IEditorUI, IImageEditor, IImageProps, ILinkEditor, ILinkEditResult, ILinkProps } from './extensions/api';

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
      [kEventSelectionChange]: new Event(kEventSelectionChange),
    };

    // create extensions
    this.extensions = ExtensionManager.create();

    // create schema
    this.schema = this.editorSchema();

    // create state
    this.state = EditorState.create({
      schema: this.schema,
      doc: this.emptyDoc(),
      plugins: this.createPlugins(),
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
    // convert from pandoc markdown to prosemirror doc
    return markdownToDoc(markdown, this.schema, this.pandoc, this.extensions.pandocReaders()).then((doc: Node) => {
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

  public getMarkdown(): string {
    // get mark and node writers from extensions
    const markWriters = this.extensions.pandocMarkWriters();
    const nodeWriters = this.extensions.pandocNodeWriters();

    // generate markdown
    return markdownFromDoc(this.state.doc, markWriters, nodeWriters);
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

  public commands(): IEditorCommands {
    return this.extensions.commands(this.schema, this.ui).reduce((commands: IEditorCommands, command: Command) => {
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

  private editorSchema() : Schema {
    // build in doc node + nodes from extensions
    const nodes: { [name: string]: NodeSpec } = {
      doc: {
        content: 'block+',
      },
    };
    this.extensions.nodes().forEach((node: INode) => {
      nodes[node.name] = node.spec;
    });

    // marks from extensions
    const marks: { [name: string]: MarkSpec } = {};
    this.extensions.marks().forEach((mark: IMark) => {
      marks[mark.name] = mark.spec;
    });

    // return schema
    return new Schema({
      nodes: OrderedMap.from(nodes),
      marks: OrderedMap.from(marks),
    });
  }

  private emptyDoc() : Node {
    return this.schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
        },
      ],
    });
  }

  private createPlugins(): Plugin[] {
    return [
      ...this.keymapPlugins(),
      ...this.extensions.plugins(this.schema, this.ui),
      inputRules({ rules: this.extensions.inputRules(this.schema) }),
      new Plugin({
        key: new PluginKey('editable'),
        props: {
          editable: this.hooks.isEditable,
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
}



