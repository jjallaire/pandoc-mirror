import { chainCommands, exitCode } from 'prosemirror-commands';
import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { CommandFn } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer } from 'api/pandoc';

const extension: Extension = {
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
        ast_readers: [
          {
            token: 'LineBreak',
            node: 'hard_break',
          },
        ],
        ast_writer: (pandoc: PandocSerializer) => {
          pandoc.renderToken('LineBreak');
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
