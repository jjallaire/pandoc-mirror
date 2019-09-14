define(["require", "exports", "editor/api/command", "prosemirror-inputrules", "prosemirror-utils"], function (require, exports, command_1, prosemirror_inputrules_1, prosemirror_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'horizontal_rule',
                spec: {
                    group: 'block',
                    parseDOM: [{ tag: 'hr' }],
                    toDOM: function () {
                        return ['div', ['hr']];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'HorizontalRule',
                            node: 'horizontal_rule',
                        },
                    ],
                    writer: function (output) {
                        output.writeToken('HorizontalRule');
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.Command('horizontal_rule', ['Mod-_'], command_1.insertNode(schema.nodes.horizontal_rule))];
        },
        inputRules: function (schema) {
            return [
                new prosemirror_inputrules_1.InputRule(/^\*{3}$/, function (state, match, start, end) {
                    var paraNode = prosemirror_utils_1.findParentNodeOfType(schema.nodes.paragraph)(state.selection);
                    if (paraNode && state.selection.$anchor.depth === 2) { // only in top-level paragraphs
                        return state.tr.replaceRangeWith(start, end, schema.nodes.horizontal_rule.create());
                    }
                    else {
                        return null;
                    }
                })
            ];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=horizontal_rule.js.map