import { history, redo, undo } from 'prosemirror-history';

import { Command } from 'editor/api/command';
import { Extension } from 'editor/api/extension';

const extension: Extension = {
  commands: () => {
    return [new Command('undo', ['Mod-z'], undo), new Command('redo', ['Mod-y', 'Shift-Mod-z'], redo)];
  },

  plugins: () => {
    return [history()];
  },
};

export default extension;
