import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

const extension: Extension = {
  marks: [
    {
      name: 'em',
      spec: {
        parseDOM: [
          { tag: 'i' },
          { tag: 'em' },
          { style: 'font-weight', getAttrs: (value: string | Node) => (value as string) === 'italic' && null },
        ],
        toDOM() {
          return ['em'];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Emph',
            mark: 'em',
          },
        ],
        writer: {
          priority: 2,
          write: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
            output.writeMark('Emph', parent, true);
          }
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('em', ['Mod-i', 'Mod-I'], schema.marks.em)];
  },
};

export default extension;
