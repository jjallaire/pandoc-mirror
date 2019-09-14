define(["require", "exports", "editor/api/command"], function (require, exports, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        marks: [
            {
                name: 'smallcaps',
                spec: {
                    parseDOM: [
                        { tag: "span[class='smallcaps']" },
                        { style: 'font-variant', getAttrs: function (value) { return value === 'small-caps' && null; } },
                    ],
                    toDOM: function () {
                        return ['span', { class: 'smallcaps' }, 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'SmallCaps',
                            mark: 'smallcaps',
                        },
                    ],
                    writer: {
                        priority: 7,
                        write: function (output, _mark, parent) {
                            output.writeMark('SmallCaps', parent);
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('smallcaps', null, schema.marks.smallcaps)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=smallcaps.js.map