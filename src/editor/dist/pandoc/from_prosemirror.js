define(["require", "exports", "prosemirror-model"], function (require, exports, prosemirror_model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function pandocFromProsemirror(doc, apiVersion, nodeWriters, markWriters) {
        var bodyNode = doc.child(0);
        var notesNode = doc.child(1);
        var writer = new PandocWriter(apiVersion, nodeWriters, markWriters, notesNode);
        writer.writeBlocks(bodyNode);
        return writer.output();
    }
    exports.pandocFromProsemirror = pandocFromProsemirror;
    var PandocWriter = /** @class */ (function () {
        function PandocWriter(apiVersion, nodeWriters, markWriters, notes) {
            var _this = this;
            // create maps of node and mark writers
            this.nodeWriters = {};
            nodeWriters.forEach(function (writer) {
                _this.nodeWriters[writer.name] = writer.write;
            });
            this.markWriters = {};
            markWriters.forEach(function (writer) {
                _this.markWriters[writer.name] = writer;
            });
            // create map of notes
            this.notes = {};
            notes.forEach(function (note) {
                _this.notes[note.attrs.ref] = note;
            });
            this.ast = {
                blocks: [],
                'pandoc-api-version': apiVersion,
                meta: {},
            };
            this.containers = [this.ast.blocks];
            this.activeMarks = [];
            this.tightList = [];
        }
        PandocWriter.prototype.output = function () {
            return this.ast;
        };
        PandocWriter.prototype.write = function (value) {
            var container = this.containers[this.containers.length - 1];
            container.push(value);
        };
        PandocWriter.prototype.writeToken = function (type, content) {
            var token = {
                t: type,
            };
            if (content) {
                if (typeof content === 'function') {
                    token.c = [];
                    this.fill(token.c, content);
                }
                else {
                    token.c = content;
                }
            }
            this.write(token);
        };
        PandocWriter.prototype.writeMark = function (type, parent, expelEnclosingWhitespace) {
            var _this = this;
            if (expelEnclosingWhitespace === void 0) { expelEnclosingWhitespace = false; }
            if (expelEnclosingWhitespace) {
                // build output spec
                var output_1 = {
                    spaceBefore: false,
                    nodes: new Array(),
                    spaceAfter: false,
                };
                // if we see leading or trailing spaces we need to output them as tokens
                // and substitute text nodes
                parent.forEach(function (node, offset, index) {
                    // check for leading/trailing space in first/last nodes
                    if (node.isText) {
                        var outputText = node.textContent;
                        // checking for leading space in first node
                        if (index === 0 && node.textContent.match(/^\s+/)) {
                            output_1.spaceBefore = true;
                            outputText = outputText.trimLeft();
                        }
                        // check for trailing space in last node
                        if (index === parent.childCount - 1 && node.textContent.match(/\s+$/)) {
                            output_1.spaceAfter = true;
                            outputText = outputText.trimRight();
                        }
                        // if we modified the node's text then create a new node
                        if (outputText !== node.textContent) {
                            output_1.nodes.push(node.type.schema.text(outputText, node.marks));
                        }
                        else {
                            output_1.nodes.push(node);
                        }
                    }
                    else {
                        output_1.nodes.push(node);
                    }
                });
                // output space tokens before/after mark as necessary
                if (output_1.spaceBefore) {
                    this.writeToken('Space');
                }
                this.writeToken(type, function () {
                    _this.writeInlines(prosemirror_model_1.Fragment.from(output_1.nodes));
                });
                if (output_1.spaceAfter) {
                    this.writeToken('Space');
                }
                // normal codepath (not expelling existing whitespace)
            }
            else {
                this.writeToken(type, function () {
                    _this.writeInlines(parent);
                });
            }
        };
        PandocWriter.prototype.writeArray = function (content) {
            var arr = [];
            this.fill(arr, content);
            this.write(arr);
        };
        PandocWriter.prototype.writeAttr = function (id, classes, keyvalue) {
            if (classes === void 0) { classes = []; }
            if (keyvalue === void 0) { keyvalue = []; }
            this.write([id || '', classes, keyvalue]);
        };
        PandocWriter.prototype.writeText = function (text) {
            var _this = this;
            if (text) {
                var strs_1 = text.split(' ');
                strs_1.forEach(function (value, i) {
                    if (value) {
                        _this.writeToken('Str', value);
                        if (i < strs_1.length - 1) {
                            _this.writeToken('Space');
                        }
                    }
                    else {
                        _this.writeToken('Space');
                    }
                });
            }
        };
        PandocWriter.prototype.writeListBlock = function (list, content) {
            var token = list.type === list.type.schema.nodes.ordered_list
                ? 'OrderedList' : 'BulletList';
            this.tightList.push(list.attrs.tight);
            this.writeToken(token, content);
            this.tightList.pop();
        };
        PandocWriter.prototype.writeListItemParagraph = function (content) {
            var tight = this.tightList[this.tightList.length - 1];
            var paraItemBlockType = tight ? 'Plain' : 'Para';
            this.writeToken(paraItemBlockType, content);
        };
        PandocWriter.prototype.writeNote = function (note) {
            var _this = this;
            var noteBody = this.notes[note.attrs.ref];
            this.writeToken('Note', function () {
                _this.writeBlocks(noteBody);
            });
        };
        PandocWriter.prototype.writeBlock = function (block) {
            this.nodeWriters[block.type.name](this, block);
        };
        PandocWriter.prototype.writeBlocks = function (parent) {
            parent.forEach(this.writeBlock.bind(this));
        };
        PandocWriter.prototype.writeInlines = function (parent) {
            var _this = this;
            // get the marks from a node that are not already on the stack of active marks
            var nodeMarks = function (node) {
                // get marks -- order marks by priority (code lowest so that we never include
                // other markup inside code)
                var marks = node.marks.sort(function (a, b) {
                    var aPriority = _this.markWriters[a.type.name].priority;
                    var bPriority = _this.markWriters[b.type.name].priority;
                    if (aPriority < bPriority) {
                        return -1;
                    }
                    else if (bPriority < aPriority) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
                // remove active marks
                for (var _i = 0, _a = _this.activeMarks; _i < _a.length; _i++) {
                    var activeMark = _a[_i];
                    marks = activeMark.removeFromSet(marks);
                }
                // return marks
                return marks;
            };
            // helpers to iterate through the nodes (sans any marks already on the stack)
            var currentChild = 0;
            var nextNode = function () {
                var childIndex = currentChild;
                currentChild++;
                return {
                    node: parent.child(childIndex),
                    marks: nodeMarks(parent.child(childIndex)),
                };
            };
            var putBackNode = function () {
                currentChild--;
            };
            // iterate through the nodes
            while (currentChild < parent.childCount) {
                // get the next node
                var next = nextNode();
                // if there are active marks then collect them up and call the mark handler
                // with all nodes that it contains, otherwise just process it as a plain
                // unmarked node
                if (next.marks.length > 0) {
                    // get the mark and start building a list of marked nodes
                    var mark = next.marks[0];
                    var markedNodes = [next.node];
                    // inner iteration to find nodes that have this mark
                    while (currentChild < parent.childCount) {
                        next = nextNode();
                        if (mark.type.isInSet(next.marks)) {
                            markedNodes.push(next.node);
                        }
                        else {
                            // no mark found, "put back" the node
                            putBackNode();
                            break;
                        }
                    }
                    // call the mark writer after noting that this mark is active (which
                    // will cause subsequent recursive invocations of this function to
                    // not re-process this mark)
                    this.activeMarks.push(mark.type);
                    this.markWriters[mark.type.name].write(this, mark, prosemirror_model_1.Fragment.from(markedNodes));
                    this.activeMarks.pop();
                }
                else {
                    // ordinary unmarked node, call the node writer
                    this.nodeWriters[next.node.type.name](this, next.node);
                }
            }
        };
        PandocWriter.prototype.fill = function (container, content) {
            this.containers.push(container);
            content();
            this.containers.pop();
        };
        return PandocWriter;
    }());
});
//# sourceMappingURL=from_prosemirror.js.map