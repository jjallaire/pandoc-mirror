import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { chainCommands, exitCode } from 'prosemirror-commands';
import { MarkdownSerializerState } from 'prosemirror-markdown';

import { IExtension } from '../api';
import { CommandFn } from '../../utils/command';

const extension: IExtension = {
  nodes: [
    {
      name: 'hard_break',
      spec: {
        inline: true,
        group: 'inline',
        selectable: false,
        parseDOM: [{ tag: 'br' }],
        toDOM() {
          return ['br'];
        },
      },
      pandoc: {
        from: [
          {
            token: 'LineBreak',
            node: 'hard_break',
          },
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode, parent: ProsemirrorNode, index: number) => {
          for (let i = index + 1; i < parent.childCount; i++) {
            if (parent.child(i).type !== node.type) {
              state.write('  \n');
              return;
            }
          }
        },
      },
    },
  ],

  keymap: (schema: Schema, mac: boolean) => {
    const br = schema.nodes.hard_break;
    const cmd = chainCommands(
      exitCode,
      (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
        }
        return true;
      },
    );
    const keys: { [key: string]: CommandFn } = {};
    keys['Mod-Enter'] = cmd;
    keys['Shift-Enter'] = cmd;
    if (mac) {
      keys['Ctrl-Enter'] = cmd;
    }
    return keys;
  },
};

export default extension;
