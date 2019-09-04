import OrderedMap from 'orderedmap';
import { inputRules } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { MarkSpec, Node as ProsemirrorNode, NodeSpec, Schema } from 'prosemirror-model';
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

import { PandocConverter } from 'pandoc/converter';

import { initExtensions } from './extensions';

import './styles/prosemirror.css';

export interface EditorConfig {
  readonly parent: HTMLElement;
  readonly pandoc: PandocEngine;
  readonly ui: EditorUI;
  readonly options?: EditorOptions;
  readonly hooks?: EditorHooks;
  readonly extensions?: readonly Extension[];
}

export interface EditorOptions {
  readonly autoFocus?: boolean;
}

export interface EditorHooks {
  isEditable?: () => boolean;
  applyDevTools?: (view: EditorView, stateClass: any) => void;
}

export interface EditorCommand {
  readonly name: string;
  isEnabled: () => boolean;
  isActive: () => boolean;
  execute: () => void;
}

export const kEventUpdate = 'update';
export const kEventSelectionChange = 'selectionChange';

export class Editor {
  private readonly parent: HTMLElement;
  private readonly ui: EditorUI;
  private readonly options: EditorOptions;
  private readonly hooks: EditorHooks;
  private events: ReadonlyMap<string, Event>;
  private readonly schema: Schema;
  private readonly view: EditorView;
  private readonly extensions: ExtensionManager;
  private readonly pandocConverter: PandocConverter;

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
    this.pandocConverter = new PandocConverter(
      this.schema,
      this.extensions.pandocReaders(),
      this.extensions.pandocNodeWriters(),
      this.extensions.pandocMarkWriters(),
      config.pandoc,
      {
        reader: {},
        writer: {
          atxHeaders: true,
          wrapColumn: 100,
        },
      },
    );

    // apply devtools if they are available
    if (this.hooks.applyDevTools) {
      this.hooks.applyDevTools(this.view, { EditorState });
    }

    // focus editor immediately if requested
    if (this.options.autoFocus) {
      setTimeout(() => {
        this.focus();
      }, 10);
    }
  }

  public destroy() {
    this.view.destroy();
  }

  public subscribe(event: string, handler: VoidFunction): VoidFunction {
    if (!this.events.has(event)) {
      const valid = Array.from(this.events.keys()).join(', ');
      throw new Error(`Unknown event ${event}. Valid events are ${valid}`);
    }
    this.parent.addEventListener(event, handler);
    return () => {
      this.parent.removeEventListener(event, handler);
    };
  }

  public setMarkdown(markdown: string, emitUpdate = true): Promise<void> {
    return this.pandocConverter.toProsemirror(markdown).then((doc: ProsemirrorNode) => {
      // re-initialize editor state
      this.state = EditorState.create({
        schema: this.state.schema,
        doc,
        plugins: this.state.plugins,
      });
      this.view.updateState(this.state);

      // notify listeners if requested
      if (emitUpdate) {
        this.emitEvent(kEventUpdate);
        this.emitEvent(kEventSelectionChange);
      }
    });
  }

  public getMarkdown(): Promise<string> {
    return this.pandocConverter.fromProsemirror(this.state.doc);
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
    this.emitEvent(kEventSelectionChange);

    // notify listeners of updates
    if (transaction.docChanged) {
      this.emitEvent(kEventUpdate);
    }
  }

  private emitEvent(name: string) {
    const event = this.events.get(name);
    if (event) {
      this.parent.dispatchEvent(event);
    }
  }

  private initEvents(): ReadonlyMap<string, Event> {
    const events = new Map<string, Event>();
    events.set(kEventUpdate, new Event(kEventUpdate));
    events.set(kEventSelectionChange, new Event(kEventSelectionChange));
    return events;
  }

  private initSchema(): Schema {
    // build in doc node + nodes from extensions
    const nodes: { [name: string]: NodeSpec } = {
      doc: {
        content: 'body notes',
      },

      body: {
        content: 'block+',
        parseDOM: [{ tag: 'div[class="body"]' }],
        toDOM() {
          return ['div', { class: 'body' }, 0];
        },
      },

      notes: {
        content: 'note*',
        parseDOM: [{ tag: 'div[class="notes"]' }],
        toDOM() {
          return ['div', { class: 'notes' }, 0];
        },
      },

      note: {
        content: 'block+',
        attrs: {
          id: {},
        },
        parseDOM: [
          {
            tag: 'div[class="note"]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                id: el.getAttribute('id'),
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return ['div', { id: node.attrs.id, class: 'note' }, 0];
        },
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
    const commands: readonly Command[] = this.extensions.commands(this.schema, this.ui);
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

  private emptyDoc(): ProsemirrorNode {
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
