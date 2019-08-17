import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { PandocAstToken } from 'api/pandoc';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';

const extension: Extension = {
  nodes: [
    {
      name: 'text',
      spec: {
        group: 'inline',
        toDOM(node: ProsemirrorNode): any {
          return node.text;
        },
      },
      pandoc: {
        ast_readers: [
          { token: 'Str', text: true, getText: (tok: PandocAstToken) => tok.c },
          { token: 'Space', text: true, getText: () => ' ' },
        ],
        ast_writer: (state: AstSerializerState, node: ProsemirrorNode) => {
          state.renderText(node.textContent);
        },
        markdown_writer: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.text(node.text as string);
        },
      },
    },
  ],
};

export default extension;
