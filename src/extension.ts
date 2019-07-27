
import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { NodeSpec, NodeType, MarkSpec, MarkType } from "prosemirror-model"
import { toggleMark } from "prosemirror-commands"

import { markIsActive, nodeIsActive } from './utils'

export interface IEditorExtension {
  marks?: IEditorMark[],
  nodes?: IEditorNode[]
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


export interface IEditorCommand {
  name: string
  keymap: string
  isEnabled: (state: EditorState) => boolean
  isActive: (state: EditorState) => boolean
  execute: (state: EditorState, dispatch?: Transaction, view?: EditorView) => boolean
}

type EditorCommandFn = (state: EditorState, dispatch?: Transaction, view?: EditorView) => boolean

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


export class MarkCommand extends EditorCommand {
  
  public markType: MarkType;
  public attrs: object

  constructor(name: string, keymap: string, markType: MarkType, attrs = {}) {
    super(name, keymap, toggleMark(markType, attrs) as EditorCommandFn);
    this.markType = markType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return markIsActive(state, this.markType);
  }
}

export class NodeCommand extends EditorCommand {

  public nodeType: NodeType
  public attrs: object

  constructor(name: string, keymap: string, nodeType: NodeType, attrs: object, command: EditorCommandFn ) {
    super(name, keymap, command);
    this.nodeType = nodeType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return nodeIsActive(state, this.nodeType, this.attrs);
  }

}







