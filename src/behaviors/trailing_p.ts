

import { Plugin, PluginKey, EditorState, Transaction } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { Schema } from 'prosemirror-model';
import { Editor } from 'editor';

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

          const { doc, tr } = state;
          const type = schema.nodes.paragraph;
          const transaction = tr.insert(doc.content.size, type.create());
          view.dispatch(transaction);
        },
      }),
      state: {
        init: (_config, state: EditorState) => {
          return !isParagraphNode(state.tr.doc.lastChild, schema);
        },
        apply: (tr: Transaction, value: any) => {
          if (!tr.docChanged) {
            return value;
          }
          return !isParagraphNode(tr.doc.lastChild, schema);
        }
      }
    }),
   ];
  },
};

function isParagraphNode(node: ProsemirrorNode | null | undefined, schema: Schema) {
  if (node) {
    return node.type === schema.nodes.paragraph;
  } else {
    return false;
  }
}

export default extension;
