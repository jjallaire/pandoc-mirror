import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { Command, insertNode } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
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
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.write(node.attrs.markup || '---');
          state.closeBlock(node);
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], insertNode(schema.nodes.horizontal_rule))];
  },
};

export default extension;
