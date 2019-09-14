define(["require", "exports", "prosemirror-commands", "prosemirror-inputrules", "prosemirror-keymap"], function (require, exports, prosemirror_commands_1, prosemirror_inputrules_1, prosemirror_keymap_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        plugins: function () {
            // create base (non-rebindable) keymap
            var enter = prosemirror_commands_1.chainCommands(prosemirror_commands_1.newlineInCode, prosemirror_commands_1.createParagraphNear, prosemirror_commands_1.liftEmptyBlock, prosemirror_commands_1.splitBlock);
            var backspace = prosemirror_commands_1.chainCommands(prosemirror_inputrules_1.undoInputRule, prosemirror_commands_1.deleteSelection, prosemirror_commands_1.joinBackward, prosemirror_commands_1.selectNodeBackward);
            var del = prosemirror_commands_1.chainCommands(prosemirror_commands_1.deleteSelection, prosemirror_commands_1.joinForward, prosemirror_commands_1.selectNodeForward);
            var keys = {
                "Enter": enter,
                "Backspace": backspace,
                "Mod-Backspace": backspace,
                "Delete": del,
                "Mod-Delete": del,
            };
            // return keymap
            return [prosemirror_keymap_1.keymap(keys)];
        }
    };
    exports.default = extension;
});
//# sourceMappingURL=basekeys.js.map