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
define(["require", "exports", "prosemirror-utils", "./list"], function (require, exports, prosemirror_utils_1, list_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function exampleListsAppendTransaction(schema) {
        return function (transactions, oldState, newState) {
            if (transactions.some(function (transaction) { return transaction.docChanged; })) {
                // create transaction
                var tr_1 = newState.tr;
                // find all example lists
                var exampleLists = prosemirror_utils_1.findChildrenByType(newState.doc, schema.nodes.ordered_list).filter(function (nodeWithPos) { return nodeWithPos.node.attrs.number_style === list_1.ListNumberStyle.Example; });
                // set their order
                var order_1 = 1;
                exampleLists.forEach(function (nodeWithPos) {
                    if (order_1 !== nodeWithPos.node.attrs.order) {
                        tr_1.setNodeMarkup(nodeWithPos.pos, nodeWithPos.node.type, __assign(__assign({}, nodeWithPos.node.attrs), { order: order_1 }));
                    }
                    order_1 += prosemirror_utils_1.findChildrenByType(nodeWithPos.node, schema.nodes.list_item).length;
                });
                // return transaction
                if (tr_1.docChanged || tr_1.selectionSet) {
                    return tr_1;
                }
            }
        };
    }
    exports.exampleListsAppendTransaction = exampleListsAppendTransaction;
});
//# sourceMappingURL=list-example.js.map