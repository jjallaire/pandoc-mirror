import { Schema } from 'prosemirror-model';
import { IExtension } from '../api/extension';
import { MarkCommand } from '../api/command';

const extension: IExtension = {
  marks: [
    {
      name: 'em',
      spec: {
        parseDOM: [
          { tag: 'i' },
          { tag: 'em' },
          { style: 'font-weight', getAttrs: (value: string | Node) => (value as string) === 'italic' && null },
        ],
        toDOM() {
          return ['em'];
        },
      },
      pandoc: {
        from: [
          {
            token: 'Emph',
            mark: 'em',
          },
        ],
        to: {
          open: '*',
          close: '*',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('em', ['Mod-i', 'Mod-I'], schema.marks.em)];
  },
};

export default extension;
