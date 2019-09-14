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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "./behaviors/basekeys", "./behaviors/select_all", "./behaviors/cursor", "./behaviors/history", "./behaviors/smarty", "./behaviors/attr_edit", "./behaviors/trailing_p", "./marks/code", "./marks/em", "./marks/link", "./marks/strong", "./marks/strikeout", "./marks/superscript", "./marks/subscript", "./marks/smallcaps", "./marks/quoted", "./nodes/blockquote", "./nodes/footnote/footnote", "./nodes/code_block", "./nodes/hard_break", "./nodes/soft_break", "./nodes/heading", "./nodes/horizontal_rule", "./nodes/image/image", "./nodes/list/list", "./nodes/paragraph", "./nodes/text", "./optional/codemirror/codemirror"], function (require, exports, basekeys_1, select_all_1, cursor_1, history_1, smarty_1, attr_edit_1, trailing_p_1, code_1, em_1, link_1, strong_1, strikeout_1, superscript_1, subscript_1, smallcaps_1, quoted_1, blockquote_1, footnote_1, code_block_1, hard_break_1, soft_break_1, heading_1, horizontal_rule_1, image_1, list_1, paragraph_1, text_1, codemirror_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    basekeys_1 = __importDefault(basekeys_1);
    select_all_1 = __importDefault(select_all_1);
    cursor_1 = __importDefault(cursor_1);
    history_1 = __importDefault(history_1);
    smarty_1 = __importDefault(smarty_1);
    attr_edit_1 = __importDefault(attr_edit_1);
    trailing_p_1 = __importDefault(trailing_p_1);
    code_1 = __importDefault(code_1);
    em_1 = __importDefault(em_1);
    link_1 = __importDefault(link_1);
    strong_1 = __importDefault(strong_1);
    strikeout_1 = __importDefault(strikeout_1);
    superscript_1 = __importDefault(superscript_1);
    subscript_1 = __importDefault(subscript_1);
    smallcaps_1 = __importDefault(smallcaps_1);
    quoted_1 = __importDefault(quoted_1);
    blockquote_1 = __importDefault(blockquote_1);
    footnote_1 = __importDefault(footnote_1);
    code_block_1 = __importDefault(code_block_1);
    hard_break_1 = __importDefault(hard_break_1);
    soft_break_1 = __importDefault(soft_break_1);
    heading_1 = __importDefault(heading_1);
    horizontal_rule_1 = __importDefault(horizontal_rule_1);
    image_1 = __importDefault(image_1);
    list_1 = __importDefault(list_1);
    paragraph_1 = __importDefault(paragraph_1);
    text_1 = __importDefault(text_1);
    codemirror_1 = __importDefault(codemirror_1);
    function initExtensions(config) {
        // create extension manager
        var manager = new ExtensionManager();
        // register built-in extensions
        manager.register([
            // behaviors
            basekeys_1.default,
            select_all_1.default,
            cursor_1.default,
            smarty_1.default,
            history_1.default,
            attr_edit_1.default,
            trailing_p_1.default,
            // marks
            em_1.default,
            strong_1.default,
            code_1.default,
            link_1.default,
            strikeout_1.default,
            superscript_1.default,
            subscript_1.default,
            smallcaps_1.default,
            quoted_1.default,
            // nodes
            text_1.default,
            paragraph_1.default,
            heading_1.default,
            blockquote_1.default,
            footnote_1.default,
            horizontal_rule_1.default,
            code_block_1.default,
            list_1.default,
            hard_break_1.default,
            soft_break_1.default,
            image_1.default,
        ]);
        // optional codemirror embedded editor
        if (config.options.codemirror) {
            manager.register([codemirror_1.default]);
        }
        // register external extensions
        if (config.extensions) {
            manager.register(config.extensions);
        }
        // return manager
        return manager;
    }
    exports.initExtensions = initExtensions;
    var ExtensionManager = /** @class */ (function () {
        function ExtensionManager() {
            this.extensions = [];
        }
        ExtensionManager.prototype.register = function (extensions) {
            var _a;
            (_a = this.extensions).push.apply(_a, extensions);
        };
        ExtensionManager.prototype.pandocMarks = function () {
            return this.collect(function (extension) { return extension.marks; });
        };
        ExtensionManager.prototype.pandocNodes = function () {
            return this.collect(function (extension) { return extension.nodes; });
        };
        ExtensionManager.prototype.pandocReaders = function () {
            var readers = [];
            this.pandocMarks().forEach(function (mark) {
                readers.push.apply(readers, mark.pandoc.readers);
            });
            this.pandocNodes().forEach(function (node) {
                if (node.pandoc.readers) {
                    readers.push.apply(readers, node.pandoc.readers);
                }
            });
            return readers;
        };
        ExtensionManager.prototype.pandocMarkWriters = function () {
            return this.pandocMarks().map(function (mark) {
                return __assign({ name: mark.name }, mark.pandoc.writer);
            });
        };
        ExtensionManager.prototype.pandocNodeWriters = function () {
            return this.pandocNodes().map(function (node) {
                return {
                    name: node.name,
                    write: node.pandoc.writer,
                };
            });
        };
        ExtensionManager.prototype.commands = function (schema, ui, mac) {
            return this.collect(function (extension) {
                if (extension.commands) {
                    return extension.commands(schema, ui, mac);
                }
                else {
                    return undefined;
                }
            });
        };
        ExtensionManager.prototype.plugins = function (schema, ui, mac) {
            return this.collect(function (extension) {
                if (extension.plugins) {
                    return extension.plugins(schema, ui, mac);
                }
                else {
                    return undefined;
                }
            });
        };
        // NOTE: return value not readonly b/c it will be fed directly to a
        // Prosemirror interface that doesn't take readonly
        ExtensionManager.prototype.inputRules = function (schema) {
            return this.collect(function (extension) {
                if (extension.inputRules) {
                    return extension.inputRules(schema);
                }
                else {
                    return undefined;
                }
            });
        };
        ExtensionManager.prototype.collect = function (collector) {
            var items = [];
            this.extensions.forEach(function (extension) {
                var collected = collector(extension);
                if (collected !== undefined) {
                    items = items.concat(collected);
                }
            });
            return items;
        };
        return ExtensionManager;
    }());
    exports.ExtensionManager = ExtensionManager;
});
//# sourceMappingURL=extensions.js.map