

import { EditorCommand, EditorCommandFn } from './command'

import { NodeType } from "prosemirror-model"
import { EditorState } from 'prosemirror-state';


import { findParentNode, findSelectedNodeOfType } from "prosemirror-utils"



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

export function nodeIsActive(state: EditorState, type: NodeType, attrs = {}) {
  const predicate = (n: any) => n.type === type
  const node = findSelectedNodeOfType(type)(state.selection)
    || findParentNode(predicate)(state.selection)

  if (!Object.keys(attrs).length || !node) {
    return !!node
  }

  return node.node.hasMarkup(type, attrs)
}