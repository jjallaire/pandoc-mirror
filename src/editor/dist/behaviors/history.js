define(["require", "exports", "prosemirror-history", "editor/api/command"], function (require, exports, prosemirror_history_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        commands: function () {
            return [new command_1.Command('undo', ['Mod-z'], prosemirror_history_1.undo), new command_1.Command('redo', ['Mod-y', 'Shift-Mod-z'], prosemirror_history_1.redo)];
        },
        plugins: function () {
            return [prosemirror_history_1.history()];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=history.js.map