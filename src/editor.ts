

import { Schema } from "prosemirror-model"
import { EditorState, Transaction, Plugin, PluginKey, NodeSelection } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"
import { gapCursor } from "prosemirror-gapcursor"
import { dropCursor } from "prosemirror-dropcursor"

import { pandocSchema, pandocEmptyDoc } from './schema'

export enum SelectionType {
  Text = 'text',
  Node = 'node'
}

export interface IEditorOptions {
  autoFocus?: boolean,
  editable?: boolean
}

export interface IEditorHooks {
  isEditable?: () => boolean,
  onUpdate?: () => void,
  onSelectionChange?: (type: SelectionType) => void
}

export class Editor {

  private parent: HTMLElement
  private options: IEditorOptions
  private hooks: IEditorHooks
  private schema: Schema
  private state: EditorState
  private view: EditorView
  
  constructor(parent: HTMLElement, options?: IEditorOptions, hooks?: IEditorHooks) {
    
    this.parent = parent
    this.options = options || {}
    this.hooks = hooks || {}
    this.initHooks()
    
    this.schema = pandocSchema()

    this.state = EditorState.create({
      schema: this.schema,
      doc: pandocEmptyDoc(this.schema),
      plugins: [...this.basePlugins()]
    })

    this.view = new EditorView(this.parent, { 
      state: this.state,
      dispatchTransaction: this.dispatchTransaction.bind(this)
    })

    if (this.options.autoFocus) {
      setTimeout(() => {
        this.focus()
      }, 10)
    }

  }

  public destroy() {
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
      this.hooks.isEditable = () => {
        if (this.options.editable !== undefined) {
          return this.options.editable;
        } else {
          return true
        }
      }
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