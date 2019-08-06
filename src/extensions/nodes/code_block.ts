import { Schema, Node as ProsemirrorNode, Fragment } from 'prosemirror-model';
import { setBlockType } from 'prosemirror-commands';
import { IExtension, IPandocToken, BlockCommand } from '../api';
import { MarkdownSerializerState } from 'prosemirror-markdown';

const CODE_BLOCK_ATTR = 0;
const CODE_BLOCK_ATTR_PARAMS = 1;
const CODE_BLOCK_TEXT = 1;

const extension: IExtension = {
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
        from: {
          token: 'CodeBlock',
          block: 'code_block',
          getAttrs: (tok: IPandocToken) => ({
            // TODO: enhance for pandoc {} syntax
            params: tok.c[CODE_BLOCK_ATTR][CODE_BLOCK_ATTR_PARAMS].join(' '),
          }),
          getText: (tok: IPandocToken) => tok.c[CODE_BLOCK_TEXT],
        },
        to: (state: MarkdownSerializerState, node: ProsemirrorNode, parent: ProsemirrorNode, index: number) => {
          state.write('```' + (node.attrs.params || '') + '\n');
          state.text(node.textContent, false);
          state.ensureNewLine();
          state.write('```');
          state.closeBlock(node);
        },
      },
    },
  ],

  keymap: (schema: Schema, mac: boolean) => {
    return {
      'Shift-Ctrl-\\': setBlockType(schema.nodes.code_block),
    };
  },

  commands: (schema: Schema) => {
    return [new BlockCommand('code_block', null, schema.nodes.code_block, schema.nodes.paragraph, {})];
  },
};

export default extension;
