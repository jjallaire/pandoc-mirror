import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

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
        readers: [
          {
            token: 'Strikeout',
            mark: 'strikeout',
          },
        ],
        writer: (pandoc: PandocOutput, mark: Mark, parent: Fragment) => {
          //
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strikeout', null, schema.marks.strikeout)];
  },
};

export default extension;
