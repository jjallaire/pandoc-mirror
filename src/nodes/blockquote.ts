import { wrappingInputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { WrapCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer } from 'api/pandoc';

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
        ast_readers: [
          {
            token: 'BlockQuote',
            block: 'blockquote',
          },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderToken('BlockQuote', () => {
            pandoc.renderBlocks(node);
          });
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new WrapCommand('blockquote', ['Ctrl->'], schema.nodes.blockquote)];
  },

  inputRules: (schema: Schema) => {
    return [wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote)];
  },
};

export default extension;
