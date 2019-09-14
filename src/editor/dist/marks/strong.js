define(["require", "exports", "editor/api/command", "editor/api/mark"], function (require, exports, command_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'strong',
                spec: {
                    parseDOM: [
                        { tag: 'b' },
                        { tag: 'strong' },
                        {
                            style: 'font-weight',
                            getAttrs: function (value) { return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null; },
                        },
                    ],
                    toDOM: function () {
                        return ['strong'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Strong',
                            mark: 'strong',
                        },
                    ],
                    writer: {
                        priority: 1,
                        write: function (output, _mark, parent) {
                            output.writeMark('Strong', parent, true);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('strong', ['Mod-b'], schema.marks.strong)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('\\*\\*', schema.marks.strong)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=strong.js.map