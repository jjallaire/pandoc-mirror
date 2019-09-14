define(["require", "exports", "prosemirror-commands", "editor/api/command"], function (require, exports, prosemirror_commands_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        commands: function (schema, ui, mac) {
            return [
                new command_1.Command('select_all', ['Mod-a'], prosemirror_commands_1.selectAll)
            ];
        }
    };
    exports.default = extension;
});
//# sourceMappingURL=select_all.js.map