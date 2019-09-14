define(["require", "exports", "prosemirror-state", "prosemirror-utils", "editor/api/command", "editor/api/node", "./footnote-editor", "./footnote-transaction", "editor/api/util"], function (require, exports, prosemirror_state_1, prosemirror_utils_1, command_1, node_1, footnote_editor_1, footnote_transaction_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var plugin = new prosemirror_state_1.PluginKey('footnote');
    var extension = {
        nodes: [
            {
                name: 'footnote',
                spec: {
                    inline: true,
                    attrs: {
                        number: { default: 1 },
                        ref: {},
                        content: { default: '' },
                    },
                    group: 'inline',
                    // atom: true,
                    parseDOM: [
                        {
                            tag: "span[class='footnote']",
                            getAttrs: function (dom) {
                                var el = dom;
                                return {
                                    ref: el.getAttribute('data-ref'),
                                    content: el.getAttribute('data-content'),
                                };
                            },
                        },
                    ],
                    toDOM: function (node) {
                        return [
                            'span',
                            { class: 'footnote', 'data-ref': node.attrs.ref, 'data-content': node.attrs.content },
                            node.attrs.number.toString(),
                        ];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Note',
                            note: 'footnote',
                        },
                    ],
                    writer: function (output, node) {
                        output.writeNote(node);
                    },
                },
            },
        ],
        plugins: function (schema) {
            return [
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    // footnote editor
                    props: {
                        handleKeyDown: footnote_editor_1.footnoteEditorKeyDownHandler(schema),
                        decorations: footnote_editor_1.footnoteEditorDecorations(schema),
                        nodeViews: footnote_editor_1.footnoteEditorNodeViews(schema),
                    },
                    // footnote transactions (fixups, etc.)
                    filterTransaction: footnote_transaction_1.footnoteFilterTransaction(schema),
                    appendTransaction: footnote_transaction_1.footnoteAppendTransaction(schema),
                }),
            ];
        },
        commands: function (schema) {
            return [new command_1.Command('footnote', ['Mod-^'], footnoteCommandFn(schema))];
        },
    };
    function footnoteCommandFn(schema) {
        return function (state, dispatch, view) {
            if (!canInsertFootnote(state)) {
                return false;
            }
            if (dispatch) {
                var tr = state.tr;
                insertFootnote(tr);
                dispatch(tr);
            }
            return true;
        };
    }
    function canInsertFootnote(state) {
        return (node_1.canInsertNode(state, state.schema.nodes.footnote) && !prosemirror_utils_1.findParentNodeOfType(state.schema.nodes.note)(state.selection));
    }
    function insertFootnote(tr, edit, content) {
        if (edit === void 0) { edit = true; }
        // resolve content
        var schema = tr.doc.type.schema;
        if (!content) {
            content = schema.nodes.paragraph.create();
        }
        // generate note id
        var ref = util_1.uuidv4();
        // insert empty note
        var notes = prosemirror_utils_1.findChildrenByType(tr.doc, schema.nodes.notes, true)[0];
        var note = schema.nodes.note.createAndFill({ ref: ref }, content);
        tr.insert(notes.pos + 1, note);
        // insert footnote linked to note
        var footnote = schema.nodes.footnote.create({ ref: ref });
        tr.replaceSelectionWith(footnote);
        // open note editor
        if (edit) {
            var noteNode = findNoteNode(tr.doc, ref);
            if (noteNode) {
                tr.setSelection(prosemirror_state_1.TextSelection.near(tr.doc.resolve(noteNode.pos)));
            }
        }
        // return ref
        return ref;
    }
    function selectedFootnote(schema, selection) {
        return prosemirror_utils_1.findSelectedNodeOfType(schema.nodes.footnote)(selection);
    }
    exports.selectedFootnote = selectedFootnote;
    function selectedNote(schema, selection) {
        return prosemirror_utils_1.findParentNodeOfType(schema.nodes.note)(selection);
    }
    exports.selectedNote = selectedNote;
    function findNoteNode(doc, ref) {
        return findNodeOfTypeWithRef(doc, doc.type.schema.nodes.note, ref);
    }
    exports.findNoteNode = findNoteNode;
    function findFootnoteNode(doc, ref) {
        return findNodeOfTypeWithRef(doc, doc.type.schema.nodes.footnote, ref);
    }
    exports.findFootnoteNode = findFootnoteNode;
    function findNodeOfTypeWithRef(doc, type, ref) {
        var foundNode = prosemirror_utils_1.findChildren(doc, function (node) { return node.type === type && node.attrs.ref === ref; }, true);
        if (foundNode.length) {
            return foundNode[0];
        }
        else {
            return undefined;
        }
    }
    exports.default = extension;
});
//# sourceMappingURL=footnote.js.map