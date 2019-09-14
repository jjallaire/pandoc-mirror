define(["require", "exports", "./to_prosemirror", "./from_prosemirror"], function (require, exports, to_prosemirror_1, from_prosemirror_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var kMarkdownFormat = 'markdown' + '-auto_identifiers'; // don't inject identifiers for headers w/o them
    var PandocConverter = /** @class */ (function () {
        function PandocConverter(schema, readers, nodeWriters, markWriters, pandoc, options) {
            this.schema = schema;
            this.readers = readers;
            this.nodeWriters = nodeWriters;
            this.markWriters = markWriters;
            this.pandoc = pandoc;
            this.options = options;
            this.apiVersion = null;
        }
        PandocConverter.prototype.toProsemirror = function (markdown) {
            var _this = this;
            return this.pandoc.markdownToAst(markdown, kMarkdownFormat).then(function (ast) {
                _this.apiVersion = ast['pandoc-api-version'];
                return to_prosemirror_1.pandocToProsemirror(ast, _this.schema, _this.readers);
            });
        };
        PandocConverter.prototype.fromProsemirror = function (doc) {
            if (!this.apiVersion) {
                throw new Error('API version not available (did you call toProsemirror first?)');
            }
            var ast = from_prosemirror_1.pandocFromProsemirror(doc, this.apiVersion, this.nodeWriters, this.markWriters);
            var options = [];
            if (this.options.writer.atxHeaders) {
                options.push('--atx-headers');
            }
            if (this.options.writer.wrapColumn) {
                options.push('--wrap=auto');
                options.push("--column=" + this.options.writer.wrapColumn);
            }
            else {
                options.push('--wrap=none');
            }
            return this.pandoc.astToMarkdown(ast, kMarkdownFormat, options);
        };
        return PandocConverter;
    }());
    exports.PandocConverter = PandocConverter;
});
//# sourceMappingURL=converter.js.map