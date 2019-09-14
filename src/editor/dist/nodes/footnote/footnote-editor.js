define(["require", "exports", "prosemirror-view", "prosemirror-utils", "prosemirror-state", "editor/api/decoration", "editor/api/node", "editor/api/selection", "./footnote"], function (require, exports, prosemirror_view_1, prosemirror_utils_1, prosemirror_state_1, decoration_1, node_1, selection_1, footnote_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // selection-driven decorations (mostly css classes) required to activate the footnote editor
    function footnoteEditorDecorations(schema) {
        return function (state) {
            // see if either a footnote node or note (footnote editor) node has the selection
            var footnoteNode = footnote_1.selectedFootnote(schema, state.selection);
            var noteNode = footnote_1.selectedNote(schema, state.selection);
            // if they do then we need to enable footnote editing/behavior by
            // using decorators to inject appropriate css classes
            if (footnoteNode || noteNode) {
                // get body and notes nodes
                var bodyNode = prosemirror_utils_1.findChildrenByType(state.doc, schema.nodes.body)[0];
                var notesNode = prosemirror_utils_1.findChildrenByType(state.doc, schema.nodes.notes)[0];
                // resolve the specific footnote node or specific note node
                if (footnoteNode) {
                    var ref_1 = footnoteNode.node.attrs.ref;
                    var matching = prosemirror_utils_1.findChildren(notesNode.node, function (node) { return node.attrs.ref === ref_1; });
                    if (matching.length) {
                        noteNode = matching[0];
                        noteNode.pos = notesNode.pos + 1 + noteNode.pos;
                    }
                }
                else if (noteNode) {
                    var ref_2 = noteNode.node.attrs.ref;
                    var matching = prosemirror_utils_1.findChildren(state.doc, function (node) { return node.type === schema.nodes.footnote && node.attrs.ref === ref_2; }, true);
                    if (matching.length) {
                        footnoteNode = matching[0];
                    }
                }
                if (footnoteNode && noteNode) {
                    return prosemirror_view_1.DecorationSet.create(state.doc, [
                        // make notes node visible
                        decoration_1.nodeDecoration(noteNode, { class: 'active' }),
                        // paint outline over footnote
                        decoration_1.nodeDecoration(footnoteNode, { class: 'active' }),
                        // position body and notes nodes for footnote editing
                        decoration_1.nodeDecoration(bodyNode, { class: 'editing-footnote' }),
                        decoration_1.nodeDecoration(notesNode, { class: 'editing-footnote' }),
                    ]);
                }
                else {
                    return prosemirror_view_1.DecorationSet.empty;
                }
            }
            else {
                return prosemirror_view_1.DecorationSet.empty;
            }
        };
    }
    exports.footnoteEditorDecorations = footnoteEditorDecorations;
    // node view that display the note number alongside the note content
    function footnoteEditorNodeViews(_schema) {
        return {
            note: function (node, view, getPos) {
                return new NoteEditorView(node, view, getPos);
            },
        };
    }
    exports.footnoteEditorNodeViews = footnoteEditorNodeViews;
    var NoteEditorView = /** @class */ (function () {
        function NoteEditorView(node, view, getPos) {
            this.node = node;
            this.view = view;
            this.getPos = getPos;
            this.dom = window.document.createElement('div');
            this.dom.setAttribute('data-ref', this.node.attrs.ref);
            this.dom.classList.add('note');
            var label = window.document.createElement('div');
            label.classList.add('note-label');
            label.contentEditable = 'false';
            label.innerHTML = "<p>" + this.node.attrs.number + ":</p>";
            this.dom.appendChild(label);
            var content = window.document.createElement('div');
            content.classList.add('note-content');
            this.contentDOM = content;
            this.dom.appendChild(content);
        }
        return NoteEditorView;
    }());
    // custom handling for arrow keys that cause selection to escape the editor
    function footnoteEditorKeyDownHandler(schema) {
        return function (view, event) {
            // alias selection
            var selection = view.state.selection;
            // pass if the selection isn't in a note
            var noteNode = prosemirror_utils_1.findParentNodeOfType(schema.nodes.note)(selection);
            if (!noteNode) {
                return false;
            }
            // function to find and move selection to associated footnote
            // will call this from Escape, ArrowLeft, and ArrowUp handlers below
            var selectFootnote = function (before) {
                if (before === void 0) { before = true; }
                var footnoteNode = footnote_1.findFootnoteNode(view.state.doc, noteNode.node.attrs.ref);
                if (footnoteNode) {
                    var tr = view.state.tr;
                    tr.setSelection(prosemirror_state_1.TextSelection.near(tr.doc.resolve(footnoteNode.pos + (before ? 0 : 1))));
                    view.dispatch(tr);
                }
            };
            // if this is the Escape key then close the editor
            if (event.key === 'Escape') {
                selectFootnote();
                return true;
            }
            // ...otherwise check to see if the user is attempting to arrow out of the footnote
            // get first and last text block nodes (bail if we aren't in either)
            var firstTextBlock = node_1.firstNode(noteNode, function (node) { return node.isTextblock; });
            var lastTextBlock = node_1.lastNode(noteNode, function (node) { return node.isTextblock; });
            if (!firstTextBlock && !lastTextBlock) {
                return false;
            }
            // exiting from first text block w/ left or up arrow?
            if (firstTextBlock) {
                if (selection_1.selectionIsWithin(selection, firstTextBlock)) {
                    switch (event.key) {
                        case 'ArrowLeft':
                            if (selection.anchor === firstTextBlock.pos + 1) {
                                selectFootnote(true);
                                return true;
                            }
                            break;
                        case 'ArrowUp': {
                            if (view.endOfTextblock('up')) {
                                selectFootnote(true);
                                return true;
                            }
                            break;
                        }
                    }
                }
            }
            // exiting from last text block with right or down arrow?
            if (lastTextBlock) {
                if (selection_1.selectionIsWithin(selection, lastTextBlock)) {
                    switch (event.key) {
                        case 'ArrowRight':
                            if (selection.anchor === lastTextBlock.pos + lastTextBlock.node.nodeSize - 1) {
                                selectFootnote(false);
                                return true;
                            }
                            break;
                        case 'ArrowDown': {
                            if (view.endOfTextblock('down')) {
                                selectFootnote(false);
                                return true;
                            }
                            break;
                        }
                    }
                }
            }
            return false;
        };
    }
    exports.footnoteEditorKeyDownHandler = footnoteEditorKeyDownHandler;
});
//# sourceMappingURL=footnote-editor.js.map