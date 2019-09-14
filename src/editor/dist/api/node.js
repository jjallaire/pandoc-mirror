define(["require", "exports", "prosemirror-state", "prosemirror-utils"], function (require, exports, prosemirror_state_1, prosemirror_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function findNodeOfTypeInSelection(selection, type) {
        return prosemirror_utils_1.findSelectedNodeOfType(type)(selection) || prosemirror_utils_1.findParentNode(function (n) { return n.type === type; })(selection);
    }
    exports.findNodeOfTypeInSelection = findNodeOfTypeInSelection;
    function firstNode(parent, predicate) {
        var foundNode;
        parent.node.descendants(function (node, pos) {
            if (!foundNode) {
                if (predicate(node)) {
                    foundNode = {
                        node: node,
                        pos: parent.pos + 1 + pos,
                    };
                    return false;
                }
            }
            else {
                return false;
            }
        });
        return foundNode;
    }
    exports.firstNode = firstNode;
    function lastNode(parent, predicate) {
        var last;
        parent.node.descendants(function (node, pos) {
            if (predicate(node)) {
                last = {
                    node: node,
                    pos: parent.pos + 1 + pos,
                };
            }
        });
        return last;
    }
    exports.lastNode = lastNode;
    function nodeIsActive(state, type, attrs) {
        if (attrs === void 0) { attrs = {}; }
        var predicate = function (n) { return n.type === type; };
        var node = prosemirror_utils_1.findSelectedNodeOfType(type)(state.selection) || prosemirror_utils_1.findParentNode(predicate)(state.selection);
        if (!Object.keys(attrs).length || !node) {
            return !!node;
        }
        return node.node.hasMarkup(type, attrs);
    }
    exports.nodeIsActive = nodeIsActive;
    function canInsertNode(state, nodeType) {
        var $from = state.selection.$from;
        for (var d = $from.depth; d >= 0; d--) {
            var index = $from.index(d);
            if ($from.node(d).canReplaceWith(index, index, nodeType)) {
                return true;
            }
        }
        return false;
    }
    exports.canInsertNode = canInsertNode;
    function insertAndSelectNode(node, state, dispatch) {
        // create new transaction
        var tr = state.tr;
        // insert the node over the existing selection
        tr.replaceSelectionWith(node);
        // select node
        // (https://discuss.prosemirror.net/t/how-to-select-a-node-immediately-after-inserting-it/1566)
        if (tr.selection.$anchor.nodeBefore) {
            var resolvedPos = tr.doc.resolve(tr.selection.anchor - tr.selection.$anchor.nodeBefore.nodeSize);
            tr.setSelection(new prosemirror_state_1.NodeSelection(resolvedPos));
        }
        // dispatch transaction
        dispatch(tr);
    }
    exports.insertAndSelectNode = insertAndSelectNode;
});
//# sourceMappingURL=node.js.map