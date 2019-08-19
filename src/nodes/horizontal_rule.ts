import { Schema } from 'prosemirror-model';

import { Command, insertNode } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

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
        readers: [
          {
            token: 'HorizontalRule',
            node: 'horizontal_rule',
          },
        ],
        writer: (output: PandocOutput) => {
          output.writeToken('HorizontalRule');
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], insertNode(schema.nodes.horizontal_rule))];
  },
};

export default extension;
