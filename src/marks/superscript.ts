import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

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
        readers: [
          {
            token: 'Superscript',
            mark: 'superscript',
          },
        ],
        writer: (pandoc: PandocOutput, mark: Mark, parent: Fragment, index: number) => {
          //
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('superscript', null, schema.marks.superscript)];
  },
};

export default extension;
