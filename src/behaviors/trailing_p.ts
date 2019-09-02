import { Plugin, PluginKey, EditorState, Transaction, Selection } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { Schema } from 'prosemirror-model';
import { findParentNodeOfType } from 'prosemirror-utils';

const plugin = new PluginKey('trailingp');

const extension: Extension = {
  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        view: () => ({
          update: view => {
            const { state } = view;
            const insertNodeAtEnd = plugin.getState(state);
            if (!insertNodeAtEnd) {
              return;
            }

            // insert paragraph at the end of the body
            const { doc, tr } = state;
            const type = schema.nodes.paragraph;
            const body = doc.content.child(0);
            const transaction = tr.insert(body.nodeSize - 1, type.create());
            view.dispatch(transaction);
          },
        }),
        state: {
          init: (_config, state: EditorState) => {
            return insertTrailingP(state.selection, schema);
          },
          apply: (tr: Transaction, value: any) => {
            if (!tr.docChanged) {
              return value;
            }
            return insertTrailingP(tr.selection, schema);
          },
        },
      }),
    ];
  },
};

function insertTrailingP(selection: Selection, schema: Schema) {
  const editingRoot = findParentNodeOfType(schema.nodes.body)(selection);
  if (editingRoot) {
    return !isParagraphNode(editingRoot.node.lastChild, schema);
  } else {
    return false;
  }
}

function isParagraphNode(node: ProsemirrorNode | null | undefined, schema: Schema) {
  if (node) {
    return node.type === schema.nodes.paragraph;
  } else {
    return false;
  }
}

export default extension;
