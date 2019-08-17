import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { PandocAstToken } from 'src/api/pandoc';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';

const extension: Extension = {
  nodes: [
    {
      name: 'soft_break',
      spec: {
        inline: true,
        content: 'text*',
        group: 'inline',
        parseDOM: [{ tag: "span[class='soft-break']" }],
        toDOM() {
          return ['span', { class: 'soft-break' }, 0];
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'SoftBreak',
            node: 'soft_break',
            getText: (tok: PandocAstToken) => ' ',
          },
        ],
        ast_writer: (state: AstSerializerState) => {
          state.renderToken("SoftBreak");
        },
        markdown_writer: (
          state: MarkdownSerializerState,
          node: ProsemirrorNode,
          parent: ProsemirrorNode,
          index: number,
        ) => {
          state.text('\n');
        },
      },
    },
  ],
};

export default extension;
