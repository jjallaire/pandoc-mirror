
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer } from 'api/pandoc';

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
        ast_readers: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderToken('Para', () => {
            pandoc.renderInlines(node);
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
