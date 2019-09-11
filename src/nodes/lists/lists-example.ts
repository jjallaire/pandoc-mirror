import { Schema } from "prosemirror-model";
import { Transaction, EditorState } from "prosemirror-state";

import { ListNumberStyle } from './lists';
import { findChildrenByType } from "prosemirror-utils";

export function exampleListsAppendTransaction(schema: Schema) {
  return (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {
    
    if (transactions.some(transaction => transaction.docChanged)) {

      // create transaction
      const tr = newState.tr;

      // find all example lists
      const exampleLists = findChildrenByType(newState.doc, schema.nodes.ordered_list)
         .filter(nodeWithPos => nodeWithPos.node.attrs.number_style === ListNumberStyle.Example);

      // set their order
      let order = 1;
      exampleLists.forEach(nodeWithPos => {
        tr.setNodeMarkup(nodeWithPos.pos, nodeWithPos.node.type, {
          ...nodeWithPos.node.attrs,
          order
        });
        order += findChildrenByType(nodeWithPos.node, schema.nodes.list_item).length;
      });

      // return transaction
      if (tr.docChanged || tr.selectionSet) {
        return tr;
      }
    }

  };
}

