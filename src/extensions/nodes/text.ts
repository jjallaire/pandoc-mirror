import { Node as ProsemirrorNode } from 'prosemirror-model';
import { MarkdownSerializerState } from 'prosemirror-markdown';

import { IExtension, IPandocToken } from '../api';

const extension: IExtension = {
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
          { token: 'Str', text: true, getText: (tok: IPandocToken) => tok.c },
          { token: 'Space', text: true, getText: () => ' ' },
          { token: 'SoftBreak', text: true, getText: () => ' ' },
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.text(node.text as string);
        },
      },
    },
  ],
};

export default extension;
