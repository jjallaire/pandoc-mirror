import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { Command, commandInsertNode } from '../api/command';
import { IExtension } from '../api/extension';


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
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
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
