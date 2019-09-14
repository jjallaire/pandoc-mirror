var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["require", "exports", "editor/api/node"], function (require, exports, node_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function imageDialog(node, nodeType, state, dispatch, view, onEditImage) {
        // if we are being called with an existing node then read it's attributes
        var image = { src: null };
        if (node && node.type === nodeType) {
            image = node.attrs;
        }
        else {
            image = nodeType.create(image).attrs;
        }
        // edit the image
        onEditImage(__assign({}, image)).then(function (result) {
            if (result) {
                var newImage = nodeType.createAndFill(result);
                if (newImage) {
                    node_1.insertAndSelectNode(newImage, state, dispatch);
                }
            }
            if (view) {
                view.focus();
            }
        });
    }
    exports.imageDialog = imageDialog;
});
//# sourceMappingURL=image-dialog.js.map