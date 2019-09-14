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
define(["require", "exports", "prosemirror-utils", "editor/api/command"], function (require, exports, prosemirror_utils_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ListCommand = /** @class */ (function (_super) {
        __extends(ListCommand, _super);
        function ListCommand(name, keymap, listType, listItemType) {
            return _super.call(this, name, keymap, listType, {}, command_1.toggleList(listType, listItemType)) || this;
        }
        return ListCommand;
    }(command_1.NodeCommand));
    exports.ListCommand = ListCommand;
    var TightListCommand = /** @class */ (function (_super) {
        __extends(TightListCommand, _super);
        function TightListCommand(schema) {
            return _super.call(this, 'tight_list', ['Shift-Ctrl-7'], function (state, dispatch, view) {
                var parentList = prosemirror_utils_1.findParentNodeOfType([schema.nodes.bullet_list, schema.nodes.ordered_list])(state.selection);
                if (!parentList) {
                    return false;
                }
                if (dispatch) {
                    var tr = state.tr;
                    var node = parentList.node;
                    tr.setNodeMarkup(parentList.pos, node.type, __assign(__assign({}, node.attrs), { tight: !node.attrs.tight }));
                    dispatch(tr);
                }
                return true;
            }) || this;
        }
        TightListCommand.prototype.isActive = function (state) {
            if (this.isEnabled(state)) {
                var itemNode = prosemirror_utils_1.findParentNodeOfType(state.schema.nodes.list_item)(state.selection);
                return itemNode.node.attrs.tight;
            }
            else {
                return false;
            }
        };
        return TightListCommand;
    }(command_1.Command));
    exports.TightListCommand = TightListCommand;
    var OrderedListEditCommand = /** @class */ (function (_super) {
        __extends(OrderedListEditCommand, _super);
        function OrderedListEditCommand(schema, ui) {
            return _super.call(this, 'ordered_list_edit', null, function (state, dispatch, view) {
                // see if a parent node is an ordered list
                var node = null;
                var pos = 0;
                var nodeWithPos = prosemirror_utils_1.findParentNodeOfType(schema.nodes.ordered_list)(state.selection);
                if (nodeWithPos) {
                    node = nodeWithPos.node;
                    pos = nodeWithPos.pos;
                }
                // return false (disabled) for no targets
                if (!node) {
                    return false;
                }
                // execute command when requested
                if (dispatch) {
                    editOrderedList(node, pos, state, dispatch, ui).then(function () {
                        if (view) {
                            view.focus();
                        }
                    });
                }
                return true;
            }) || this;
        }
        return OrderedListEditCommand;
    }(command_1.Command));
    exports.OrderedListEditCommand = OrderedListEditCommand;
    function editOrderedList(node, pos, state, dispatch, ui) {
        var attrs = node.attrs;
        return ui.editOrderedList(__assign({}, attrs)).then(function (result) {
            if (result) {
                var tr = state.tr;
                tr.setNodeMarkup(pos, node.type, __assign(__assign({}, attrs), result));
                dispatch(tr);
            }
        });
    }
});
//# sourceMappingURL=list-commands.js.map