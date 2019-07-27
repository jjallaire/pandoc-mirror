
import { IEditorCommand } from './index'

import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"

export type EditorCommandFn = (state: EditorState, dispatch?: Transaction, view?: EditorView) => boolean

export class EditorCommand implements IEditorCommand {
 
  public name: string
  public keymap: string
  public command: EditorCommandFn

  constructor(name: string, keymap: string, command: EditorCommandFn) {
    this.name = name
    this.keymap = keymap
    this.command = command;
  }

  public isEnabled(state: EditorState) : boolean {
    return this.command(state);
  }

  public isActive(state: EditorState) : boolean {
    return false;
  }

  public execute(state: EditorState, dispatch?: Transaction, view?: EditorView) {
    return this.command(state, dispatch, view);
  }
}