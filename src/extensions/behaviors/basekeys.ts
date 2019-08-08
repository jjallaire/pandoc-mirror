import { baseKeymap, joinDown, joinUp, lift, selectParentNode } from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { CommandFn } from 'extensions/api/command';
import { IExtension } from 'extensions/api/extension';



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
