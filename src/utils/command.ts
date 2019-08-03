import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { Node, NodeType } from 'prosemirror-model';
import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';
import { wrapInList, liftListItem } from 'prosemirror-schema-list';
import { EditorView } from 'prosemirror-view';
import { setBlockType, wrapIn, lift } from 'prosemirror-commands';

import { nodeIsActive, canInsertNode } from './node';
import { Command } from 'src/extensions/api';

export type CommandFn = (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => boolean;

export function commandToggleList(listType: NodeType, itemType: NodeType): CommandFn {
  function isList(node: Node, schema: Schema) {
    return (
      node.type === schema.nodes.bullet_list ||
      node.type === schema.nodes.ordered_list ||
      node.type === schema.nodes.todo_list
    );
  }

  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    const { schema, selection } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) {
      return false;
    }

    const parentList = findParentNode(node => isList(node, schema))(selection);

    if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
      if (parentList.node.type === listType) {
        return liftListItem(itemType)(state, dispatch);
      }

      if (isList(parentList.node, schema) && listType.validContent(parentList.node.content)) {
        const tr: Transaction = state.tr;
        tr.setNodeMarkup(parentList.pos, listType);

        if (dispatch) {
          dispatch(tr);
        }

        return false;
      }
    }

    return wrapInList(listType)(state, dispatch);
  };
}

export function commandToggleBlockType(type: NodeType, toggletype: NodeType, attrs = {}): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
    const isActive = nodeIsActive(state, type, attrs);

    if (isActive) {
      return setBlockType(toggletype)(state, dispatch);
    }

    return setBlockType(type, attrs)(state, dispatch);
  };
}

export function commandToggleWrap(type: NodeType): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    const isActive = nodeIsActive(state, type);

    if (isActive) {
      return lift(state, dispatch);
    }

    return wrapIn(type)(state, dispatch);
  };
}

export function commandInsertNode(nodeType: NodeType, attrs = {}): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
    if (!canInsertNode(state, nodeType)) {
      return false;
    }

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(nodeType.create(attrs)));
    }

    return true;
  };
}
