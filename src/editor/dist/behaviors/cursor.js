define(["require", "exports", "prosemirror-dropcursor", "prosemirror-gapcursor", "prosemirror-gapcursor/style/gapcursor.css"], function (require, exports, prosemirror_dropcursor_1, prosemirror_gapcursor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        plugins: function () {
            return [prosemirror_gapcursor_1.gapCursor(), prosemirror_dropcursor_1.dropCursor()];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=cursor.js.map