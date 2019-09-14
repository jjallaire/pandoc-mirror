define(["require", "exports", "prosemirror-view"], function (require, exports, prosemirror_view_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function nodeDecoration(nodeWithPos, attrs) {
        return prosemirror_view_1.Decoration.node(nodeWithPos.pos, nodeWithPos.pos + nodeWithPos.node.nodeSize, attrs);
    }
    exports.nodeDecoration = nodeDecoration;
});
//# sourceMappingURL=decoration.js.map