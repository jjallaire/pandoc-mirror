import { Node, NodeSpec, NodeType, Schema } from 'prosemirror-model';
import { EditorState, Selection, NodeSelection, Transaction } from 'prosemirror-state';
import { findParentNode, findSelectedNodeOfType, ContentNodeWithPos, findParentNodeOfType } from 'prosemirror-utils';

import { PandocTokenReader, PandocNodeWriterFn } from './pandoc';

export interface PandocNode {
  readonly name: string;
  readonly spec: NodeSpec;
  readonly pandoc: {
    readonly readers?: readonly PandocTokenReader[];
    readonly writer: PandocNodeWriterFn;
  };
}

export type NodeTraversalFn = (node: Node, pos: number, parent: Node, index: number) => boolean | void | null | undefined;

export function findEditingRootNode(selection: Selection, schema: Schema) {
  return findParentNodeOfType(schema.nodes.note)(selection) || findParentNodeOfType(schema.nodes.body)(selection);
}

export function findNodeOfTypeInSelection(selection: Selection, type: NodeType) : ContentNodeWithPos | undefined {
  return findSelectedNodeOfType(type)(selection) || findParentNode((n: Node) => n.type === type)(selection);
}

export function nodeIsActive(state: EditorState, type: NodeType, attrs = {}) {
  const predicate = (n: Node) => n.type === type;
  const node = findSelectedNodeOfType(type)(state.selection) || findParentNode(predicate)(state.selection);

  if (!Object.keys(attrs).length || !node) {
    return !!node;
  }

  return node.node.hasMarkup(type, attrs);
}

export function canInsertNode(state: EditorState, nodeType: NodeType) {
  const $from = state.selection.$from;
  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) {
      return true;
    }
  }
  return false;
}

export function insertAndSelectNode(node: Node, state: EditorState, dispatch: (tr: Transaction<any>) => void) {
  // create new transaction
  const tr = state.tr;

  // insert the node over the existing selection
  tr.replaceSelectionWith(node);

  // select node
  // (https://discuss.prosemirror.net/t/how-to-select-a-node-immediately-after-inserting-it/1566)
  if (tr.selection.$anchor.nodeBefore) {
    const resolvedPos = tr.doc.resolve(tr.selection.anchor - tr.selection.$anchor.nodeBefore.nodeSize);
    tr.setSelection(new NodeSelection(resolvedPos));
  }

  // dispatch transaction
  dispatch(tr);
}
