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
define(["require", "exports", "prosemirror-state", "prosemirror-utils", "editor/api/command", "editor/api/pandoc_attr", "editor/api/mark"], function (require, exports, prosemirror_state_1, prosemirror_utils_1, command_1, pandoc_attr_1, mark_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AttrEditCommand = /** @class */ (function (_super) {
        __extends(AttrEditCommand, _super);
        function AttrEditCommand(ui) {
            return _super.call(this, 'attr_edit', null, function (state, dispatch, view) {
                // see if there is an active mark with attrs or a parent node with attrs
                var marks = state.storedMarks || state.selection.$head.marks();
                var mark = marks.find(function (m) { return pandoc_attr_1.pandocAttrInSpec(m.type.spec); });
                var node = null;
                var pos = 0;
                if (state.selection instanceof prosemirror_state_1.NodeSelection && pandoc_attr_1.pandocAttrInSpec(state.selection.node.type.spec)) {
                    node = state.selection.node;
                    pos = state.selection.$anchor.pos;
                }
                else {
                    var nodeWithPos = prosemirror_utils_1.findParentNode(function (n) { return pandoc_attr_1.pandocAttrInSpec(n.type.spec); })(state.selection);
                    if (nodeWithPos) {
                        node = nodeWithPos.node;
                        pos = nodeWithPos.pos;
                    }
                }
                // return false (disabled) for no targets
                if (!mark && !node) {
                    return false;
                }
                // execute command when requested
                if (dispatch) {
                    var editPromise = mark
                        ? editMarkAttrs(mark, state, dispatch, ui)
                        : editNodeAttrs(node, pos, state, dispatch, ui);
                    editPromise.then(function () {
                        if (view) {
                            view.focus();
                        }
                    });
                }
                return true;
            }) || this;
        }
        return AttrEditCommand;
    }(command_1.Command));
    function editMarkAttrs(mark, state, dispatch, ui) {
        var attrs = mark.attrs;
        var markType = mark.type;
        return ui.editAttr(__assign({}, attrs)).then(function (result) {
            if (result) {
                var tr = state.tr;
                var range = mark_1.getSelectionMarkRange(state.selection, markType);
                tr.removeMark(range.from, range.to, markType);
                tr.addMark(range.from, range.to, markType.create(__assign(__assign({}, attrs), result)));
                dispatch(tr);
            }
        });
    }
    function editNodeAttrs(node, pos, state, dispatch, ui) {
        var attrs = node.attrs;
        return ui.editAttr(__assign({}, attrs)).then(function (result) {
            if (result) {
                dispatch(state.tr.setNodeMarkup(pos, node.type, __assign(__assign({}, attrs), result)));
            }
        });
    }
    var extension = {
        commands: function (_schema, ui) {
            return [new AttrEditCommand(ui)];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=attr_edit.js.map