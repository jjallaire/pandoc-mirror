import { Schema } from 'prosemirror-model';
import { IExtension, MarkCommand, IPandocToken } from '../api';

const CODE_TEXT = 1;

const extension: IExtension = {
  marks: [
    {
      name: 'code',
      spec: {
        parseDOM: [{ tag: 'code' }],
        toDOM() {
          return ['code'];
        },
      },
      pandoc: {
        from: {
          token: 'Code',
          mark: 'code',
          getText: (tok: IPandocToken) => tok.c[CODE_TEXT],
        },
        to: {},
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('code', ['Mod-d', 'Mod-D'], schema.marks.code)];
  },
};

export default extension;
