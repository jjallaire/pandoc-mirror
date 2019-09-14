define(["require", "exports", "./list-checked"], function (require, exports, list_checked_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LIST_ATTRIBS = 0;
    var LIST_CHILDREN = 1;
    var LIST_ATTRIB_ORDER = 0;
    var LIST_ATTRIB_NUMBER_STYLE = 1;
    var LIST_ATTRIB_NUMBER_DELIM = 2;
    exports.pandocOrderedListReader = {
        token: 'OrderedList',
        list: 'ordered_list',
        getAttrs: function (tok) {
            var attribs = tok.c[LIST_ATTRIBS];
            return {
                order: attribs[LIST_ATTRIB_ORDER],
                number_style: attribs[LIST_ATTRIB_NUMBER_STYLE].t,
                number_delim: attribs[LIST_ATTRIB_NUMBER_DELIM].t,
            };
        },
        getChildren: function (tok) { return tok.c[LIST_CHILDREN]; },
    };
    function pandocWriteOrderedList(output, node) {
        output.writeListBlock(node, function () {
            output.writeArray(function () {
                output.write(node.attrs.order);
                output.writeToken(node.attrs.number_style);
                output.writeToken(node.attrs.number_delim);
            });
            output.writeArray(function () {
                output.writeBlocks(node);
            });
        });
    }
    exports.pandocWriteOrderedList = pandocWriteOrderedList;
    function pandocWriteBulletList(output, node) {
        output.writeListBlock(node, function () {
            output.writeBlocks(node);
        });
    }
    exports.pandocWriteBulletList = pandocWriteBulletList;
    function pandocWriteListItem(output, node) {
        var checked = node.attrs.checked;
        output.writeArray(function () {
            node.forEach(function (itemNode, _offset, index) {
                if (itemNode.type === node.type.schema.nodes.paragraph) {
                    output.writeListItemParagraph(function () {
                        // for first item block, prepend check mark if we have one
                        if (checked !== null && index === 0) {
                            output.writeInlines(list_checked_1.fragmentWithCheck(node.type.schema, itemNode.content, checked));
                        }
                        else {
                            output.writeInlines(itemNode.content);
                        }
                    });
                }
                else {
                    output.writeBlock(itemNode);
                }
            });
        });
    }
    exports.pandocWriteListItem = pandocWriteListItem;
});
//# sourceMappingURL=list-pandoc.js.map