
import { Extension } from 'api/extension';
import { PandocSerializer, PandocToken } from 'api/pandoc';

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
            getText: (tok: PandocToken) => ' ',
          },
        ],
        ast_writer: (pandoc: PandocSerializer) => {
          pandoc.renderToken('SoftBreak');
        }
      },
    },
  ],
};

export default extension;
