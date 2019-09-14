define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'text',
                spec: {
                    group: 'inline',
                    toDOM: function (node) {
                        return node.text;
                    },
                },
                pandoc: {
                    readers: [
                        { token: 'Str', text: true, getText: function (tok) { return tok.c; } },
                        { token: 'Space', text: true, getText: function () { return ' '; } },
                    ],
                    writer: function (output, node) {
                        output.writeText(node.textContent);
                    },
                },
            },
        ],
    };
    exports.default = extension;
});
//# sourceMappingURL=text.js.map