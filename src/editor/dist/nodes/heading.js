var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
define(["require", "exports", "prosemirror-inputrules", "prosemirror-utils", "editor/api/command", "editor/api/pandoc_attr"], function (require, exports, prosemirror_inputrules_1, prosemirror_utils_1, command_1, pandoc_attr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HEADING_LEVEL = 0;
    var HEADING_ATTR = 1;
    var HEADING_CHILDREN = 2;
    var kHeadingLevels = [1, 2, 3, 4, 5, 6];
    var extension = {
        nodes: [
            {
                name: 'heading',
                spec: {
                    attrs: __assign({ level: { default: 1 } }, pandoc_attr_1.pandocAttrSpec),
                    content: 'inline*',
                    group: 'block',
                    defining: true,
                    parseDOM: [
                        { tag: 'h1', getAttrs: getHeadingAttrs(1) },
                        { tag: 'h2', getAttrs: getHeadingAttrs(2) },
                        { tag: 'h3', getAttrs: getHeadingAttrs(3) },
                        { tag: 'h4', getAttrs: getHeadingAttrs(4) },
                        { tag: 'h5', getAttrs: getHeadingAttrs(5) },
                        { tag: 'h6', getAttrs: getHeadingAttrs(6) },
                    ],
                    toDOM: function (node) {
                        return ['h' + node.attrs.level, pandoc_attr_1.pandocAttrToDomAttr(node.attrs), 0];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Header',
                            block: 'heading',
                            getAttrs: function (tok) { return (__assign({ level: tok.c[HEADING_LEVEL] }, pandoc_attr_1.pandocAttrReadAST(tok, HEADING_ATTR))); },
                            getChildren: function (tok) { return tok.c[HEADING_CHILDREN]; },
                        },
                    ],
                    writer: function (output, node) {
                        output.writeToken('Header', function () {
                            output.write(node.attrs.level);
                            output.writeAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
                            output.writeArray(function () {
                                output.writeInlines(node.content);
                            });
                        });
                    },
                },
            },
        ],
        commands: function (schema) {
            return kHeadingLevels.map(function (level) { return new HeadingCommand(schema, level); });
        },
        inputRules: function (schema) {
            return [
                prosemirror_inputrules_1.textblockTypeInputRule(new RegExp('^(#{1,' + kHeadingLevels.length + '})\\s$'), schema.nodes.heading, function (match) { return ({
                    level: match[1].length,
                }); }),
            ];
        },
    };
    var HeadingCommand = /** @class */ (function (_super) {
        __extends(HeadingCommand, _super);
        function HeadingCommand(schema, level) {
            var _this = _super.call(this, 'heading' + level, ['Shift-Ctrl-' + level], schema.nodes.heading, schema.nodes.paragraph, { level: level }) || this;
            _this.nodeType = schema.nodes.heading;
            _this.level = level;
            return _this;
        }
        HeadingCommand.prototype.isActive = function (state) {
            var _this = this;
            var predicate = function (n) { return n.type === _this.nodeType && n.attrs.level === _this.level; };
            var node = prosemirror_utils_1.findParentNode(predicate)(state.selection);
            return !!node;
        };
        return HeadingCommand;
    }(command_1.BlockCommand));
    // function for getting attrs
    function getHeadingAttrs(level) {
        return function (dom) {
            var el = dom;
            return __assign({ level: level }, pandoc_attr_1.pandocAttrParseDom(el, {}));
        };
    }
    exports.default = extension;
});
//# sourceMappingURL=heading.js.map