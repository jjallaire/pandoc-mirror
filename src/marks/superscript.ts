import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { delimiterMarkInputRule } from 'api/mark';

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
        writer: {
          priority: 10,
          write: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
            output.writeMark('Superscript', parent);
          },
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('superscript', null, schema.marks.superscript)];
  },

  inputRules: (schema: Schema) => {
    return [delimiterMarkInputRule('\\^', schema.marks.superscript)];
  },
};

export default extension;
