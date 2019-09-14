import { 
  chainCommands, newlineInCode, createParagraphNear, 
  liftEmptyBlock, splitBlock, deleteSelection, 
  joinBackward, selectNodeBackward, joinForward, selectNodeForward 
} from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { Extension } from 'editor/api/extension';

const extension: Extension = {
  plugins: () => {
    // create base (non-rebindable) keymap

    const enter = chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock);
    const backspace = chainCommands(undoInputRule, deleteSelection, joinBackward, selectNodeBackward);
    const del = chainCommands(deleteSelection, joinForward, selectNodeForward);
    
    const keys = {
      "Enter": enter,
      "Backspace": backspace,
      "Mod-Backspace": backspace,
      "Delete": del,
      "Mod-Delete": del,
    };
    
    // return keymap
    return [keymap(keys)];
  }
};

export default extension;
