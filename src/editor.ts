// pandoc schema:
//  https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94

// TODO: parse and forward Attr for elements that support them (results in id, class,
// and data-attribs in PM schema)

// TODO: including $ in id doesn't seem to work well
// TODO: link includes extra {}

// TOOD: error handling for pandoc engine

// TODO: consider emiting pandoc ast

// TODO: handle duplicate ids when block elements are split (required once
//       we support ids on divs)
// TODO: handle section divs (when active headers imply an enclosing node, perhaps
//       though this could be implemented via node decorator?

// TODO: support pandoc {} syntax for fenced code regions
// TODO: embedeed codemirror editor

// TODO: support for image figures (where alt text is displayed in a <p> below the image).
// note that alt text supports arbitrary markup so need a structured way to allow
// selection and editing of just the alt text

// TODO: toggleMark from prosemirror shows commands enabled even when marks: false

// TODO: allow overriding of editor keys

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
import { ExtensionManager, Extension } from 'api/extension';
import { PandocEngine } from 'api/pandoc';

import { markdownFromDoc } from './pandoc/from_doc';
import { markdownToDoc } from './pandoc/to_doc';

import behaviorBasekeys from './behaviors/basekeys';
import behaviorCursor from './behaviors/cursor';
import behaviorHistory from './behaviors/history';
import behaviorSmarty from './behaviors/smarty';
import markCode from './marks/code';
import markEm from './marks/em';
import markLink from './marks/link';
import markStrong from './marks/strong';
import nodeBlockquote from './nodes/blockquote';
import nodeCodeBlock from './nodes/code_block';
import nodeHardBreak from './nodes/hard_break';
import nodeSoftBreak from './nodes/soft_break';
import nodeHeading from './nodes/heading';
import nodeHorizontalRule from './nodes/horizontal_rule';
import nodeImage from './nodes/image/index';
import nodeLists from './nodes/lists';
import nodeParagraph from './nodes/paragraph';
import nodeText from './nodes/text';

import './styles/prosemirror.css';

export interface EditorConfig {
  parent: HTMLElement;
  pandoc: PandocEngine;
  ui: EditorUI;
  options?: EditorOptions;
  hooks?: EditorHooks;
  extensions?: Extension[];
  devtools?: EditorDevTools;
}

export interface EditorOptions {
  autoFocus?: boolean;
}

export interface EditorHooks {
  isEditable?: () => boolean;
}

// https://github.com/d4rkr00t/prosemirror-dev-tools
export interface EditorDevTools {
  applyDevTools: (view: EditorView, stateClass: any) => void;
}

export {
  EditorUI,
  ImageEditorFn,
  ImageEditResult,
  ImageProps,
  LinkEditorFn,
  LinkEditResult,
  LinkProps,
} from 'api/ui';

export interface EditorCommand {
  name: string;
  isEnabled: () => boolean;
  isActive: () => boolean;
  execute: () => void;
}

export const kEventUpdate = 'update';
export const kEventSelectionChange = 'selectionChange';

export class Editor {
  private parent: HTMLElement;
  private pandoc: PandocEngine;
  private ui: EditorUI;
  private options: EditorOptions;
  private hooks: EditorHooks;
  private events: { [key: string]: Event };
  private schema: Schema;
  private state: EditorState;
  private view: EditorView;
  private extensions: ExtensionManager;
  private onClickBelow: (ev: MouseEvent) => void;

  constructor(config: EditorConfig) {
    // initialize references
    this.parent = config.parent;
    this.pandoc = config.pandoc;
    this.ui = config.ui;
    this.options = config.options || {};
    this.hooks = config.hooks || {};

    // initialize custom events
    this.events = this.initEvents();

    // create extensions
    this.extensions = this.initExtensions(config);

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

    // apply devtools if they are available
    if (config.devtools) {
      config.devtools.applyDevTools(this.view, { EditorState });
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
    // convert from pandoc markdown to prosemirror doc
    return markdownToDoc(markdown, this.schema, this.pandoc, this.extensions.pandocAstReaders()).then((doc: Node) => {
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

  public commands(): { [name: string]: EditorCommand } {
    return this.extensions.commands(this.schema, this.ui).reduce(
      (commands: { [name: string]: EditorCommand }, command: Command) => {
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

  private initExtensions(config: EditorConfig) {
    
    // create extension manager
    const manager = new ExtensionManager();

    // register built-in extensions
    manager.register([
      // behaviors
      behaviorBasekeys,
      behaviorCursor,
      behaviorSmarty,
      behaviorHistory,

      // marks
      markEm,
      markStrong,
      markCode,
      markLink,

      // nodes
      nodeText,
      nodeParagraph,
      nodeHeading,
      nodeBlockquote,
      nodeHorizontalRule,
      nodeCodeBlock,
      nodeLists,
      nodeHardBreak,
      nodeSoftBreak,
      nodeImage,
    ]);

    // register external extensions
    if (config.extensions) {
      manager.register(config.extensions);
    }

    // return manager
    return manager;
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
