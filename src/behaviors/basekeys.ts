import { baseKeymap, joinDown, joinUp, lift } from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { CommandFn } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
  plugins: () => {
    const keys: { [key: string]: CommandFn } = {};
    function bindKey(key: string, cmd: CommandFn) {
      keys[key] = cmd;
    }
    bindKey('Backspace', undoInputRule);
    bindKey('Alt-ArrowUp', joinUp);
    bindKey('Alt-ArrowDown', joinDown);
    bindKey('Mod-BracketLeft', lift);

    return [keymap(keys), keymap(baseKeymap)];
  },
};

export default extension;
