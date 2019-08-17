import { Schema } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
  marks: [
    {
      name: 'strikeout',
      spec: {
        parseDOM: [
          { tag: 'del' },
          { tag: 's' },
          {
            style: 'text-decoration',
            getAttrs: (value: string | Node) => (value as string) === 'line-through' && null,
          },
        ],
        toDOM() {
          return ['del'];
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'Strikeout',
            mark: 'strikeout',
          },
        ],
        markdown_writer: {
          open: '~~',
          close: '~~',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strikeout', null, schema.marks.strikeout)];
  },
};

export default extension;
