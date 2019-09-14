var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports", "prosemirror-state", "prosemirror-utils", "editor/api/mark", "editor/api/text", "editor/api/transaction"], function (require, exports, prosemirror_state_1, prosemirror_utils_1, mark_1, text_1, transaction_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var QUOTE_TYPE = 0;
    var QUOTED_CHILDREN = 1;
    var kDoubleQuoted = /“[^”]*”/;
    var kSingleQuoted = /‘[^’]*’/;
    var QuoteType;
    (function (QuoteType) {
        QuoteType["SingleQuote"] = "SingleQuote";
        QuoteType["DoubleQuote"] = "DoubleQuote";
    })(QuoteType || (QuoteType = {}));
    var plugin = new prosemirror_state_1.PluginKey('remove_quoted');
    var extension = {
        marks: [
            {
                name: 'quoted',
                spec: {
                    attrs: {
                        type: {},
                    },
                    parseDOM: [
                        {
                            tag: "span[class='quoted']",
                            getAttrs: function (dom) {
                                var el = dom;
                                return {
                                    type: el.getAttribute('data-type'),
                                };
                            },
                        },
                    ],
                    toDOM: function (mark) {
                        return ['span', { class: 'quoted', 'data-type': mark.attrs.type }, 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Quoted',
                            mark: 'quoted',
                            getAttrs: function (tok) {
                                return {
                                    type: tok.c[QUOTE_TYPE].t,
                                };
                            },
                            getChildren: function (tok) {
                                var type = tok.c[QUOTE_TYPE].t;
                                var quotes = quotesForType(type);
                                return __spreadArrays([
                                    {
                                        t: 'Str',
                                        c: quotes.begin,
                                    }
                                ], tok.c[QUOTED_CHILDREN], [
                                    {
                                        t: 'Str',
                                        c: quotes.end,
                                    },
                                ]);
                            },
                        },
                    ],
                    writer: {
                        priority: 3,
                        write: function (output, mark, parent) {
                            output.writeToken('Quoted', function () {
                                output.writeToken(mark.attrs.type);
                                output.writeArray(function () {
                                    var text = parent.cut(1, parent.size - 1);
                                    output.writeInlines(text);
                                });
                            });
                        },
                    },
                },
            },
        ],
        // plugin to add and remove 'quoted' marks as the user edits
        plugins: function (schema) {
            return [
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    appendTransaction: function (transactions, oldState, newState) {
                        // bail if the transactions didn't affect any quotes
                        var quoteRe = /[“”‘’]/;
                        var quoteChange = function (node) { return node.isText && quoteRe.test(node.textContent); };
                        if (!transaction_1.transactionsHaveChange(transactions, oldState, newState, quoteChange)) {
                            return;
                        }
                        var tr = newState.tr;
                        // find quoted marks where the text is no longer quoted (remove the mark)
                        var quotedNodes = prosemirror_utils_1.findChildrenByMark(newState.doc, schema.marks.quoted, true);
                        quotedNodes.forEach(function (quotedNode) {
                            var quotedRange = mark_1.getMarkRange(newState.doc.resolve(quotedNode.pos), schema.marks.quoted);
                            if (quotedRange) {
                                var text = newState.doc.textBetween(quotedRange.from, quotedRange.to);
                                if (!kDoubleQuoted.test(text) && !kSingleQuoted.test(text)) {
                                    tr.removeMark(quotedRange.from, quotedRange.to, schema.marks.quoted);
                                }
                            }
                        });
                        // find quoted text that doesn't have a quoted mark (add the mark)
                        var textNodes = text_1.mergedTextNodes(newState.doc, function (_node, parentNode) {
                            return parentNode.type.allowsMarkType(schema.marks.quoted);
                        });
                        var markQuotes = function (type) {
                            var re = new RegExp(type === QuoteType.DoubleQuote ? kDoubleQuoted : kSingleQuoted, 'g');
                            textNodes.forEach(function (textNode) {
                                re.lastIndex = 0;
                                var match = re.exec(textNode.text);
                                while (match !== null) {
                                    var from = textNode.pos + match.index;
                                    var to = from + match[0].length;
                                    if (!newState.doc.rangeHasMark(from, to, schema.marks.quoted)) {
                                        var mark = schema.mark('quoted', { type: type });
                                        tr.addMark(from, to, mark);
                                    }
                                    match = re.exec(textNode.text);
                                }
                            });
                        };
                        markQuotes(QuoteType.DoubleQuote);
                        markQuotes(QuoteType.SingleQuote);
                        if (tr.docChanged) {
                            return tr;
                        }
                    },
                }),
            ];
        },
    };
    function quotesForType(type) {
        var dblQuote = type === QuoteType.DoubleQuote;
        return {
            begin: dblQuote ? '“' : '‘',
            end: dblQuote ? '”' : '’',
        };
    }
    exports.default = extension;
});
//# sourceMappingURL=quoted.js.map