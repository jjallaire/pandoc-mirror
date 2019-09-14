define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function selectionIsWithin(selection, nodeWithPos) {
        var begin = nodeWithPos.pos + 1;
        var end = begin + nodeWithPos.node.nodeSize;
        return selection.anchor >= begin && selection.anchor <= end;
    }
    exports.selectionIsWithin = selectionIsWithin;
});
//# sourceMappingURL=selection.js.map