import { history, redo, undo } from 'prosemirror-history';

import { Command } from 'api/command';
import { Extension } from 'api/extension';

const extension: Extension = {
  commands: () => {
    return [new Command('undo', ['Mod-z'], undo), new Command('redo', ['Shift-Mod-z'], redo)];
  },

  plugins: () => {
    return [history()];
  },
};

export default extension;
