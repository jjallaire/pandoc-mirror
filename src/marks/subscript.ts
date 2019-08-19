import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

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
        writer: (pandoc: PandocOutput, mark: Mark, parent: Fragment) => {
          //
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('subscript', null, schema.marks.subscript)];
  },
};

export default extension;
