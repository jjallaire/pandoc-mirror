import { wrappingInputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { WrapCommand } from 'editor/api/command';
import { Extension } from 'editor/api/extension';
import { PandocOutput } from 'editor/api/pandoc';

const extension: Extension = {
  nodes: [
    {
      name: 'blockquote',
      spec: {
        content: 'block+',
        group: 'block',
        parseDOM: [{ tag: 'blockquote' }],
        toDOM() {
          return ['blockquote', 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'BlockQuote',
            block: 'blockquote',
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('BlockQuote', () => {
            output.writeBlocks(node);
          });
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new WrapCommand('blockquote', ['Mod->'], schema.nodes.blockquote)];
  },

  inputRules: (schema: Schema) => {
    return [wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote)];
  },
};

export default extension;
