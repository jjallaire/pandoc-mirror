import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { PandocSerializer, PandocToken } from 'api/pandoc';

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
          { token: 'Str', text: true, getText: (tok: PandocToken) => tok.c },
          { token: 'Space', text: true, getText: () => ' ' },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderText(node.textContent);
        }
      },
    },
  ],
};

export default extension;
