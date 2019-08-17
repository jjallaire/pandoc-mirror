import { Schema } from 'prosemirror-model';

import { Command, insertNode } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer } from 'api/pandoc';

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
        ast_writer: (pandoc: PandocSerializer) => {
          pandoc.renderToken('HorizontalRule');
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], insertNode(schema.nodes.horizontal_rule))];
  },
};

export default extension;
