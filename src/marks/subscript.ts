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
        writer: {
          priority: 9,
          write: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
            output.writeMark('Subscript', parent);
          }
        } 
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('subscript', null, schema.marks.subscript)];
  },
};

export default extension;
