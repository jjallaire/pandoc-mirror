define(["require", "exports", "editor/api/command", "editor/api/mark"], function (require, exports, command_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'em',
                spec: {
                    parseDOM: [
                        { tag: 'i' },
                        { tag: 'em' },
                        { style: 'font-weight', getAttrs: function (value) { return value === 'italic' && null; } },
                    ],
                    toDOM: function () {
                        return ['em'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Emph',
                            mark: 'em',
                        },
                    ],
                    writer: {
                        priority: 2,
                        write: function (output, _mark, parent) {
                            output.writeMark('Emph', parent, true);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('em', ['Mod-i'], schema.marks.em)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('\\*', schema.marks.em, '\\*')];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=em.js.map