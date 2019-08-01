
import { EditorState } from 'prosemirror-state';
import { Node, NodeType } from "prosemirror-model"
import { findParentNode, findSelectedNodeOfType } from "prosemirror-utils"


export function nodeIsActive(state: EditorState, type: NodeType, attrs = {}) {
  const predicate = (n: Node) => n.type === type
  const node = findSelectedNodeOfType(type)(state.selection)
    || findParentNode(predicate)(state.selection)

  if (!Object.keys(attrs).length || !node) {
    return !!node
  }

  return node.node.hasMarkup(type, attrs)
}

export function canInsertNode(state: EditorState, nodeType: NodeType) {
  const $from = state.selection.$from
  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d)
    if ($from.node(d).canReplaceWith(index, index, nodeType)) {
      return true
    }
  }
  return false
}
