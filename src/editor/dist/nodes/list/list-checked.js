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
define(["require", "exports", "prosemirror-model", "prosemirror-view", "prosemirror-utils", "prosemirror-inputrules", "editor/api/decoration", "editor/api/command"], function (require, exports, prosemirror_model_1, prosemirror_view_1, prosemirror_utils_1, prosemirror_inputrules_1, decoration_1, command_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var kItemChecked = '☒';
    var kItemUnchecked = '☐';
    // custom NodeView that accomodates display / interaction with item check boxes
    var ListItemNodeView = /** @class */ (function () {
        function ListItemNodeView(node, view, getPos) {
            this.node = node;
            this.view = view;
            this.getPos = getPos;
            // create root li element
            this.dom = window.document.createElement('li');
            if (node.attrs.tight) {
                this.dom.setAttribute('data-tight', 'true');
            }
            var container = window.document.createElement('div');
            container.classList.add('list-item-container');
            this.dom.appendChild(container);
            // add checkbox for checked items
            if (node.attrs.checked !== null) {
                this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false');
                // checkbox for editing checked state
                var input = window.document.createElement('input');
                input.classList.add('list-item-checkbox');
                input.setAttribute('type', 'checkbox');
                input.checked = node.attrs.checked;
                input.contentEditable = 'false';
                input.disabled = !view.editable;
                input.addEventListener('mousedown', function (ev) {
                    ev.preventDefault(); // don't steal focus
                });
                input.addEventListener('change', function (ev) {
                    var tr = view.state.tr;
                    tr.setNodeMarkup(getPos(), node.type, __assign(__assign({}, node.attrs), { checked: ev.target.checked }));
                    view.dispatch(tr);
                });
                container.appendChild(input);
            }
            // content div
            var content = window.document.createElement('div');
            content.classList.add('list-item-content');
            this.contentDOM = content;
            container.appendChild(content);
        }
        return ListItemNodeView;
    }());
    exports.ListItemNodeView = ListItemNodeView;
    // provide css classes for checked list items and the lists that contain them
    function checkedListItemDecorations(schema) {
        return function (state) {
            // decorations
            var decorations = [];
            // find all list items
            var listItems = prosemirror_utils_1.findChildrenByType(state.doc, schema.nodes.list_item);
            listItems.forEach(function (nodeWithPos) {
                if (nodeWithPos.node.attrs.checked !== null) {
                    decorations.push(decoration_1.nodeDecoration(nodeWithPos, { class: 'task-item' }));
                    // mark the parent list w/ css class indicating it's a task list
                    var parentList = prosemirror_utils_1.findParentNodeOfTypeClosestToPos(state.doc.resolve(nodeWithPos.pos), [
                        schema.nodes.bullet_list,
                        schema.nodes.ordered_list,
                    ]);
                    if (parentList) {
                        decorations.push(decoration_1.nodeDecoration(parentList, { class: 'task-list' }));
                    }
                }
            });
            return prosemirror_view_1.DecorationSet.create(state.doc, decorations);
        };
    }
    exports.checkedListItemDecorations = checkedListItemDecorations;
    // command to toggle checked list items
    function checkedListItemCommandFn(itemType) {
        return function (state, dispatch) {
            var itemNode = prosemirror_utils_1.findParentNodeOfType(itemType)(state.selection);
            if (!itemNode) {
                return false;
            }
            if (dispatch) {
                var tr = state.tr;
                if (itemNode.node.attrs.checked !== null) {
                    setItemChecked(tr, itemNode, null);
                }
                else {
                    setItemChecked(tr, itemNode, false);
                }
                dispatch(tr);
            }
            return true;
        };
    }
    exports.checkedListItemCommandFn = checkedListItemCommandFn;
    function checkedListItemToggleCommandFn(itemType) {
        return function (state, dispatch) {
            var itemNode = prosemirror_utils_1.findParentNodeOfType(itemType)(state.selection);
            if (!itemNode || itemNode.node.attrs.checked === null) {
                return false;
            }
            if (dispatch) {
                var tr = state.tr;
                setItemChecked(tr, itemNode, !itemNode.node.attrs.checked);
                dispatch(tr);
            }
            return true;
        };
    }
    exports.checkedListItemToggleCommandFn = checkedListItemToggleCommandFn;
    var CheckedListItemCommand = /** @class */ (function (_super) {
        __extends(CheckedListItemCommand, _super);
        function CheckedListItemCommand(itemType) {
            return _super.call(this, 'list_item_check', null, checkedListItemCommandFn(itemType)) || this;
        }
        CheckedListItemCommand.prototype.isActive = function (state) {
            if (this.isEnabled(state)) {
                var itemNode = prosemirror_utils_1.findParentNodeOfType(state.schema.nodes.list_item)(state.selection);
                return itemNode.node.attrs.checked !== null;
            }
            else {
                return false;
            }
        };
        return CheckedListItemCommand;
    }(command_1.Command));
    exports.CheckedListItemCommand = CheckedListItemCommand;
    var CheckedListItemToggleCommand = /** @class */ (function (_super) {
        __extends(CheckedListItemToggleCommand, _super);
        function CheckedListItemToggleCommand(itemType) {
            return _super.call(this, 'list_item_check_toggle', null, checkedListItemToggleCommandFn(itemType)) || this;
        }
        return CheckedListItemToggleCommand;
    }(command_1.Command));
    exports.CheckedListItemToggleCommand = CheckedListItemToggleCommand;
    // allow users to type [x] or [ ] to define a checked list item
    function checkedListItemInputRule(schema) {
        return new prosemirror_inputrules_1.InputRule(/\[([ x])\]\s$/, function (state, match, start, end) {
            var itemNode = prosemirror_utils_1.findParentNodeOfType(schema.nodes.list_item)(state.selection);
            if (itemNode) {
                // create transaction
                var tr = state.tr;
                // set checked
                setItemChecked(tr, itemNode, match[1]);
                // delete entered text
                tr.delete(start, end);
                // return transaction
                return tr;
            }
            else {
                return null;
            }
        });
    }
    exports.checkedListItemInputRule = checkedListItemInputRule;
    // allow users to begin a new checked list by typing [x] or [ ] at the beginning of a line
    function checkedListInputRule(schema) {
        // regex to match checked list at the beginning of a line
        var regex = /^\s*\[([ x])\]\s$/;
        // we are going to steal the handler from the base bullet list wrapping input rule
        var baseInputRule = prosemirror_inputrules_1.wrappingInputRule(regex, schema.nodes.bullet_list);
        return new prosemirror_inputrules_1.InputRule(regex, function (state, match, start, end) {
            // call the base handler to create the bullet list
            var tr = baseInputRule.handler(state, match, start, end);
            if (tr) {
                // set the checkbox
                var itemNode = prosemirror_utils_1.findParentNodeOfType(schema.nodes.list_item)(tr.selection);
                if (itemNode) {
                    setItemChecked(tr, itemNode, match[1]);
                }
                return tr;
            }
            else {
                return null;
            }
        });
    }
    exports.checkedListInputRule = checkedListInputRule;
    function setItemChecked(tr, itemNode, check) {
        tr.setNodeMarkup(itemNode.pos, itemNode.node.type, __assign(__assign({}, itemNode.node.attrs), { checked: check === null ? null : typeof check === 'string' ? check === 'x' : check }));
    }
    // prepend a check mark to the provided fragment
    function fragmentWithCheck(schema, fragment, checked) {
        var checkedText = schema.text((checked ? kItemChecked : kItemUnchecked) + ' ');
        return prosemirror_model_1.Fragment.from(checkedText).append(fragment);
    }
    exports.fragmentWithCheck = fragmentWithCheck;
});
//# sourceMappingURL=list-checked.js.map