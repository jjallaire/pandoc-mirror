import { Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'editor/api/extension';
import { PandocOutput, PandocToken } from 'editor/api/pandoc';

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
        readers: [
          { token: 'Str', text: true, getText: (tok: PandocToken) => tok.c },
          { token: 'Space', text: true, getText: () => ' ' },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeText(node.textContent);
        },
      },
    },
  ],
};

export default extension;
