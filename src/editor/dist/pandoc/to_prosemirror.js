define(["require", "exports", "prosemirror-model", "editor/api/pandoc", "editor/api/util"], function (require, exports, prosemirror_model_1, pandoc_1, util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pandocToProsemirror(ast, schema, readers) {
        var parser = new Parser(schema, readers);
        return parser.parse(ast);
    }
    exports.pandocToProsemirror = pandocToProsemirror;
    var Parser = /** @class */ (function () {
        function Parser(schema, readers) {
            this.schema = schema;
            this.handlers = this.createHandlers(readers);
        }
        Parser.prototype.parse = function (ast) {
            var state = new ParserState(this.schema);
            this.parseTokens(state, ast.blocks);
            return state.doc();
        };
        Parser.prototype.parseTokens = function (state, tokens) {
            for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
                var tok = tokens_1[_i];
                var handler = this.handlers[tok.t];
                if (handler) {
                    handler(state, tok);
                }
                else {
                    throw new Error("No handler for pandoc token " + tok.t);
                }
            }
        };
        // create parser token handler functions based on the passed readers
        Parser.prototype.createHandlers = function (readers) {
            var _this = this;
            var handlers = Object.create(null);
            var _loop_1 = function (reader) {
                // resolve children (provide default impl)
                var getChildren = reader.getChildren || (function (tok) { return tok.c; });
                // resolve getAttrs (provide default imple)
                var getAttrs = reader.getAttrs ? reader.getAttrs : function (tok) { return ({}); };
                // text
                if (reader.text) {
                    handlers[reader.token] = function (state, tok) {
                        if (reader.getText) {
                            var text = reader.getText(tok);
                            state.addText(text);
                        }
                    };
                    // marks (ignore unknown)
                }
                else if (reader.mark) {
                    if (!this_1.schema.marks[reader.mark]) {
                        return "continue";
                    }
                    handlers[reader.token] = function (state, tok) {
                        var markType = _this.schema.marks[reader.mark];
                        var mark = markType.create(getAttrs(tok));
                        state.openMark(mark);
                        if (reader.getText) {
                            state.addText(reader.getText(tok));
                        }
                        else {
                            _this.parseTokens(state, getChildren(tok));
                        }
                        state.closeMark(mark);
                    };
                    // blocks (ignore unknown)
                }
                else if (reader.block) {
                    if (!this_1.schema.nodes[reader.block]) {
                        return "continue";
                    }
                    var nodeType_1 = this_1.schema.nodes[reader.block];
                    handlers[reader.token] = function (state, tok) {
                        state.openNode(nodeType_1, getAttrs(tok));
                        if (reader.getText) {
                            state.addText(reader.getText(tok));
                        }
                        else {
                            _this.parseTokens(state, getChildren(tok));
                        }
                        state.closeNode();
                    };
                    // nodes (inore unknown)
                }
                else if (reader.node) {
                    if (!this_1.schema.nodes[reader.node]) {
                        return "continue";
                    }
                    var nodeType_2 = this_1.schema.nodes[reader.node];
                    handlers[reader.token] = function (state, tok) {
                        var content = [];
                        if (reader.getText) {
                            content = [_this.schema.text(reader.getText(tok))];
                        }
                        state.addNode(nodeType_2, getAttrs(tok), content);
                    };
                    // lists (ignore unknown)
                }
                else if (reader.list) {
                    if (!this_1.schema.nodes[reader.list]) {
                        return "continue";
                    }
                    var nodeType_3 = this_1.schema.nodes[reader.list];
                    var listItem = 'list_item';
                    var listItemNodeType_1 = this_1.schema.nodes[listItem];
                    handlers[reader.token] = function (state, tok) {
                        var children = getChildren(tok);
                        var attrs = getAttrs(tok);
                        attrs.tight = children.length && children[0][0].t === 'Plain';
                        state.openNode(nodeType_3, attrs);
                        children.forEach(function (child) {
                            var childAttrs = { checked: null };
                            // look for checkbox in first character of child tokens
                            // if we see it, remove it and set childAttrs.checked as appropriate
                            var childWithChecked = tokensWithChecked(child);
                            childAttrs.checked = childWithChecked.checked;
                            // process children
                            state.openNode(listItemNodeType_1, childAttrs);
                            _this.parseTokens(state, childWithChecked.tokens);
                            state.closeNode();
                        });
                        state.closeNode();
                    };
                    // footnotes
                }
                else if (reader.note) {
                    if (!this_1.schema.nodes[reader.note]) {
                        return "continue";
                    }
                    var nodeType_4 = this_1.schema.nodes[reader.note];
                    handlers[reader.token] = function (state, tok) {
                        // generate unique id
                        var ref = util_1.uuidv4();
                        // add note to notes collection (will be handled specially by closeNode b/c it
                        // has schema.nodes.node type)
                        state.openNote(ref);
                        _this.parseTokens(state, getChildren(tok));
                        var noteNode = state.closeNode();
                        // store json version of node in an attribute of the footnote (we can copy/paste)
                        // between different documents
                        var content = JSON.stringify(noteNode.content.toJSON());
                        // add inline node to the body
                        state.addNode(nodeType_4, { ref: ref, number: noteNode.attrs.number, content: content }, []);
                    };
                }
            };
            var this_1 = this;
            for (var _i = 0, readers_1 = readers; _i < readers_1.length; _i++) {
                var reader = readers_1[_i];
                _loop_1(reader);
            }
            return handlers;
        };
        return Parser;
    }());
    var kCheckedChar = '☒';
    var kUncheckedChar = '☐';
    function tokensWithChecked(tokens) {
        // will set this flag based on inspecting the first Str token
        var checked;
        var lastWasChecked = false;
        // map tokens
        var mappedTokens = pandoc_1.mapTokens(tokens, function (tok) {
            // if the last token was checked then strip the next space
            if (tok.t === 'Space' && lastWasChecked) {
                lastWasChecked = false;
                return {
                    t: 'Str',
                    c: '',
                };
            }
            // derive 'checked' from first chraracter of first Str token encountered
            // if we find checked or unchecked then set the flag and strip off
            // the first 2 chraracters (the check and the space after it)
            else if (tok.t === 'Str' && checked === undefined) {
                var text = tok.c;
                if (text.charAt(0) === kCheckedChar) {
                    checked = true;
                    lastWasChecked = true;
                    text = text.slice(1);
                }
                else if (text.charAt(0) === kUncheckedChar) {
                    checked = false;
                    lastWasChecked = true;
                    text = text.slice(1);
                }
                else {
                    checked = null;
                }
                return {
                    t: 'Str',
                    c: text,
                };
            }
            else {
                return tok;
            }
        });
        // return
        return {
            checked: checked !== undefined ? checked : null,
            tokens: mappedTokens,
        };
    }
    var ParserState = /** @class */ (function () {
        function ParserState(schema) {
            this.schema = schema;
            this.stack = [{ type: this.schema.nodes.body, attrs: {}, content: [] }];
            this.notes = [];
            this.marks = prosemirror_model_1.Mark.none;
            this.footnoteNumber = 1;
        }
        ParserState.prototype.doc = function () {
            var content = [];
            content.push(this.top().type.createAndFill(null, this.top().content));
            content.push(this.schema.nodes.notes.createAndFill(null, this.notes));
            return this.schema.topNodeType.createAndFill({}, content);
        };
        ParserState.prototype.addText = function (text) {
            if (!text) {
                return;
            }
            var nodes = this.top().content;
            var last = nodes[nodes.length - 1];
            var node = this.schema.text(text, this.marks);
            var merged = this.maybeMerge(last, node);
            if (last && merged) {
                nodes[nodes.length - 1] = merged;
            }
            else {
                nodes.push(node);
            }
        };
        ParserState.prototype.addNode = function (type, attrs, content) {
            var node = type.createAndFill(attrs, content, this.marks);
            if (!node) {
                return null;
            }
            if (this.stack.length) {
                if (type === this.schema.nodes.note) {
                    this.notes.push(node);
                }
                else {
                    this.top().content.push(node);
                }
            }
            return node;
        };
        ParserState.prototype.openNode = function (type, attrs) {
            this.stack.push({ type: type, attrs: attrs, content: [] });
        };
        ParserState.prototype.closeNode = function () {
            if (this.marks.length) {
                this.marks = prosemirror_model_1.Mark.none;
            }
            var info = this.stack.pop();
            return this.addNode(info.type, info.attrs, info.content);
        };
        ParserState.prototype.openMark = function (mark) {
            this.marks = mark.addToSet(this.marks);
        };
        ParserState.prototype.closeMark = function (mark) {
            this.marks = mark.removeFromSet(this.marks);
        };
        ParserState.prototype.openNote = function (ref) {
            this.openNode(this.schema.nodes.note, { ref: ref, number: this.footnoteNumber++ });
        };
        ParserState.prototype.top = function () {
            return this.stack[this.stack.length - 1];
        };
        ParserState.prototype.maybeMerge = function (a, b) {
            if (a && a.isText && b.isText && prosemirror_model_1.Mark.sameSet(a.marks, b.marks)) {
                return this.schema.text((a.text + b.text), a.marks);
            }
            else {
                return undefined;
            }
        };
        return ParserState;
    }());
});
//# sourceMappingURL=to_prosemirror.js.map