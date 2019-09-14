define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function mergedTextNodes(doc, filter) {
        var textNodes = [];
        var nodeIndex = 0;
        doc.descendants(function (node, pos, parentNode) {
            if (node.isText) {
                // apply filter
                if (filter && !filter(node, parentNode)) {
                    return false;
                }
                // join existing contiguous range of text nodes or create a new one
                if (textNodes[nodeIndex]) {
                    textNodes[nodeIndex] = {
                        text: textNodes[nodeIndex].text + node.text,
                        pos: textNodes[nodeIndex].pos,
                    };
                }
                else {
                    textNodes[nodeIndex] = {
                        text: node.text || '',
                        pos: pos,
                    };
                }
            }
            else {
                nodeIndex += 1;
            }
        });
        return textNodes;
    }
    exports.mergedTextNodes = mergedTextNodes;
});
//# sourceMappingURL=text.js.map