

import { Schema } from "prosemirror-model"
import { EditorState, Transaction, Plugin, PluginKey, NodeSelection } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"
import { gapCursor } from "prosemirror-gapcursor"
import { dropCursor } from "prosemirror-dropcursor"

import { IPandoc } from './pandoc.js'
import { ExtensionManager } from './extensions/manager'

import { pandocSchema, pandocEmptyDoc } from './schema'

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
      keymap(baseKeymap),
      keymap({"Mod-z": undo, "Mod-y": redo}),
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

  

}