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
define(["require", "exports", "prosemirror-commands", "prosemirror-schema-list", "prosemirror-utils", "./mark", "./node", "./pandoc_attr"], function (require, exports, prosemirror_commands_1, prosemirror_schema_list_1, prosemirror_utils_1, mark_1, node_1, pandoc_attr_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Command = /** @class */ (function () {
        function Command(name, keymap, execute) {
            this.name = name;
            this.keymap = keymap;
            this.execute = execute;
        }
        Command.prototype.isEnabled = function (state) {
            return this.execute(state);
        };
        Command.prototype.isActive = function (state) {
            return false;
        };
        return Command;
    }());
    exports.Command = Command;
    var MarkCommand = /** @class */ (function (_super) {
        __extends(MarkCommand, _super);
        function MarkCommand(name, keymap, markType, attrs) {
            if (attrs === void 0) { attrs = {}; }
            var _this = _super.call(this, name, keymap, prosemirror_commands_1.toggleMark(markType, attrs)) || this;
            _this.markType = markType;
            _this.attrs = attrs;
            return _this;
        }
        MarkCommand.prototype.isActive = function (state) {
            return mark_1.markIsActive(state, this.markType);
        };
        return MarkCommand;
    }(Command));
    exports.MarkCommand = MarkCommand;
    var NodeCommand = /** @class */ (function (_super) {
        __extends(NodeCommand, _super);
        function NodeCommand(name, keymap, nodeType, attrs, execute) {
            var _this = _super.call(this, name, keymap, execute) || this;
            _this.nodeType = nodeType;
            _this.attrs = attrs;
            return _this;
        }
        NodeCommand.prototype.isActive = function (state) {
            return node_1.nodeIsActive(state, this.nodeType, this.attrs);
        };
        return NodeCommand;
    }(Command));
    exports.NodeCommand = NodeCommand;
    var ListCommand = /** @class */ (function (_super) {
        __extends(ListCommand, _super);
        function ListCommand(name, keymap, listType, listItemType) {
            return _super.call(this, name, keymap, listType, {}, toggleList(listType, listItemType)) || this;
        }
        return ListCommand;
    }(NodeCommand));
    exports.ListCommand = ListCommand;
    var BlockCommand = /** @class */ (function (_super) {
        __extends(BlockCommand, _super);
        function BlockCommand(name, keymap, blockType, toggleType, attrs) {
            if (attrs === void 0) { attrs = {}; }
            return _super.call(this, name, keymap, blockType, attrs, toggleBlockType(blockType, toggleType, attrs)) || this;
        }
        return BlockCommand;
    }(NodeCommand));
    exports.BlockCommand = BlockCommand;
    var WrapCommand = /** @class */ (function (_super) {
        __extends(WrapCommand, _super);
        function WrapCommand(name, keymap, wrapType) {
            return _super.call(this, name, keymap, wrapType, {}, toggleWrap(wrapType)) || this;
        }
        return WrapCommand;
    }(NodeCommand));
    exports.WrapCommand = WrapCommand;
    function toggleList(listType, itemType) {
        function isList(node, schema) {
            return (node.type === schema.nodes.bullet_list ||
                node.type === schema.nodes.ordered_list);
        }
        return function (state, dispatch, view) {
            var schema = state.schema, selection = state.selection;
            var $from = selection.$from, $to = selection.$to;
            var range = $from.blockRange($to);
            if (!range) {
                return false;
            }
            var parentList = prosemirror_utils_1.findParentNode(function (node) { return isList(node, schema); })(selection);
            if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
                if (parentList.node.type === listType) {
                    return prosemirror_schema_list_1.liftListItem(itemType)(state, dispatch);
                }
                if (isList(parentList.node, schema) && listType.validContent(parentList.node.content)) {
                    var tr = state.tr;
                    tr.setNodeMarkup(parentList.pos, listType);
                    if (dispatch) {
                        dispatch(tr);
                    }
                    return false;
                }
            }
            return prosemirror_schema_list_1.wrapInList(listType)(state, dispatch);
        };
    }
    exports.toggleList = toggleList;
    function toggleBlockType(type, toggletype, attrs) {
        if (attrs === void 0) { attrs = {}; }
        return function (state, dispatch) {
            var isActive = node_1.nodeIsActive(state, type, attrs);
            if (isActive) {
                return prosemirror_commands_1.setBlockType(toggletype)(state, dispatch);
            }
            // if the type has pandoc attrs then see if we can transfer from the existing node
            var pandocAttr = {};
            if (pandoc_attr_1.pandocAttrInSpec(type.spec)) {
                var predicate = function (n) { return pandoc_attr_1.pandocAttrAvailable(n.attrs); };
                var node = prosemirror_utils_1.findParentNode(predicate)(state.selection);
                if (node) {
                    pandocAttr = pandoc_attr_1.pandocAttrFrom(node.node.attrs);
                }
            }
            return prosemirror_commands_1.setBlockType(type, __assign(__assign({}, attrs), pandocAttr))(state, dispatch);
        };
    }
    exports.toggleBlockType = toggleBlockType;
    function toggleWrap(type) {
        return function (state, dispatch, view) {
            var isActive = node_1.nodeIsActive(state, type);
            if (isActive) {
                return prosemirror_commands_1.lift(state, dispatch);
            }
            return prosemirror_commands_1.wrapIn(type)(state, dispatch);
        };
    }
    exports.toggleWrap = toggleWrap;
    function insertNode(nodeType, attrs) {
        if (attrs === void 0) { attrs = {}; }
        return function (state, dispatch) {
            if (!node_1.canInsertNode(state, nodeType)) {
                return false;
            }
            if (dispatch) {
                dispatch(state.tr.replaceSelectionWith(nodeType.create(attrs)));
            }
            return true;
        };
    }
    exports.insertNode = insertNode;
});
//# sourceMappingURL=command.js.map