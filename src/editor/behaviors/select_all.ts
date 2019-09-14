import { Schema } from "prosemirror-model";
import { selectAll } from "prosemirror-commands";

import { Extension } from "editor/api/extension";
import { EditorUI } from "editor/api/ui";
import { Command } from "editor/api/command";

const extension: Extension = {
  
  commands: (schema: Schema, ui: EditorUI, mac: boolean) => {
    return [
      new Command('select_all', ['Mod-a'], selectAll)
    ];
  }
};

export default extension;
