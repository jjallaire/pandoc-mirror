import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { MarkdownSerializerState } from 'prosemirror-markdown';

import { IExtension, Command } from '../api';
import { commandInsertNode } from 'src/utils/command';

const extension: IExtension = {
  nodes: [
    {
      name: 'horizontal_rule',
      spec: {
        group: 'block',
        parseDOM: [{ tag: 'hr' }],
        toDOM() {
          return ['div', ['hr']];
        },
      },
      pandoc: {
        from: [
          {
            token: 'HorizontalRule',
            node: 'horizontal_rule',
          },
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode, parent: ProsemirrorNode, index: number) => {
          state.write(node.attrs.markup || '---');
          state.closeBlock(node);
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], commandInsertNode(schema.nodes.horizontal_rule))];
  },
};

export default extension;
