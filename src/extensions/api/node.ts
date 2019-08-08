import { Node, NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';
import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';
import { IPandocReader, PandocNodeWriterFn } from './pandoc';


export interface INode {
  name: string;
  spec: NodeSpec;
  pandoc: {
    from?: IPandocReader[];
    to: PandocNodeWriterFn;
  };
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