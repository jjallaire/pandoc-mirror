import { Schema, Mark, Fragment } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

const extension: Extension = {
  marks: [
    {
      name: 'smallcaps',
      spec: {
        parseDOM: [
          { tag: "span[class='smallcaps']" },
          { style: 'font-variant', getAttrs: (value: string | Node) => (value as string) === 'small-caps' && null },
        ],
        toDOM() {
          return ['span', { class: 'smallcaps' }, 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'SmallCaps',
            mark: 'smallcaps',
          },
        ],
        writer: {
          priority: 7,
          write: (output: PandocOutput, _mark: Mark, parent: Fragment) => {
            output.writeMark('SmallCaps', parent);
          },
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('smallcaps', null, schema.marks.smallcaps)];
  },
};

export default extension;
