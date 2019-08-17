
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';

const extension: Extension = {
  nodes: [
    {
      name: 'paragraph',
      spec: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{ tag: 'p' }],
        toDOM() {
          return ['p', 0];
        },
      },
      pandoc: {
        readers: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('Para', () => {
            output.writeInlines(node);
          });
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new BlockCommand('paragraph', ['Shift-Ctrl-0'], schema.nodes.paragraph, schema.nodes.paragraph)];
  },
};

export default extension;
