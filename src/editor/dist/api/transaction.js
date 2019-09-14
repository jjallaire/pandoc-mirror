define(["require", "exports", "prosemirror-changeset"], function (require, exports, prosemirror_changeset_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function transactionsHaveChange(transactions, oldState, newState, predicate) {
        // screen out transactions with no doc changes
        if (!transactions.some(function (transaction) { return transaction.docChanged; })) {
            return false;
        }
        // function to check for whether we have a change and set a flag if we do
        var haveChange = false;
        var checkForChange = function (node, pos, parent, index) {
            if (predicate(node, pos, parent, index)) {
                haveChange = true;
                return false;
            }
        };
        // for each change in each transaction, check for a node that matches the predicate in either the old or new doc
        for (var _i = 0, transactions_1 = transactions; _i < transactions_1.length; _i++) {
            var transaction = transactions_1[_i];
            var changeSet = prosemirror_changeset_1.ChangeSet.create(oldState.doc).addSteps(newState.doc, transaction.mapping.maps);
            for (var _a = 0, _b = changeSet.changes; _a < _b.length; _a++) {
                var change = _b[_a];
                oldState.doc.nodesBetween(change.fromA, change.toA, checkForChange);
                newState.doc.nodesBetween(change.fromB, change.toB, checkForChange);
                if (haveChange) {
                    break;
                }
            }
            if (haveChange) {
                break;
            }
        }
        return haveChange;
    }
    exports.transactionsHaveChange = transactionsHaveChange;
});
//# sourceMappingURL=transaction.js.map