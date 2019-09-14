var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports", "prosemirror-inputrules", "prosemirror-state"], function (require, exports, prosemirror_inputrules_1, prosemirror_state_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var plugin = new prosemirror_state_1.PluginKey('smartypaste');
    var extension = {
        inputRules: function () {
            return __spreadArrays(prosemirror_inputrules_1.smartQuotes, [prosemirror_inputrules_1.ellipsis, prosemirror_inputrules_1.emDash]);
        },
        plugins: function (schema) {
            return [
                // apply smarty rules to plain text pastes
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    props: {
                        transformPastedText: function (text) {
                            // double quotes
                            text = text.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")/g, function (x) {
                                return x.slice(0, x.length - 1) + '“';
                            });
                            text = text.replace(/"/g, '”');
                            // single quotes
                            text = text.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')/g, function (x) {
                                return x.slice(0, x.length - 1) + '‘';
                            });
                            text = text.replace(/'/g, '’');
                            // emdash
                            text = text.replace(/--/, '—');
                            // ellipses
                            text = text.replace(/\.\.\./, '…');
                            return text;
                        },
                    },
                }),
            ];
        },
    };
    exports.default = extension;
});
//# sourceMappingURL=smarty.js.map