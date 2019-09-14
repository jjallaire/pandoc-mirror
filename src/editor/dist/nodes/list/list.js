define(["require", "exports", "prosemirror-inputrules", "prosemirror-schema-list", "prosemirror-state", "./list-commands", "./list-checked", "./list-example", "./list-pandoc", "editor/api/command"], function (require, exports, prosemirror_inputrules_1, prosemirror_schema_list_1, prosemirror_state_1, list_commands_1, list_checked_1, list_example_1, list_pandoc_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ListNumberStyle;
    (function (ListNumberStyle) {
        ListNumberStyle["DefaultStyle"] = "DefaultStyle";
        ListNumberStyle["Decimal"] = "Decimal";
        ListNumberStyle["LowerRoman"] = "LowerRoman";
        ListNumberStyle["UpperRoman"] = "UpperRoman";
        ListNumberStyle["LowerAlpha"] = "LowerAlpha";
        ListNumberStyle["UpperAlpha"] = "UpperAlpha";
        ListNumberStyle["Example"] = "Example";
    })(ListNumberStyle = exports.ListNumberStyle || (exports.ListNumberStyle = {}));
    // NOTE: HTML output doesn't currently respect this and it's difficult to
    // do with CSS (especially for nested lists). So we allow the user to edit
    // it but it isn't reflected in the editor.
    var ListNumberDelim;
    (function (ListNumberDelim) {
        ListNumberDelim["DefaultDelim"] = "DefaultDelim";
        ListNumberDelim["Period"] = "Period";
        ListNumberDelim["OneParen"] = "OneParen";
        ListNumberDelim["TwoParens"] = "TwoParens";
    })(ListNumberDelim = exports.ListNumberDelim || (exports.ListNumberDelim = {}));
    var plugin = new prosemirror_state_1.PluginKey('list');
    var extension = {
        nodes: [
            {
                name: 'list_item',
                spec: {
                    content: 'paragraph block*',
                    attrs: {
                        checked: { default: null },
                    },
                    defining: true,
                    parseDOM: [
                        {
                            tag: 'li',
                            getAttrs: function (dom) {
                                var el = dom;
                                var attrs = {};
                                if (el.hasAttribute('data-checked')) {
                                    attrs.checked = el.getAttribute('data-checked') === 'true';
                                }
                                return attrs;
                            },
                        },
                    ],
                    toDOM: function (node) {
                        var attrs = {};
                        if (node.attrs.checked !== null) {
                            attrs['data-checked'] = node.attrs.checked ? 'true' : 'false';
                        }
                        return ['li', attrs, 0];
                    },
                },
                pandoc: {
                    writer: list_pandoc_1.pandocWriteListItem,
                },
            },
            {
                name: 'bullet_list',
                spec: {
                    content: 'list_item+',
                    group: 'block',
                    attrs: {
                        tight: { default: true },
                    },
                    parseDOM: [
                        {
                            tag: 'ul',
                            getAttrs: function (dom) {
                                var el = dom;
                                var attrs = {};
                                if (el.hasAttribute('data-tight')) {
                                    attrs.tight = true;
                                }
                                return attrs;
                            }
                        }
                    ],
                    toDOM: function (node) {
                        var attrs = {};
                        if (node.attrs.tight) {
                            attrs['data-tight'] = 'true';
                        }
                        return ['ul', attrs, 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'BulletList',
                            list: 'bullet_list',
                        },
                    ],
                    writer: list_pandoc_1.pandocWriteBulletList,
                },
            },
            {
                name: 'ordered_list',
                spec: {
                    content: 'list_item+',
                    group: 'block',
                    attrs: {
                        tight: { default: true },
                        order: { default: 1 },
                        number_style: { default: ListNumberStyle.Decimal },
                        number_delim: { default: ListNumberDelim.Period },
                    },
                    parseDOM: [
                        {
                            tag: 'ol',
                            getAttrs: function (dom) {
                                var el = dom;
                                var tight = el.hasAttribute('data-tight');
                                var order = el.getAttribute('start');
                                if (!order) {
                                    order = 1;
                                }
                                var numberStyle = el.getAttribute('data-example')
                                    ? ListNumberStyle.Example
                                    : typeToNumberStyle(el.getAttribute('type'));
                                return { tight: tight, order: order, numberStyle: numberStyle };
                            },
                        },
                    ],
                    toDOM: function (node) {
                        var attrs = {};
                        if (node.attrs.tight) {
                            attrs['data-tight'] = 'true';
                        }
                        if (node.attrs.order !== 1) {
                            attrs.start = node.attrs.order;
                        }
                        var type = numberStyleToType(node.attrs.number_style);
                        if (type) {
                            attrs.type = type;
                        }
                        if (attrs.number_style === ListNumberStyle.Example) {
                            attrs['data-example'] = '1';
                        }
                        return ['ol', attrs, 0];
                    },
                },
                pandoc: {
                    readers: [list_pandoc_1.pandocOrderedListReader],
                    writer: list_pandoc_1.pandocWriteOrderedList,
                },
            },
        ],
        plugins: function (schema) {
            return [
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    props: {
                        decorations: list_checked_1.checkedListItemDecorations(schema),
                        nodeViews: {
                            list_item: function (node, view, getPos) {
                                return new list_checked_1.ListItemNodeView(node, view, getPos);
                            },
                        },
                    },
                    appendTransaction: list_example_1.exampleListsAppendTransaction(schema),
                }),
            ];
        },
        commands: function (schema, ui) {
            return [
                new list_commands_1.ListCommand('bullet_list', ['Shift-Ctrl-8'], schema.nodes.bullet_list, schema.nodes.list_item),
                new list_commands_1.ListCommand('ordered_list', ['Shift-Ctrl-9'], schema.nodes.ordered_list, schema.nodes.list_item),
                new command_1.Command('list_item_sink', ['Tab', 'Mod-]'], prosemirror_schema_list_1.sinkListItem(schema.nodes.list_item)),
                new command_1.Command('list_item_lift', ['Shift-Tab', 'Mod-['], prosemirror_schema_list_1.liftListItem(schema.nodes.list_item)),
                new command_1.Command('list_item_split', ['Enter'], prosemirror_schema_list_1.splitListItem(schema.nodes.list_item)),
                new list_commands_1.OrderedListEditCommand(schema, ui),
                new list_commands_1.TightListCommand(schema),
                new list_checked_1.CheckedListItemCommand(schema.nodes.list_item),
                new list_checked_1.CheckedListItemToggleCommand(schema.nodes.list_item),
            ];
        },
        inputRules: function (schema) {
            return [
                prosemirror_inputrules_1.wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),
                prosemirror_inputrules_1.wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list, function (match) { return ({ order: +match[1] }); }, function (match, node) { return node.childCount + node.attrs.order === +match[1]; }),
                list_checked_1.checkedListInputRule(schema),
                list_checked_1.checkedListItemInputRule(schema),
            ];
        },
    };
    function numberStyleToType(style) {
        switch (style) {
            case ListNumberStyle.DefaultStyle:
            case ListNumberStyle.Decimal:
            case ListNumberStyle.Example:
                return 'l';
            case ListNumberStyle.LowerAlpha:
                return 'a';
            case ListNumberStyle.UpperAlpha:
                return 'A';
            case ListNumberStyle.LowerRoman:
                return 'i';
            case ListNumberStyle.UpperRoman:
                return 'I';
            default:
                return null;
        }
    }
    function typeToNumberStyle(type) {
        switch (type) {
            case 'l':
                return ListNumberStyle.Decimal;
            case 'a':
                return ListNumberStyle.LowerAlpha;
            case 'A':
                return ListNumberStyle.UpperAlpha;
            case 'i':
                return ListNumberStyle.LowerRoman;
            case 'I':
                return ListNumberStyle.UpperRoman;
            default:
                return ListNumberStyle.Decimal;
        }
    }
    exports.default = extension;
});
//# sourceMappingURL=list.js.map