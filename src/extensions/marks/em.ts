import { Schema } from 'prosemirror-model';
import { MarkCommand } from '../api/command';
import { IExtension } from '../api/extension';

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
