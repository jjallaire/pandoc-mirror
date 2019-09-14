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
define(["require", "exports", "prosemirror-inputrules", "editor/api/command", "editor/api/pandoc_attr"], function (require, exports, prosemirror_inputrules_1, command_1, pandoc_attr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CODE_BLOCK_ATTR = 0;
    var CODE_BLOCK_TEXT = 1;
    var extension = {
        nodes: [
            {
                name: 'code_block',
                spec: {
                    content: 'text*',
                    group: 'block',
                    marks: '',
                    code: true,
                    defining: true,
                    isolating: true,
                    attrs: __assign({}, pandoc_attr_1.pandocAttrSpec),
                    parseDOM: [
                        {
                            tag: 'pre',
                            preserveWhitespace: true,
                            getAttrs: function (node) {
                                var el = node;
                                return pandoc_attr_1.pandocAttrParseDom(el, {});
                            },
                        },
                    ],
                    toDOM: function (node) {
                        return ['pre', pandoc_attr_1.pandocAttrToDomAttr(node.attrs), ['code', 0]];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'CodeBlock',
                            block: 'code_block',
                            getAttrs: function (tok) { return (__assign({}, pandoc_attr_1.pandocAttrReadAST(tok, CODE_BLOCK_ATTR))); },
                            getText: function (tok) { return tok.c[CODE_BLOCK_TEXT]; },
                        },
                    ],
                    writer: function (output, node) {
                        output.writeToken('CodeBlock', function () {
                            output.writeAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
                            output.write(node.textContent);
                        });
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.BlockCommand('code_block', ['Shift-Ctrl-\\'], schema.nodes.code_block, schema.nodes.paragraph, {})];
        },
        inputRules: function (schema) {
            return [prosemirror_inputrules_1.textblockTypeInputRule(/^```/, schema.nodes.code_block)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=code_block.js.map