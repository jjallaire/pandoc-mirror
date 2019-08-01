
import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { NodeSpec, NodeType, MarkSpec, MarkType, Schema } from "prosemirror-model"
import { InputRule } from "prosemirror-inputrules"
import { toggleMark } from "prosemirror-commands"

import { markIsActive, nodeIsActive, toggleList, toggleBlockType, toggleWrap } from '../utils'

export interface IExtension {
  marks?: IMark[],
  nodes?: INode[],
  commands?: (schema: Schema) => Command[]
  inputRules?: (schema: Schema) => InputRule[]
}

export interface IMark {
  name: string,
  spec: MarkSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
}

export interface INode {
  name: string,
  spec: NodeSpec,
  pandoc: {
    from: IPandocReader,
    to: IPandocWriter
  }
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
  getAttrs?: (tok: IPandocToken) => any,
  getChildren?: (tok: IPandocToken) => any[],
  getText?: (tok: IPandocToken) => string
}

export interface IPandocToken {
  t: string,
  c: any
}

// tslint:disable-next-line:no-empty-interface
export interface IPandocWriter {
  
}

export type CommandFn = (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) => boolean

export class Command {
 
  public name: string
  public keymap: string[] | null
  public execute: CommandFn

  constructor(name: string, keymap: string[] | null, execute: CommandFn) {
    this.name = name
    this.keymap = keymap
    this.execute = execute;
  }

  public isEnabled(state: EditorState) : boolean {
    return this.execute(state);
  }

  public isActive(state: EditorState) : boolean {
    return false;
  }
}


export class MarkCommand extends Command {
  
  public markType: MarkType;
  public attrs: object

  constructor(name: string, keymap: string[] | null, markType: MarkType, attrs = {}) {
    super(name, keymap, toggleMark(markType, attrs) as CommandFn);
    this.markType = markType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return markIsActive(state, this.markType);
  }
}

export class NodeCommand extends Command {

  public nodeType: NodeType
  public attrs: object

  constructor(name: string, keymap: string[] | null, nodeType: NodeType, attrs: object, execute: CommandFn ) {
    super(name, keymap, execute);
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








