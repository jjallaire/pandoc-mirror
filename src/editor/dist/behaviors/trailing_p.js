define(["require", "exports", "prosemirror-state", "prosemirror-utils"], function (require, exports, prosemirror_state_1, prosemirror_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var plugin = new prosemirror_state_1.PluginKey('trailingp');
    var extension = {
        plugins: function (schema) {
            return [
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    view: function () { return ({
                        update: function (view) {
                            var state = view.state;
                            var insertNodeAtEnd = plugin.getState(state);
                            if (!insertNodeAtEnd) {
                                return;
                            }
                            // insert paragraph at the end of the editing root
                            var tr = state.tr;
                            var type = schema.nodes.paragraph;
                            var editingNode = editingRootNode(tr.selection, schema);
                            if (editingNode) {
                                tr.insert(editingNode.pos + editingNode.node.nodeSize - 1, type.create());
                                view.dispatch(tr);
                            }
                        },
                    }); },
                    state: {
                        init: function (_config, state) {
                            return insertTrailingP(state.selection, schema);
                        },
                        apply: function (tr, value) {
                            if (!tr.docChanged) {
                                return value;
                            }
                            return insertTrailingP(tr.selection, schema);
                        },
                    },
                }),
            ];
        },
    };
    function insertTrailingP(selection, schema) {
        var editingRoot = editingRootNode(selection, schema);
        if (editingRoot) {
            return !isParagraphNode(editingRoot.node.lastChild, schema);
        }
        else {
            return false;
        }
    }
    function editingRootNode(selection, schema) {
        return prosemirror_utils_1.findParentNodeOfType(schema.nodes.body)(selection) || prosemirror_utils_1.findParentNodeOfType(schema.nodes.note)(selection);
    }
    function isParagraphNode(node, schema) {
        if (node) {
            return node.type === schema.nodes.paragraph;
        }
        else {
            return false;
        }
    }
    exports.default = extension;
});
//# sourceMappingURL=trailing_p.js.map