var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports", "prosemirror-inputrules"], function (require, exports, prosemirror_inputrules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function markIsActive(state, type) {
        var _a = state.selection, from = _a.from, $from = _a.$from, to = _a.to, empty = _a.empty;
        if (empty) {
            return !!type.isInSet(state.storedMarks || $from.marks());
        }
        return !!state.doc.rangeHasMark(from, to, type);
    }
    exports.markIsActive = markIsActive;
    function getMarkAttrs(state, type) {
        var _a = state.selection, from = _a.from, to = _a.to;
        var marks = [];
        state.doc.nodesBetween(from, to, function (node) {
            marks = __spreadArrays(marks, node.marks);
        });
        var mark = marks.find(function (markItem) { return markItem.type.name === type.name; });
        if (mark) {
            return mark.attrs;
        }
        return {};
    }
    exports.getMarkAttrs = getMarkAttrs;
    function getMarkRange($pos, type) {
        if (!$pos || !type) {
            return false;
        }
        var start = $pos.parent.childAfter($pos.parentOffset);
        if (!start.node) {
            return false;
        }
        var link = start.node.marks.find(function (mark) { return mark.type === type; });
        if (!link) {
            return false;
        }
        var startIndex = $pos.index();
        var startPos = $pos.start() + start.offset;
        var endIndex = startIndex + 1;
        var endPos = startPos + start.node.nodeSize;
        while (startIndex > 0 && link.isInSet($pos.parent.child(startIndex - 1).marks)) {
            startIndex -= 1;
            startPos -= $pos.parent.child(startIndex).nodeSize;
        }
        while (endIndex < $pos.parent.childCount && link.isInSet($pos.parent.child(endIndex).marks)) {
            endPos += $pos.parent.child(endIndex).nodeSize;
            endIndex += 1;
        }
        return { from: startPos, to: endPos };
    }
    exports.getMarkRange = getMarkRange;
    function getSelectionMarkRange(selection, markType) {
        var range;
        if (selection.empty) {
            range = getMarkRange(selection.$head, markType);
        }
        else {
            range = { from: selection.from, to: selection.to };
        }
        return range;
    }
    exports.getSelectionMarkRange = getSelectionMarkRange;
    function markInputRule(regexp, markType, getAttrs) {
        return new prosemirror_inputrules_1.InputRule(regexp, function (state, match, start, end) {
            var attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
            var tr = state.tr;
            if (match[1]) {
                var textStart = start + match[0].indexOf(match[1]);
                var textEnd = textStart + match[1].length;
                if (textEnd < end) {
                    tr.delete(textEnd, end);
                }
                if (textStart > start) {
                    tr.delete(start, textStart);
                }
                end = start + match[1].length;
            }
            tr.addMark(start, end, markType.create(attrs));
            tr.removeStoredMark(markType); // Do not continue with mark.
            return tr;
        });
    }
    exports.markInputRule = markInputRule;
    function delimiterMarkInputRule(delim, markType, prefixMask) {
        // if there is no prefix mask then this is simple regex we can pass to markInputRule
        if (!prefixMask) {
            var regexp = "(?:" + delim + ")([^" + delim + "]+)(?:" + delim + ")$";
            return markInputRule(new RegExp(regexp), markType);
            // otherwise we need custom logic to get mark placement/eliding right
        }
        else {
            // validate that delim and mask are single characters (our logic for computing offsets
            // below depends on this assumption)
            var validateParam = function (name, value) {
                // validate mask
                function throwError() {
                    throw new Error(name + " must be a single characater");
                }
                if (value.startsWith('\\')) {
                    if (value.length !== 2) {
                        throwError();
                    }
                }
                else if (value.length !== 1) {
                    throwError();
                }
            };
            validateParam('delim', delim);
            validateParam('mask', prefixMask);
            // build regex (this regex assumes that mask is one character)
            var regexp = "(?:^|[^" + prefixMask + "])(?:" + delim + ")([^" + delim + "]+)(?:" + delim + ")$";
            // return rule
            return new prosemirror_inputrules_1.InputRule(new RegExp(regexp), function (state, match, start, end) {
                // init transaction
                var tr = state.tr;
                // compute offset for mask (should be zero if this was the beginning of a line,
                // in all other cases it would be 1). note we depend on the delimiter being
                // of size 1 here (this is enforced above)
                var kDelimSize = 1;
                var maskOffset = match[0].length - match[1].length - kDelimSize * 2;
                // position of text to be formatted
                var textStart = start + match[0].indexOf(match[1]);
                var textEnd = textStart + match[1].length;
                // remove trailing markdown
                tr.delete(textEnd, end);
                // update start/end to reflect the leading mask which we want to leave alone
                start = start + maskOffset;
                end = start + match[1].length;
                // remove leading markdown
                tr.delete(start, textStart);
                // add mark
                tr.addMark(start, end, markType.create());
                // remove stored mark so typing continues w/o the mark
                tr.removeStoredMark(markType);
                // return transaction
                return tr;
            });
        }
    }
    exports.delimiterMarkInputRule = delimiterMarkInputRule;
});
//# sourceMappingURL=mark.js.map