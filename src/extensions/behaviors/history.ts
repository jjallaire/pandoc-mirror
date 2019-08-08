import { undo, redo, history } from 'prosemirror-history';

import { IExtension } from '../api/extension';

import { Command } from '../api/command';

const extension: IExtension = {
  commands: () => {
    return [new Command('undo', ['Mod-z'], undo), new Command('redo', ['Shift-Mod-z'], redo)];
  },

  plugins: () => {
    return [history()];
  },
};

export default extension;
