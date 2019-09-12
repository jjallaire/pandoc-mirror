import { Schema } from "prosemirror-model";
import { selectAll } from "prosemirror-commands";

import { Extension } from "api/extension";
import { EditorUI } from "api/ui";
import { Command } from "api/command";

const extension: Extension = {
  
  commands: (schema: Schema, ui: EditorUI, mac: boolean) => {
    return [
      new Command('select_all', ['Mod-a'], selectAll)
    ];
  }
};

export default extension;
