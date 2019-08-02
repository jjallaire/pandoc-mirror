
import { Schema } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { chainCommands, exitCode } from 'prosemirror-commands'

import { IExtension } from '../api'
import { CommandFn } from '../../utils/command';

const extension : IExtension = {
  
  nodes: [{
    name: "hard_break",
    spec: {
      inline: true,
      group: "inline",
      selectable: false,
      parseDOM: [{tag: "br"}],
      toDOM() { return ["br"] }
    },
    pandoc: {
      from: {
        token: "LineBreak",
        node: "hard_break",
      },
      to: {}
    },
  }],

  keymap: (schema: Schema, mac: boolean) => {
    const br = schema.nodes.hard_break
    const cmd = chainCommands(
      exitCode, 
      (state: EditorState, dispatch?: ((tr: Transaction<any>) => void), view?: EditorView) => {
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
        }
        return true
      }
    )
    const keys: { [key: string] : CommandFn } = {}
    keys["Mod-Enter"] = cmd
    keys["Shift-Enter"] = cmd
    if (mac) {
      keys["Ctrl-Enter"] = cmd
    }
    return keys;
  },
};

export default extension;

