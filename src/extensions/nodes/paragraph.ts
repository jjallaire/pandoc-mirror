import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { MarkdownSerializerState } from 'prosemirror-markdown';

import { IExtension, BlockCommand } from '../api';

const extension: IExtension = {
  nodes: [
    {
      name: 'paragraph',
      spec: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{ tag: 'p' }],
        toDOM() {
          return ['p', 0];
        },
      },
      pandoc: {
        from: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.renderInline(node);
          state.closeBlock(node);
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new BlockCommand('paragraph', ['Shift-Ctrl-0'], schema.nodes.paragraph, schema.nodes.paragraph)];
  },
};

export default extension;
