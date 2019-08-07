import { keymap } from 'prosemirror-keymap';
import { baseKeymap, joinUp, joinDown, lift, selectParentNode } from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';

import { IExtension } from '../api';
import { CommandFn } from '../../utils/command';

const extension: IExtension = {
  plugins: () => {
    const keys: { [key: string]: CommandFn } = {};
    function bindKey(key: string, cmd: CommandFn) {
      keys[key] = cmd;
    }
    bindKey('Backspace', undoInputRule);
    bindKey('Alt-ArrowUp', joinUp);
    bindKey('Alt-ArrowDown', joinDown);
    bindKey('Mod-BracketLeft', lift);
    bindKey('Escape', selectParentNode);

    return [keymap(keys), keymap(baseKeymap)];
  },
};

export default extension;
