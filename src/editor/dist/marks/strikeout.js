define(["require", "exports", "editor/api/command", "editor/api/mark"], function (require, exports, command_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'strikeout',
                spec: {
                    parseDOM: [
                        { tag: 'del' },
                        { tag: 's' },
                        {
                            style: 'text-decoration',
                            getAttrs: function (value) { return value === 'line-through' && null; },
                        },
                    ],
                    toDOM: function () {
                        return ['del'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Strikeout',
                            mark: 'strikeout',
                        },
                    ],
                    writer: {
                        priority: 5,
                        write: function (output, _mark, parent) {
                            output.writeMark('Strikeout', parent);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('strikeout', null, schema.marks.strikeout)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('~~', schema.marks.strikeout)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=strikeout.js.map