import { undo, redo, history } from 'prosemirror-history';
import { Schema } from 'prosemirror-model';

import { IExtension, Command } from '../api';

import { IEditorUI } from '../api/ui';

const extension: IExtension = {
  commands: () => {
    return [new Command('undo', ['Mod-z'], undo), new Command('redo', ['Shift-Mod-z'], redo)];
  },

  plugins: () => {
    return [history()];
  },
};

export default extension;
