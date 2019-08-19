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
        writer: {
          priority: 5,
          write: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
            output.writeMark('Strikeout', parent);
          }
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strikeout', null, schema.marks.strikeout)];
  },
};

export default extension;
