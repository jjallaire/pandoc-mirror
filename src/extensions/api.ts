
import { EditorState, Plugin } from "prosemirror-state"
import { NodeSpec, NodeType, MarkSpec, MarkType, Schema } from "prosemirror-model"
import { InputRule } from "prosemirror-inputrules"
import { toggleMark } from "prosemirror-commands"

import { CommandFn } from '../utils/command'

import { nodeIsActive } from '../utils/node'
import { markIsActive } from '../utils/mark'
import { commandToggleList, commandToggleBlockType, commandToggleWrap } from '../utils/command'



export interface IExtension {
  marks?: IMark[]
  nodes?: INode[]
  keymap?: (schema: Schema, mac: boolean) => { [key: string] : CommandFn }
  commands?: (schema: Schema, ui: IEditorUI) => Command[]
  inputRules?: (schema: Schema) => InputRule[]
  plugins?: (schema: Schema, ui: IEditorUI) => Plugin[]
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
  pandoc?: {
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
    super(name, keymap, listType, {}, commandToggleList(listType, listItemType));
  }

}

export class BlockCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, blockType: NodeType, toggleType: NodeType, attrs = {}) {
    super(name, keymap, blockType, attrs, commandToggleBlockType(blockType, toggleType, attrs));
  }
}

export class WrapCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, wrapType: NodeType) {
    super(name, keymap, wrapType, {}, commandToggleWrap(wrapType));
  }
}

export interface IEditorUI {
  onEditLink: ILinkEditor,
  onEditImage: IImageEditor
}

export type ILinkEditor = (link: ILinkProps) => Promise<ILinkEditResult | null>
export type IImageEditor = (image: IImageProps) => Promise<IImageEditResult | null>

export interface ILinkProps {
  href: string,
  title?: string
}

export interface ILinkEditResult {
  action: 'edit' | 'remove',
  link: ILinkProps
}

export interface IImageProps {
  src: string | null,
  title?: string,
  alt?: string
}

type IImageEditResult = IImageProps









