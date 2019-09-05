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

            // insert paragraph at the end of the editing root
            const tr = state.tr;
            const type = schema.nodes.paragraph;
            const editingNode = editingRootNode(tr.selection, schema);
            if (editingNode) {
              tr.insert(editingNode.pos + editingNode.node.nodeSize - 1, type.create());
              view.dispatch(tr);
            }
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
  const editingRoot = editingRootNode(selection, schema);
  if (editingRoot) {
    return !isParagraphNode(editingRoot.node.lastChild, schema);
  } else {
    return false;
  }
}

function editingRootNode(selection: Selection, schema: Schema) {
  return findParentNodeOfType(schema.nodes.body)(selection) ||
         findParentNodeOfType(schema.nodes.note)(selection);
}

function isParagraphNode(node: ProsemirrorNode | null | undefined, schema: Schema) {
  if (node) {
    return node.type === schema.nodes.paragraph;
  } else {
    return false;
  }
}

export default extension;
