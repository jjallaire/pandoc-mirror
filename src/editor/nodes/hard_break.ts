import { chainCommands, exitCode } from 'prosemirror-commands';
import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';

import { CommandFn, Command } from 'editor/api/command';
import { Extension } from 'editor/api/extension';
import { PandocOutput } from 'editor/api/pandoc';
import { EditorUI } from 'editor/api/ui';

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
        readers: [
          {
            token: 'LineBreak',
            node: 'hard_break',
          },
        ],
        writer: (output: PandocOutput) => {
          output.writeToken('LineBreak');
        },
      },
    },
  ],

  plugins: (schema: Schema, ui: EditorUI, mac: boolean) => {
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

    const keys: { [key: string]: CommandFn } = {
      'Mod-Enter': cmd,
      'Shift-Enter': cmd,
    };
    if (mac) {
      keys['Ctrl-Enter'] = cmd;
    }

    return [keymap(keys)];
  },
};

export default extension;
