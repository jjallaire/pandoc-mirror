define(["require", "exports", "editor/api/command", "editor/api/mark"], function (require, exports, command_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'superscript',
                spec: {
                    parseDOM: [{ tag: 'sup' }],
                    toDOM: function () {
                        return ['sup'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Superscript',
                            mark: 'superscript',
                        },
                    ],
                    writer: {
                        priority: 10,
                        write: function (output, _mark, parent) {
                            output.writeMark('Superscript', parent);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('superscript', null, schema.marks.superscript)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('\\^', schema.marks.superscript)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=superscript.js.map