import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { PandocAstToken } from 'api/pandoc';

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
        from: [
          { token: 'Str', text: true, getText: (tok: PandocAstToken) => tok.c },
          { token: 'Space', text: true, getText: () => ' ' }
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.text(node.text as string);
        },
      },
    },
  ],
};

export default extension;
