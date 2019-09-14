define(["require", "exports", "editor/api/command", "editor/api/pandoc_attr", "editor/api/mark"], function (require, exports, command_1, pandoc_attr_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CODE_ATTR = 0;
    var CODE_TEXT = 1;
    var extension = {
        marks: [
            {
                name: 'code',
                spec: {
                    attrs: pandoc_attr_1.pandocAttrSpec,
                    parseDOM: [
                        {
                            tag: 'code',
                            getAttrs: function (dom) {
                                return pandoc_attr_1.pandocAttrParseDom(dom, {});
                            },
                        },
                    ],
                    toDOM: function (mark) {
                        return ['code', pandoc_attr_1.pandocAttrToDomAttr(mark.attrs)];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Code',
                            mark: 'code',
                            getText: function (tok) { return tok.c[CODE_TEXT]; },
                            getAttrs: function (tok) {
                                return pandoc_attr_1.pandocAttrReadAST(tok, CODE_ATTR);
                            },
                        },
                    ],
                    writer: {
                        priority: 20,
                        write: function (output, mark, parent) {
                            output.writeToken('Code', function () {
                                output.writeAttr(mark.attrs.id, mark.attrs.classes, mark.attrs.keyvalue);
                                var code = '';
                                parent.forEach(function (node) { return (code = code + node.textContent); });
                                output.write(code);
                            });
                        },
                    },
                },
            },
        ],
        commands: function (schema) {
            return [new command_1.MarkCommand('code', ['Mod-d'], schema.marks.code)];
        },
        inputRules: function (schema) {
            return [mark_1.delimiterMarkInputRule('`', schema.marks.code)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=code.js.map