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
define(["require", "exports", "editor/api/command", "editor/api/mark", "editor/api/pandoc_attr"], function (require, exports, command_1, mark_1, pandoc_attr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TARGET_URL = 0;
    var TARGET_TITLE = 1;
    var LINK_ATTR = 0;
    var LINK_CHILDREN = 1;
    var LINK_TARGET = 2;
    var extension = {
        marks: [
            {
                name: 'link',
                spec: {
                    attrs: __assign({ href: {}, title: { default: null } }, pandoc_attr_1.pandocAttrSpec),
                    inclusive: false,
                    parseDOM: [
                        {
                            tag: 'a[href]',
                            getAttrs: function (dom) {
                                var el = dom;
                                var attrs = {
                                    href: el.getAttribute('href'),
                                    title: el.getAttribute('title'),
                                };
                                return __assign(__assign({}, attrs), pandoc_attr_1.pandocAttrParseDom(el, attrs));
                            },
                        },
                    ],
                    toDOM: function (mark) {
                        return [
                            'a',
                            __assign({ href: mark.attrs.href, title: mark.attrs.title }, pandoc_attr_1.pandocAttrToDomAttr(mark.attrs)),
                        ];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Link',
                            mark: 'link',
                            getAttrs: function (tok) {
                                var target = tok.c[LINK_TARGET];
                                return __assign({ href: target[TARGET_URL], title: target[TARGET_TITLE] || null }, pandoc_attr_1.pandocAttrReadAST(tok, LINK_ATTR));
                            },
                            getChildren: function (tok) { return tok.c[LINK_CHILDREN]; },
                        },
                    ],
                    writer: {
                        priority: 15,
                        write: function (output, mark, parent) {
                            output.writeToken('Link', function () {
                                output.writeAttr(mark.attrs.id, mark.attrs.classes, mark.attrs.keyvalue);
                                output.writeArray(function () {
                                    output.writeInlines(parent);
                                });
                                output.write([mark.attrs.href || '', mark.attrs.title || '']);
                            });
                        },
                    },
                },
            },
        ],
        commands: function (schema, ui) {
            return [new command_1.Command('link', ['Shift-Mod-k'], linkCommand(schema.marks.link, ui.editLink))];
        },
        inputRules: function (schema) {
            return [
                mark_1.markInputRule(/(?:<)([a-z]+:\/\/[^>]+)(?:>)$/, schema.marks.link, function (match) { return ({ href: match[1] }); }),
                mark_1.markInputRule(/(?:\[)([^\]]+)(?:\]\()([^\)]+)(?:\))$/, schema.marks.link, function (match) { return ({
                    href: match[2],
                }); }),
            ];
        },
    };
    function linkCommand(markType, onEditLink) {
        return function (state, dispatch, view) {
            // if there is no contiguous selection and no existing link mark active
            // then the command should be disabled (unknown what the link target is)
            if (!mark_1.markIsActive(state, markType) && state.selection.empty) {
                return false;
            }
            // if the current node doesn't allow this mark return false
            if (!state.selection.$from.node().type.allowsMarkType(markType)) {
                return false;
            }
            if (dispatch) {
                // get link attributes if we have them
                var link = {};
                if (mark_1.markIsActive(state, markType)) {
                    link = mark_1.getMarkAttrs(state, markType);
                }
                // show edit ui
                onEditLink(__assign({}, link)).then(function (result) {
                    if (result) {
                        // determine the range we will edit
                        var range = mark_1.getSelectionMarkRange(state.selection, markType);
                        var tr = state.tr;
                        tr.removeMark(range.from, range.to, markType);
                        if (result.action === 'edit') {
                            tr.addMark(range.from, range.to, markType.create(result.link));
                        }
                        dispatch(tr);
                    }
                    if (view) {
                        view.focus();
                    }
                });
            }
            return true;
        };
    }
    exports.default = extension;
});
//# sourceMappingURL=link.js.map