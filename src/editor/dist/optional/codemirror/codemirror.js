var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "prosemirror-state", "prosemirror-history", "prosemirror-commands", "prosemirror-keymap", "prosemirror-inputrules", "codemirror", "codemirror/mode/clike/clike", "codemirror/mode/javascript/javascript", "codemirror/mode/htmlembedded/htmlembedded", "codemirror/mode/css/css", "codemirror/mode/markdown/markdown", "codemirror/mode/python/python", "codemirror/mode/r/r", "codemirror/mode/shell/shell", "codemirror/mode/sql/sql", "codemirror/mode/yaml/yaml", "codemirror/mode/yaml-frontmatter/yaml-frontmatter", "codemirror/lib/codemirror.css", "./codemirror.css"], function (require, exports, prosemirror_state_1, prosemirror_history_1, prosemirror_commands_1, prosemirror_keymap_1, prosemirror_inputrules_1, codemirror_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    codemirror_1 = __importDefault(codemirror_1);
    var plugin = new prosemirror_state_1.PluginKey('codemirror');
    var extension = {
        plugins: function (schema) {
            return [
                // embedded code editor
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    props: {
                        nodeViews: {
                            code_block: function (node, view, getPos) {
                                return new CodeBlockNodeView(node, view, getPos);
                            }
                        }
                    },
                }),
                // arrow in and out of editor
                prosemirror_keymap_1.keymap({
                    ArrowLeft: arrowHandler("left"),
                    ArrowRight: arrowHandler("right"),
                    ArrowUp: arrowHandler("up"),
                    ArrowDown: arrowHandler("down")
                })
            ];
        },
    };
    // https://github.com/ProseMirror/website/blob/master/example/codemirror/index.js
    var CodeBlockNodeView = /** @class */ (function () {
        function CodeBlockNodeView(node, view, getPos) {
            var _this = this;
            // Store for later
            this.node = node;
            this.view = view;
            this.getPos = getPos;
            this.incomingChanges = false;
            // Create a CodeMirror instance
            this.cm = codemirror_1.default(null, {
                value: this.node.textContent,
                lineNumbers: true,
                extraKeys: this.codeMirrorKeymap(),
                mode: modeForNode(node)
            });
            // The editor's outer node is our DOM representation
            this.dom = this.cm.getWrapperElement();
            // If it's being created immediately adjacent to the selection
            // then grab the focus (this is an insert code block from a menu
            // which doesn't end up propagating the focus into codemirror)
            var takeFocus = Math.abs(view.state.selection.anchor - getPos()) <= 1;
            // CodeMirror needs to be in the DOM to properly initialize, so
            // schedule it to update itself (also takeFocus if requested)
            setTimeout(function () {
                _this.cm.refresh();
                if (takeFocus) {
                    _this.cm.focus();
                }
            }, 20);
            // This flag is used to avoid an update loop between the outer and
            // inner editor
            this.updating = false;
            // Track whether changes are have been made but not yet propagated
            this.cm.on("beforeChange", function () { return _this.incomingChanges = true; });
            // Propagate updates from the code editor to ProseMirror
            this.cm.on("cursorActivity", function () {
                if (!_this.updating && !_this.incomingChanges) {
                    _this.forwardSelection();
                }
            });
            this.cm.on("changes", function () {
                if (!_this.updating) {
                    _this.valueChanged();
                    _this.forwardSelection();
                }
                _this.incomingChanges = false;
            });
            this.cm.on("focus", function () { return _this.forwardSelection(); });
        }
        CodeBlockNodeView.prototype.update = function (node) {
            if (node.type !== this.node.type) {
                return false;
            }
            this.node = node;
            var change = computeChange(this.cm.getValue(), node.textContent);
            if (change) {
                this.updating = true;
                var cmDoc = this.cm.getDoc();
                cmDoc.replaceRange(change.text, cmDoc.posFromIndex(change.from), cmDoc.posFromIndex(change.to));
                this.updating = false;
            }
            return true;
        };
        CodeBlockNodeView.prototype.setSelection = function (anchor, head) {
            this.cm.focus();
            this.updating = true;
            var cmDoc = this.cm.getDoc();
            cmDoc.setSelection(cmDoc.posFromIndex(anchor), cmDoc.posFromIndex(head));
            this.updating = false;
        };
        CodeBlockNodeView.prototype.selectNode = function () {
            this.cm.focus();
        };
        CodeBlockNodeView.prototype.stopEvent = function () {
            return true;
        };
        CodeBlockNodeView.prototype.forwardSelection = function () {
            if (!this.cm.hasFocus()) {
                return;
            }
            var state = this.view.state;
            var selection = this.asProseMirrorSelection(state.doc);
            if (!selection.eq(state.selection)) {
                this.view.dispatch(state.tr.setSelection(selection));
            }
        };
        CodeBlockNodeView.prototype.asProseMirrorSelection = function (doc) {
            var offset = this.getPos() + 1;
            var cmDoc = this.cm.getDoc();
            var anchor = cmDoc.indexFromPos(cmDoc.getCursor("anchor")) + offset;
            var head = cmDoc.indexFromPos(cmDoc.getCursor("head")) + offset;
            return prosemirror_state_1.TextSelection.create(doc, anchor, head);
        };
        CodeBlockNodeView.prototype.valueChanged = function () {
            var change = computeChange(this.node.textContent, this.cm.getValue());
            if (change) {
                var start = this.getPos() + 1;
                var tr = this.view.state.tr.replaceWith(start + change.from, start + change.to, change.text ? this.node.type.schema.text(change.text) : null);
                this.view.dispatch(tr);
            }
        };
        CodeBlockNodeView.prototype.codeMirrorKeymap = function () {
            var _a;
            var _this = this;
            var view = this.view;
            var mod = /Mac/.test(navigator.platform) ? "Cmd" : "Ctrl";
            // exit code block
            var exitBlock = function () {
                if (prosemirror_commands_1.exitCode(view.state, view.dispatch)) {
                    view.focus();
                }
            };
            // Note: normalizeKeyMap not declared in CodeMirror types
            // so we cast to any
            return codemirror_1.default.normalizeKeyMap((_a = {
                    Up: function () { return _this.arrowMaybeEscape("line", -1); },
                    Left: function () { return _this.arrowMaybeEscape("char", -1); },
                    Down: function () { return _this.arrowMaybeEscape("line", 1); },
                    Right: function () { return _this.arrowMaybeEscape("char", 1); },
                    Backspace: function () { return _this.backspaceMaybeDeleteNode(); }
                },
                // undo/redo keys are technically rebindable in the parent 
                // editor so we may need a way to propagate the rebinding here
                _a[mod + "-Z"] = function () { return prosemirror_history_1.undo(view.state, view.dispatch); },
                _a["Shift-" + mod + "-Z"] = function () { return prosemirror_history_1.redo(view.state, view.dispatch); },
                _a[mod + "-Y"] = function () { return prosemirror_history_1.redo(view.state, view.dispatch); },
                _a["Ctrl-Enter"] = exitBlock,
                _a["Shift-Enter"] = exitBlock,
                _a[mod + "-Enter"] = exitBlock,
                _a));
        };
        CodeBlockNodeView.prototype.backspaceMaybeDeleteNode = function () {
            // if the node is empty and we execute a backspace then delete the node
            if (this.node.childCount === 0) {
                // if there is an input rule we just executed then use this to undo it
                if (prosemirror_inputrules_1.undoInputRule(this.view.state)) {
                    prosemirror_inputrules_1.undoInputRule(this.view.state, this.view.dispatch);
                    this.view.focus();
                }
                else {
                    var tr = this.view.state.tr;
                    tr.delete(this.getPos(), this.getPos() + this.node.nodeSize);
                    tr.setSelection(prosemirror_state_1.TextSelection.near(tr.doc.resolve(this.getPos()), -1));
                    this.view.dispatch(tr);
                    this.view.focus();
                }
            }
            else {
                return codemirror_1.default.Pass;
            }
        };
        CodeBlockNodeView.prototype.arrowMaybeEscape = function (unit, dir) {
            var cmDoc = this.cm.getDoc();
            var pos = cmDoc.getCursor();
            if (cmDoc.somethingSelected() ||
                pos.line !== (dir < 0 ? cmDoc.firstLine() : cmDoc.lastLine()) ||
                (unit === "char" &&
                    pos.ch !== (dir < 0 ? 0 : cmDoc.getLine(pos.line).length))) {
                return codemirror_1.default.Pass;
            }
            this.view.focus();
            var targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
            var selection = prosemirror_state_1.Selection.near(this.view.state.doc.resolve(targetPos), dir);
            this.view.dispatch(this.view.state.tr.setSelection(selection).scrollIntoView());
            this.view.focus();
        };
        return CodeBlockNodeView;
    }());
    function computeChange(oldVal, newVal) {
        if (oldVal === newVal) {
            return null;
        }
        var start = 0;
        var oldEnd = oldVal.length;
        var newEnd = newVal.length;
        while (start < oldEnd && oldVal.charCodeAt(start) === newVal.charCodeAt(start)) {
            ++start;
        }
        while (oldEnd > start && newEnd > start &&
            oldVal.charCodeAt(oldEnd - 1) === newVal.charCodeAt(newEnd - 1)) {
            oldEnd--;
            newEnd--;
        }
        return {
            from: start,
            to: oldEnd,
            text: newVal.slice(start, newEnd)
        };
    }
    function modeForNode(node) {
        var modeMap = {
            r: 'r',
            python: 'python',
            sql: 'sql',
            c: 'clike',
            cpp: 'clike',
            java: 'clike',
            js: 'javascript',
            javascript: 'javascript',
            html: 'html',
            css: 'css',
            markdown: 'markdown',
            yaml: 'yaml',
            shell: 'shell',
            bash: 'bash'
        };
        var modes = Object.keys(modeMap);
        for (var _i = 0, _a = node.attrs.classes; _i < _a.length; _i++) {
            var clz = _a[_i];
            if (modes.indexOf(clz) !== -1) {
                return modeMap[clz];
            }
        }
        return null;
    }
    function arrowHandler(dir) {
        return function (state, dispatch, view) {
            if (state.selection.empty && view && view.endOfTextblock(dir)) {
                var side = dir === "left" || dir === "up" ? -1 : 1;
                var $head = state.selection.$head;
                var nextPos = prosemirror_state_1.Selection.near(state.doc.resolve(side > 0 ? $head.after() : $head.before()), side);
                if (nextPos.$head && nextPos.$head.parent.type.name === "code_block") {
                    if (dispatch) {
                        dispatch(state.tr.setSelection(nextPos));
                    }
                    return true;
                }
            }
            return false;
        };
    }
    exports.default = extension;
});
//# sourceMappingURL=codemirror.js.map