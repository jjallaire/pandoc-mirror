

import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { NodeSpec, NodeType, MarkSpec, MarkType } from "prosemirror-model"

export interface IEditorCommand {
  name: string
  keymap: string
  isEnabled: (state: EditorState) => boolean
  isActive: (state: EditorState) => boolean
  execute: (state: EditorState, dispatch?: Transaction, view?: EditorView) => boolean
}

export interface IPandocReader {
  // pandoc token name (e.g. "Str", "Emph", etc.)
  token: string,

  // one and only one of these values must also be set
  node?: string,
  block?: string,
  list?: string,
  mark?: string,
  text?: boolean,

  // functions for getting attributes and children
  getAttrs?: (tok: object) => object,
  getChildren?: (tok: object) => []
}

// tslint:disable-next-line:no-empty-interface
export interface IPandocWriter {
  
}

export interface IEditorMark {
  name: string,
  spec: MarkSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
  command: (type: MarkType) => IEditorCommand
}

export interface IEditorNode {
  name: string,
  spec: NodeSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
  command: (type: NodeType) => IEditorCommand
}

export interface IEditorExtension {
  marks?: IEditorMark[],
  nodes?: IEditorNode[]
}






