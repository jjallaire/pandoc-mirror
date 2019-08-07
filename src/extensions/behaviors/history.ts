
import { undo, redo, history } from 'prosemirror-history';
import { Schema } from 'prosemirror-model';

import { IExtension, IEditorUI, Command } from '../api';

const extension: IExtension = {

  commands: (schema: Schema, ui: IEditorUI) => {
    return [
      new Command('undo', ['Mod-z'], undo),
      new Command('redo', ['Shift-Mod-z'], redo),
    ];
  },

  plugins: (schema: Schema, ui: IEditorUI) => {
    return [history()];
  },
  
};

export default extension;