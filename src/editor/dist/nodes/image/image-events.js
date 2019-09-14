define(["require", "exports", "./image-dialog"], function (require, exports, image_dialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function imageDoubleClickOn(nodeType, onEditImage) {
        return function (view, _pos, node) {
            if (node.type === nodeType) {
                image_dialog_1.imageDialog(node, nodeType, view.state, view.dispatch, view, onEditImage);
                return true;
            }
            else {
                return false;
            }
        };
    }
    exports.imageDoubleClickOn = imageDoubleClickOn;
    function imageDrop(nodeType) {
        return function (view, event) {
            // alias to drag event so typescript knows about event.dataTransfer
            var dragEvent = event;
            // ensure we have data transfer
            if (!dragEvent.dataTransfer) {
                return false;
            }
            // ensure the drop coordinates map to an editor position
            var coordinates = view.posAtCoords({
                left: dragEvent.clientX,
                top: dragEvent.clientY,
            });
            if (!coordinates) {
                return false;
            }
            // see if this is a drag of image uris
            var uriList = dragEvent.dataTransfer.getData('text/uri-list');
            var html = dragEvent.dataTransfer.getData('text/html');
            if (!uriList || !html) {
                return false;
            }
            // see if we can pull an image out of the html
            var regex = /<img.*?src=["'](.*?)["']/;
            var match = regex.exec(html);
            if (!match) {
                return false;
            }
            // indicate that we can handle this drop
            event.preventDefault();
            // insert the images
            uriList.split('\r?\n').forEach(function (src) {
                var node = nodeType.create({ src: src });
                var transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
            });
            return true;
        };
    }
    exports.imageDrop = imageDrop;
});
//# sourceMappingURL=image-events.js.map