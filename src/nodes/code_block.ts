import { setBlockType } from 'prosemirror-commands';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { pandocAttrSpec, pandocAttrParseDom, pandocAttrToDomAttr, pandocAttrReadAST } from 'api/pandoc_attr';
import { textblockTypeInputRule } from 'prosemirror-inputrules';

const CODE_BLOCK_ATTR = 0;
const CODE_BLOCK_TEXT = 1;

const extension: Extension = {
  nodes: [
    {
      name: 'code_block',
      spec: {
        content: 'text*',
        group: 'block',
        marks: "",
        code: true,
        defining: true,
        attrs: { ...pandocAttrSpec },
        parseDOM: [
          {
            tag: 'pre',
            preserveWhitespace: true,
            getAttrs: (node: Node | string) => {
              const el = node as Element;
              return pandocAttrParseDom(el, {});
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return ['pre', pandocAttrToDomAttr(node.attrs), ['code', 0]];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'CodeBlock',
            block: 'code_block',
            getAttrs: (tok: PandocToken) => ({
              ...pandocAttrReadAST(tok, CODE_BLOCK_ATTR),
            }),
            getText: (tok: PandocToken) => tok.c[CODE_BLOCK_TEXT],
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('CodeBlock', () => {
            output.writeAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
            output.write(node.textContent);
          });
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

  inputRules: (schema: Schema) => {
    return [
      textblockTypeInputRule(/^```/, schema.nodes.code_block)
    ];
  }
};

export default extension;
