import { Transaction, EditorState } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { NodeTraversalFn } from 'api/node';

// get all nodes affected by a set of transactions
export function transactionNodesAffected(state: EditorState, transactions: Transaction[], f: NodeTraversalFn) {
  transactions.forEach(transaction => {
    if (transaction.docChanged) {
      // mask out changes that don't affect contents (e.g. selection)
      transaction.steps.forEach(step => {
        step.getMap().forEach((_oldStart: number, _oldEnd: number, newStart: number, newEnd: number) => {
          state.doc.nodesBetween(newStart, newEnd, f);
        });
      });
    }
  });
}
