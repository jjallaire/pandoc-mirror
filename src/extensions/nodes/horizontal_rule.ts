import { Schema } from 'prosemirror-model';
import { IExtension, Command } from '../api';
import { commandInsertNode } from 'src/utils/command';

const extension: IExtension = {
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
        from: {
          token: 'HorizontalRule',
          node: 'horizontal_rule',
        },
        to: {},
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], commandInsertNode(schema.nodes.horizontal_rule))];
  },
};

export default extension;
