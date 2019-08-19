import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

const extension: Extension = {
  marks: [
    {
      name: 'strong',
      spec: {
        parseDOM: [
          { tag: 'b' },
          { tag: 'strong' },
          {
            style: 'font-weight',
            getAttrs: (value: string | Node) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
          },
        ],
        toDOM() {
          return ['strong'];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Strong',
            mark: 'strong',
          },
        ],
        writer: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
          output.writeMark('Strong', parent);
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strong', ['Mod-b', 'Mod-B'], schema.marks.strong)];
  },
};

export default extension;
