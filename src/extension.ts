
import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { NodeSpec, NodeType, MarkSpec, MarkType, Schema } from "prosemirror-model"
import { toggleMark } from "prosemirror-commands"

import { markIsActive, nodeIsActive, toggleList, toggleBlockType, toggleWrap } from './utils'

export interface IEditorExtension {
  marks?: IEditorMark[],
  nodes?: IEditorNode[]
}

export function markExtension(mark: IEditorMark) : IEditorExtension {
  return {
    marks: [mark]
  }
}

export function nodeExtension(node: IEditorNode) : IEditorExtension {
  return {
    nodes: [node]
  }
}


export interface IEditorMark {
  name: string,
  spec: MarkSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
  command: (schema: Schema) => IEditorCommand
}

export interface IEditorNode {
  name: string,
  spec: NodeSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
  command: (schema: Schema) => IEditorCommand
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

export type EditorCommandFn = (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) => boolean

export interface IEditorCommand {
  name: string
  keymap: string[] | null
  isEnabled: (state: EditorState) => boolean
  isActive: (state: EditorState) => boolean
  execute: EditorCommandFn
}

export class EditorCommand implements IEditorCommand {
 
  public name: string
  public keymap: string[] | null
  public command: EditorCommandFn

  constructor(name: string, keymap: string[] | null, command: EditorCommandFn) {
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

  public execute(state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) {
    return this.command(state, dispatch, view);
  }
}


export class MarkCommand extends EditorCommand {
  
  public markType: MarkType;
  public attrs: object

  constructor(name: string, keymap: string[] | null, markType: MarkType, attrs = {}) {
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

  constructor(name: string, keymap: string[] | null, nodeType: NodeType, attrs: object, command: EditorCommandFn ) {
    super(name, keymap, command);
    this.nodeType = nodeType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return nodeIsActive(state, this.nodeType, this.attrs);
  }
}

export class ListCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, listType: NodeType, listItemType: NodeType) {
    super(name, keymap, listType, {}, toggleList(listType, listItemType));
  }

}

export class BlockCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, blockType: NodeType, toggleType: NodeType, attrs = {}) {
    super(name, keymap, blockType, attrs, toggleBlockType(blockType, toggleType, attrs));
  }
}

export class WrapCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, wrapType: NodeType) {
    super(name, keymap, wrapType, {}, toggleWrap(wrapType));
  }
}








