import { Schema } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
  marks: [
    {
      name: 'subscript',
      spec: {
        parseDOM: [{ tag: 'sub' }],
        toDOM() {
          return ['sub'];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Subscript',
            mark: 'subscript',
          },
        ],
        markdown_writer: {
          open: '~',
          close: '~',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('subscript', null, schema.marks.subscript)];
  },
};

export default extension;
