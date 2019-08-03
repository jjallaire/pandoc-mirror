import { Schema } from 'prosemirror-model';
import { IExtension, MarkCommand } from '../api';

const extension: IExtension = {
  marks: [
    {
      name: 'strong',
      spec: {
        parseDOM: [
          { tag: 'b' },
          { tag: 'strong' },
          {
            style: 'font-weight',
            getAttrs: (value: string | Node) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
          },
        ],
        toDOM() {
          return ['strong'];
        },
      },
      pandoc: {
        from: {
          token: 'Strong',
          mark: 'strong',
        },
        to: {},
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strong', ['Mod-b', 'Mod-B'], schema.marks.strong)];
  },
};

export default extension;
