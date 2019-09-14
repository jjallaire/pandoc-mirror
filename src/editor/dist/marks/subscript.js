define(["require", "exports", "editor/api/command", "editor/api/mark"], function (require, exports, command_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'subscript',
                spec: {
                    parseDOM: [{ tag: 'sub' }],
                    toDOM: function () {
                        return ['sub'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Subscript',
                            mark: 'subscript',
                        },
                    ],
                    writer: {
                        priority: 9,
                        write: function (output, _mark, parent) {
                            output.writeMark('Subscript', parent);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('subscript', null, schema.marks.subscript)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('\\~', schema.marks.subscript, '\\~')];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=subscript.js.map