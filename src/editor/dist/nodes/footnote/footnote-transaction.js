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
define(["require", "exports", "prosemirror-model", "prosemirror-state", "editor/api/transaction", "prosemirror-utils", "./footnote", "editor/api/util"], function (require, exports, prosemirror_model_1, prosemirror_state_1, transaction_1, prosemirror_utils_1, footnote_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // examine transactions and filter out attempts to place foonotes within note bodies
    // (this is not allowed by pandoc markdown)
    function footnoteFilterTransaction(schema) {
        return function (tr, _state) {
            var noteWithPos = footnote_1.selectedNote(schema, tr.selection);
            if (noteWithPos && prosemirror_utils_1.findChildrenByType(noteWithPos.node, schema.nodes.footnote).length) {
                return false;
            }
            return true;
        };
    }
    exports.footnoteFilterTransaction = footnoteFilterTransaction;
    // examine editor transactions and append a transaction that handles fixup of footnote numbers,
    // importing of pasted footnotes, selection propagation to the footnote editor, etc.
    function footnoteAppendTransaction(schema) {
        return function (transactions, oldState, newState) {
            // transaction
            var tr = newState.tr;
            // do footnote fixups if there were any changes affecting footnotes
            var footnoteChange = function (node) {
                return node.type === schema.nodes.footnote || node.type === schema.nodes.note;
            };
            if (transaction_1.transactionsHaveChange(transactions, oldState, newState, footnoteChange)) {
                // footnotes in the document
                var footnotes = prosemirror_utils_1.findChildrenByType(tr.doc, schema.nodes.footnote, true);
                // notes container
                var notes_1 = prosemirror_utils_1.findChildrenByType(tr.doc, schema.nodes.notes, true)[0];
                // iterate through footnotes in the newState
                var refs_1 = new Set();
                footnotes.forEach(function (footnote, index) {
                    // footnote number
                    var number = index + 1;
                    // alias ref and content (either or both may be updated)
                    var _a = footnote.node.attrs, ref = _a.ref, content = _a.content;
                    // we may be creating a new note to append
                    var newNote;
                    // get reference to note (if any)
                    var note = prosemirror_utils_1.findChildrenByType(tr.doc, schema.nodes.note, true).find(function (noteWithPos) { return noteWithPos.node.attrs.ref === ref; });
                    // matching note found
                    if (note) {
                        // update content if this particular note changed
                        // (used to propagate user edits back to data-content)
                        if (transaction_1.transactionsHaveChange(transactions, oldState, newState, function (node) { return node.type === schema.nodes.note && node.attrs.ref === ref; })) {
                            content = JSON.stringify(note.node.content.toJSON());
                        }
                        // if we've already processed this ref then it's a duplicate, make a copy w/ a new ref/id
                        if (refs_1.has(ref)) {
                            // create a new unique id and change the ref to it
                            ref = util_1.uuidv4();
                            // create and insert new note with this id
                            newNote = schema.nodes.note.createAndFill({ ref: ref, number: number }, note.node.content);
                            // otherwise update the note with the correct number
                        }
                        else {
                            tr.setNodeMarkup(note.pos, schema.nodes.note, __assign(__assign({}, note.node.attrs), { number: number }));
                        }
                        // if there is no note then create one using the content attr
                        // (this can happen for a copy/paste operation from another document)
                    }
                    else if (content) {
                        newNote = schema.nodes.note.createAndFill({ ref: ref, number: number }, prosemirror_model_1.Fragment.fromJSON(schema, JSON.parse(content)));
                    }
                    // insert newNote if necessary
                    if (newNote) {
                        tr.insert(notes_1.pos + 1, newNote);
                    }
                    // indicate that we've seen this ref
                    refs_1.add(ref);
                    // set new footnote markup
                    tr.setNodeMarkup(footnote.pos, schema.nodes.footnote, __assign(__assign({}, footnote.node.attrs), { ref: ref,
                        content: content,
                        number: number }));
                });
            }
            // if a footnote is selected then forward selection to it's corresponding note editor
            var footnoteNode = prosemirror_utils_1.findSelectedNodeOfType(schema.nodes.footnote)(newState.selection);
            if (footnoteNode) {
                var ref = footnoteNode.node.attrs.ref;
                var noteNode = footnote_1.findNoteNode(tr.doc, ref);
                if (noteNode) {
                    tr.setSelection(prosemirror_state_1.TextSelection.near(tr.doc.resolve(noteNode.pos)));
                }
            }
            if (tr.docChanged || tr.selectionSet) {
                return tr;
            }
        };
    }
    exports.footnoteAppendTransaction = footnoteAppendTransaction;
});
//# sourceMappingURL=footnote-transaction.js.map