define(["require", "exports", "prosemirror-commands", "prosemirror-keymap"], function (require, exports, prosemirror_commands_1, prosemirror_keymap_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var extension = {
        nodes: [
            {
                name: 'hard_break',
                spec: {
                    inline: true,
                    group: 'inline',
                    selectable: false,
                    parseDOM: [{ tag: 'br' }],
                    toDOM: function () {
                        return ['br'];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'LineBreak',
                            node: 'hard_break',
                        },
                    ],
                    writer: function (output) {
                        output.writeToken('LineBreak');
                    },
                },
            },
        ],
        plugins: function (schema, ui, mac) {
            var br = schema.nodes.hard_break;
            var cmd = prosemirror_commands_1.chainCommands(prosemirror_commands_1.exitCode, function (state, dispatch, view) {
                if (dispatch) {
                    dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
                }
                return true;
            });
            var keys = {
                'Mod-Enter': cmd,
                'Shift-Enter': cmd,
            };
            if (mac) {
                keys['Ctrl-Enter'] = cmd;
            }
            return [
                prosemirror_keymap_1.keymap(keys)
            ];
        }
    };
    exports.default = extension;
});
//# sourceMappingURL=hard_break.js.map