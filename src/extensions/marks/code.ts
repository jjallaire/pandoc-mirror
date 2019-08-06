import { Schema, Mark, Fragment, Node as ProsemirrorNode } from 'prosemirror-model';
import { IExtension, MarkCommand, IPandocToken } from '../api';
import { MarkdownSerializerState } from 'prosemirror-markdown';

const CODE_TEXT = 1;

const extension: IExtension = {
  marks: [
    {
      name: 'code',
      spec: {
        parseDOM: [{ tag: 'code' }],
        toDOM() {
          return ['code'];
        },
      },
      pandoc: {
        from: {
          token: 'Code',
          mark: 'code',
          getText: (tok: IPandocToken) => tok.c[CODE_TEXT],
        },
        to: {
          open(state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
            return backticksFor(parent.child(index), -1);
          },
          close(state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
            return backticksFor(parent.child(index - 1), 1);
          },
        },
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
