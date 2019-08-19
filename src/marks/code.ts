
import { Fragment, Mark, Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { MarkCommand } from 'api/command';
import { Extension } from 'api/extension';
import {
  pandocAttrSpec,
  pandocAttrParseDom,
  pandocAttrToDomAttr,
  pandocAttrReadAST,
} from 'api/pandoc_attr';
import { PandocToken, PandocOutput } from 'api/pandoc';

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
        writer: (output: PandocOutput, mark: Mark, parent: Fragment) => {
          output.writeInlines(parent);

          /*
          output.writeToken('Code', () => {
          
              output.writeAttr(mark.attrs.id, mark.attrs.classes, mark.attrs.keyvalue);
              output.writeText('myCode');
            
          });
          */
        }
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new MarkCommand('code', ['Mod-d', 'Mod-D'], schema.marks.code)];
  },
};

function backticksFor(node: ProsemirrorNode, side: -1 | 1) {
  const ticks = /`+/g;
  let m: RegExpExecArray | null;
  let len = 0;
  if (node.isText) {
    for (;;) {
      m = ticks.exec(node.text as string);
      if (!m) {
        break;
      }
      len = Math.max(len, m[0].length);
    }
  }
  let result = len > 0 && side > 0 ? ' `' : '`';
  for (let i = 0; i < len; i++) {
    result += '`';
  }
  if (len > 0 && side < 0) {
    result += ' ';
  }
  return result;
}

export default extension;
