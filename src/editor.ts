

import { Schema } from "prosemirror-model"
import { EditorState, Transaction, Plugin, PluginKey, NodeSelection } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap, joinUp, joinDown, lift, selectParentNode } from "prosemirror-commands"
import { gapCursor } from "prosemirror-gapcursor"
import { dropCursor } from "prosemirror-dropcursor"
import { undoInputRule } from "prosemirror-inputrules"

import { IPandoc } from './pandoc.js'
import { ExtensionManager } from './extensions/manager'

import { pandocSchema, pandocEmptyDoc } from './schema'
import { CommandFn, Command } from "./extensions/api.js";

const mac = typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false

export enum SelectionType {
  Text = 'text',
  Node = 'node'
}

export interface IEditorOptions {
  autoFocus?: boolean,
}

export interface IEditorHooks {
  isEditable?: () => boolean,
  onUpdate?: () => void,
  onSelectionChange?: (type: SelectionType) => void
}

export interface IEditorConfig {
  parent: HTMLElement,
  pandoc: IPandoc,
  options?: IEditorOptions,
  hooks?: IEditorHooks
}

export interface IEditorCommand {
  name: string,
  isEnabled: () => boolean,
  isActive: () => boolean,
  execute: () => void
}
export interface IEditorCommands { [name: string] : IEditorCommand } 

export class Editor {

  private parent: HTMLElement
  private pandoc: IPandoc
  private options: IEditorOptions
  private hooks: IEditorHooks
  private schema: Schema
  private state: EditorState
  private view: EditorView
  private extensions: ExtensionManager
  private onClickBelow: (ev: MouseEvent) => void
  
  constructor(config: IEditorConfig) {
    
    this.parent = config.parent
    this.pandoc = config.pandoc
    this.options = config.options || {}
    
    this.hooks = config.hooks || {}
    this.initHooks()
    
    this.extensions = ExtensionManager.create()

    this.schema = pandocSchema(this.extensions)

    
    this.state = EditorState.create({
      schema: this.schema,
      doc: pandocEmptyDoc(this.schema),
      plugins: [...this.basePlugins()]
    })

    this.view = new EditorView(this.parent, { 
      state: this.state,
      dispatchTransaction: this.dispatchTransaction.bind(this)
    })

    this.onClickBelow = () => this.focus()
    this.parent.addEventListener("click", this.onClickBelow)

    if (this.options.autoFocus) {
      setTimeout(() => {
        this.focus()
      }, 10)
    }

  }

  public destroy() {
    this.parent.removeEventListener("click", this.onClickBelow)
    this.view.destroy()
  }

  public focus() {
    this.view.focus()
  }

  public blur() {
    (this.view.dom as HTMLElement).blur()
  }

  public commands() : IEditorCommands  {
    return this.extensions.commands(this.schema).reduce((commands: IEditorCommands, command: Command) => {
      return {
        ...commands,
        [command.name]: {
          name: command.name,
          isActive: () => command.isActive(this.state),
          isEnabled: () => command.isEnabled(this.state),
          execute: () => command.execute(this.state, this.view.dispatch, this.view)
        }
      }
    }, {})
  }

  private dispatchTransaction(transaction: Transaction) {
    
    // apply the transaction
    this.state = this.state.apply(transaction)
    this.view.updateState(this.state)

    // notify listeners of selection change
    this.emitSelectionChanged();
   
    // notify listeners of updates
    if (transaction.docChanged) {
      this.emitUpdate();
    }
  }

  private emitSelectionChanged() {
    if (this.hooks.onSelectionChange) {
      this.hooks.onSelectionChange(
        (this.state.selection instanceof NodeSelection) ? SelectionType.Node : SelectionType.Text
      );
    }
  }

  private emitUpdate() {
    if (this.hooks.onUpdate) {
      this.hooks.onUpdate()
    }
  }

  private initHooks() {
    if (this.hooks.isEditable === undefined) {
      this.hooks.isEditable = () => true
    }
  }

  private basePlugins() : Plugin[] {
    return [
      history(),
      ...this.keymapPlugins(),
      gapCursor(),
      dropCursor(),
      new Plugin({
        key: new PluginKey('editable'),
        props: {
          editable: this.hooks.isEditable
        },
      }),
    ]
  } 

  private keymapPlugins() : Plugin[] {

    // start with standard editing keys
    const keys : { [key: string] : CommandFn } = {};
    function bindKey(key: string, cmd: CommandFn) {
      keys[key] = cmd;
    }
    bindKey("Mod-z", undo);
    bindKey("Shift-Mod-z", redo);
    if (!mac) {
      bindKey("Mod-y", redo);
    }
    bindKey("Backspace", undoInputRule);
    bindKey("Alt-ArrowUp", joinUp)
    bindKey("Alt-ArrowDown", joinDown)
    bindKey("Mod-BracketLeft", lift)
    bindKey("Escape", selectParentNode)

    // keys from extensions
    const commands : Command[] = this.extensions.commands(this.schema);
    commands.forEach((command: Command) => {
      if (command.keymap) {
        command.keymap.forEach((key: string) => bindKey(key, command.execute))
      }
    });

    return [
      keymap(baseKeymap),
      keymap(keys),
    ]
  }
}