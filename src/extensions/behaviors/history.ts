import { history, redo, undo } from 'prosemirror-history';
import { Command } from 'extensions/api/command';
import { IExtension } from 'extensions/api/extension';



const extension: IExtension = {
  commands: () => {
    return [new Command('undo', ['Mod-z'], undo), new Command('redo', ['Shift-Mod-z'], redo)];
  },

  plugins: () => {
    return [history()];
  },
};

export default extension;
