import { Schema } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
  marks: [
    {
      name: 'superscript',
      spec: {
        parseDOM: [{ tag: 'sup' }],
        toDOM() {
          return ['sup'];
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'Superscript',
            mark: 'superscript',
          },
        ],
        markdown_writer: {
          open: '^',
          close: '^',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('superscript', null, schema.marks.superscript)];
  },
};

export default extension;
