import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { Command, insertNode } from 'api/command';
import { Extension } from 'api/extension';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';

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
        ast_readers: [
          {
            token: 'HorizontalRule',
            node: 'horizontal_rule',
          },
        ],
        ast_writer: (state: AstSerializerState) => {
          state.renderToken('HorizontalRule');
        },
        markdown_writer: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
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
