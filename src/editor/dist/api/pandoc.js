define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // collect the text from a collection of pandoc ast
    // elements (ignores marks, useful for ast elements
    // that support marks but whose prosemirror equivalent
    // does not, e.g. image alt text)
    function tokensCollectText(c) {
        return c
            .map(function (elem) {
            if (elem.t === 'Str') {
                return elem.c;
            }
            else if (elem.t === 'Space') {
                return ' ';
            }
            else if (elem.c) {
                return tokensCollectText(elem.c);
            }
            else {
                return '';
            }
        })
            .join('');
    }
    exports.tokensCollectText = tokensCollectText;
    function mapTokens(c, f) {
        return c.map(function (tok) {
            var mappedTok = f(tok);
            if (mappedTok.c instanceof Array) {
                mappedTok.c = mapTokens(mappedTok.c, f);
            }
            return mappedTok;
        });
    }
    exports.mapTokens = mapTokens;
});
//# sourceMappingURL=pandoc.js.map