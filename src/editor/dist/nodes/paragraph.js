define(["require", "exports", "editor/api/command"], function (require, exports, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'paragraph',
                spec: {
                    content: 'inline*',
                    group: 'block',
                    parseDOM: [{ tag: 'p' }],
                    toDOM: function () {
                        return ['p', 0];
                    },
                },
                pandoc: {
                    readers: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
                    writer: function (output, node) {
                        output.writeToken('Para', function () {
                            output.writeInlines(node.content);
                        });
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.BlockCommand('paragraph', ['Shift-Ctrl-0'], schema.nodes.paragraph, schema.nodes.paragraph)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=paragraph.js.map