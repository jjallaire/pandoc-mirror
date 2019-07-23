

import { Schema } from "prosemirror-model"
import { EditorState, Transaction, Plugin } from "prosemirror-state"
import { EditorView } from "prosemirror-view"

import { undo, redo, history } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { baseKeymap } from "prosemirror-commands"
import { gapCursor } from "prosemirror-gapcursor"
import { dropCursor } from "prosemirror-dropcursor"

import { pandocSchema, pandocEmptyDoc } from './schema'

export class Editor {

  private parent: HTMLElement
  private schema: Schema
  private state: EditorState
  private view: EditorView

  constructor(parent: HTMLElement) {
    
    this.parent = parent
    
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

  }

  public destroy() {
    this.view.destroy()
  }

  private basePlugins() : Plugin[] {
    return [
      history(),
      keymap(baseKeymap),
      keymap({"Mod-z": undo, "Mod-y": redo}),
      gapCursor(),
      dropCursor()
    ]
  } 

  private dispatchTransaction(transaction: Transaction) {
    this.state = this.state.apply(transaction)
    this.view.updateState(this.state)
  }

}