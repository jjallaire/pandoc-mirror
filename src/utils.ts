import { MarkType, Schema } from "prosemirror-model"
import { EditorState, Transaction } from 'prosemirror-state';
import { Node, NodeType } from "prosemirror-model"
import { findParentNode, findSelectedNodeOfType } from "prosemirror-utils"
import { wrapInList, liftListItem } from 'prosemirror-schema-list'
import { EditorView } from "prosemirror-view";
import { setBlockType, wrapIn, lift } from 'prosemirror-commands'

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

export function toggleList(listType: NodeType, itemType: NodeType) {
  
  function isList(node: Node, schema: Schema) {
    return (node.type === schema.nodes.bullet_list
      || node.type === schema.nodes.ordered_list
      || node.type === schema.nodes.todo_list)
  }
  
  return (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) => {
    const { schema, selection } = state
    const { $from, $to } = selection
    const range = $from.blockRange($to)

    if (!range) {
      return false
		}

    const parentList = findParentNode(node => isList(node, schema))(selection)

    if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
      if (parentList.node.type === listType) {
        return liftListItem(itemType)(state, dispatch)
      }

      if (isList(parentList.node, schema) && listType.validContent(parentList.node.content)) {
        const tr : Transaction  = state.tr
        tr.setNodeMarkup(parentList.pos, listType)

        if (dispatch) {
          dispatch(tr)
        }

        return false
      }
    }

    return wrapInList(listType)(state, dispatch)
  }
}


export function toggleBlockType(type: NodeType, toggletype: NodeType, attrs = {}) {
  return (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView)=> {
    const isActive = nodeIsActive(state, type, attrs)

    if (isActive) {
      return setBlockType(toggletype)(state, dispatch)
    }

    return setBlockType(type, attrs)(state, dispatch)
  }
}

export function toggleWrap(type: NodeType) {
  
  return (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) => {
    const isActive = nodeIsActive(state, type)

    if (isActive) {
      return lift(state, dispatch)
    }

    return wrapIn(type)(state, dispatch)
  }
}

