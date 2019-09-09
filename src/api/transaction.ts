import { Transaction, EditorState } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { ChangeSet } from 'prosemirror-changeset';

export function transactionsHaveChange(
  transactions: Transaction[],
  oldState: EditorState,
  newState: EditorState,
  predicate: (node: ProsemirrorNode<any>, pos: number, parent: ProsemirrorNode<any>, index: number) => boolean,
  changes?: "all" | "removed" | "added",
) {
  // screen out transactions with no doc changes
  if (!transactions.some(transaction => transaction.docChanged)) {
    return false;
  }

  // set changes to "all" if it's not specified
  if (!changes) {
    changes = "all";
  }

  // function to check for whether we have a change and set a flag if we do
  let haveChange = false;
  const checkForChange = (node: ProsemirrorNode<any>, pos: number, parent: ProsemirrorNode<any>, index: number) => {
    if (predicate(node, pos, parent, index)) {
      haveChange = true;
      return false;
    }
  };

  // for each change in each transaction, check for a node that matches the predicate in either the old or new doc
  for (const transaction of transactions) {
    const changeSet = ChangeSet.create(oldState.doc).addSteps(newState.doc, transaction.mapping.maps);
    for (const change of changeSet.changes) {
      if (changes === "all" || changes === "removed") {
        oldState.doc.nodesBetween(change.fromA, change.toA, checkForChange);
      }
      if (changes === "all" || changes === "added") {
        newState.doc.nodesBetween(change.fromB, change.toB, checkForChange);
      }
      if (haveChange) {
        break;
      }
    }
    if (haveChange) {
      break;
    }
  }

  return haveChange;
}
