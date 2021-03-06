import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'editor/api/command';
import { Extension } from 'editor/api/extension';
import { PandocOutput } from 'editor/api/pandoc';
import { delimiterMarkInputRule } from 'editor/api/mark';

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
          },
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('strikeout', null, schema.marks.strikeout)];
  },

  inputRules: (schema: Schema) => {
    return [delimiterMarkInputRule('~~', schema.marks.strikeout)];
  },
};

export default extension;
