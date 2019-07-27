import { MarkType } from "prosemirror-model"
import { EditorState } from 'prosemirror-state';
import { Node, NodeType } from "prosemirror-model"
import { findParentNode, findSelectedNodeOfType } from "prosemirror-utils"

export function markIsActive(state: EditorState, type: MarkType) {
  const {
    from,
    $from,
    to,
    empty,
  } = state.selection

  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks())
  }

  return !!state.doc.rangeHasMark(from, to, type)
}

export function nodeIsActive(state: EditorState, type: NodeType, attrs = {}) {
  const predicate = (n: Node) => n.type === type
  const node = findSelectedNodeOfType(type)(state.selection)
    || findParentNode(predicate)(state.selection)

  if (!Object.keys(attrs).length || !node) {
    return !!node
  }

  return node.node.hasMarkup(type, attrs)
}


