define(["require", "exports", "prosemirror-inputrules", "editor/api/command"], function (require, exports, prosemirror_inputrules_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'blockquote',
                spec: {
                    content: 'block+',
                    group: 'block',
                    parseDOM: [{ tag: 'blockquote' }],
                    toDOM: function () {
                        return ['blockquote', 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'BlockQuote',
                            block: 'blockquote',
                        },
                    ],
                    writer: function (output, node) {
                        output.writeToken('BlockQuote', function () {
                            output.writeBlocks(node);
                        });
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.WrapCommand('blockquote', ['Mod->'], schema.nodes.blockquote)];
        },
        inputRules: function (schema) {
            return [prosemirror_inputrules_1.wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=blockquote.js.map