define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'soft_break',
                spec: {
                    inline: true,
                    content: 'text*',
                    group: 'inline',
                    parseDOM: [{ tag: "span[class='soft-break']" }],
                    toDOM: function () {
                        return ['span', { class: 'soft-break' }, 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'SoftBreak',
                            node: 'soft_break',
                            getText: function (tok) { return ' '; },
                        },
                    ],
                    writer: function (output) {
                        output.writeToken('SoftBreak');
                    },
                },
            },
        ],
    };
    exports.default = extension;
});
//# sourceMappingURL=soft_break.js.map