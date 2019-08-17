import { setBlockType } from 'prosemirror-commands';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer, PandocToken } from 'api/pandoc';

const CODE_BLOCK_ATTR = 0;
const CODE_BLOCK_ATTR_PARAMS = 1;
const CODE_BLOCK_TEXT = 1;

const extension: Extension = {
  nodes: [
    {
      name: 'code_block',
      spec: {
        content: 'text*',
        group: 'block',
        code: true,
        defining: true,
        attrs: { params: { default: '' } },
        parseDOM: [
          {
            tag: 'pre',
            preserveWhitespace: true,
            getAttrs: (node: Node | string) => ({ params: (node as Element).getAttribute('data-params') || '' }),
          },
        ],
        toDOM(node: ProsemirrorNode) {
          if (node.attrs.params) {
            return ['pre', { 'data-params': node.attrs.params }, ['code', 0]];
          } else {
            return ['pre', {}, ['code', 0]];
          }
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'CodeBlock',
            block: 'code_block',
            getAttrs: (tok: PandocToken) => ({
              // TODO: enhance for pandoc {} syntax
              params: tok.c[CODE_BLOCK_ATTR][CODE_BLOCK_ATTR_PARAMS].join(' '),
            }),
            getText: (tok: PandocToken) => tok.c[CODE_BLOCK_TEXT],
          },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode, parent: ProsemirrorNode, index: number) => {
          //
        },
      },
    },
  ],

  keymap: (schema: Schema) => {
    return {
      'Shift-Ctrl-\\': setBlockType(schema.nodes.code_block),
    };
  },

  commands: (schema: Schema) => {
    return [new BlockCommand('code_block', null, schema.nodes.code_block, schema.nodes.paragraph, {})];
  },
};

export default extension;
