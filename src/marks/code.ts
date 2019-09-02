import { Fragment, Mark, Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import { pandocAttrSpec, pandocAttrParseDom, pandocAttrToDomAttr, pandocAttrReadAST } from 'api/pandoc_attr';
import { PandocToken, PandocOutput } from 'api/pandoc';
import { delimiterMarkInputRule } from 'api/mark';

const CODE_ATTR = 0;
const CODE_TEXT = 1;

const extension: Extension = {
  marks: [
    {
      name: 'code',
      spec: {
        attrs: pandocAttrSpec,
        parseDOM: [
          {
            tag: 'code',
            getAttrs(dom: Node | string) {
              return pandocAttrParseDom(dom as Element, {});
            },
          },
        ],
        toDOM(mark: Mark) {
          return ['code', pandocAttrToDomAttr(mark.attrs)];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Code',
            mark: 'code',
            getText: (tok: PandocToken) => tok.c[CODE_TEXT],
            getAttrs: (tok: PandocToken) => {
              return pandocAttrReadAST(tok, CODE_ATTR);
            },
          },
        ],
        writer: {
          priority: 20,
          write: (output: PandocOutput, mark: Mark, parent: Fragment) => {
            output.writeToken('Code', () => {
              output.writeAttr(mark.attrs.id, mark.attrs.classes, mark.attrs.keyvalue);
              let code = '';
              parent.forEach((node: ProsemirrorNode) => (code = code + node.textContent));
              output.write(code);
            });
          },
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('code', ['Mod-d', 'Mod-D'], schema.marks.code)];
  },

  inputRules: (schema: Schema) => {
    return [delimiterMarkInputRule('`', schema.marks.code)];
  },
};

export default extension;
