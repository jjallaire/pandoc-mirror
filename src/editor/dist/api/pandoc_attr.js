define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var PANDOC_ATTR_ID = 0;
    var PANDOC_ATTR_CLASSES = 1;
    var PANDOC_ATTR_KEYVAULE = 2;
    exports.pandocAttrSpec = {
        id: { default: null },
        classes: { default: [] },
        keyvalue: { default: [] },
    };
    function pandocAttrAvailable(attrs) {
        return attrs.id || (attrs.classes && attrs.classes.length > 0) || (attrs.keyvalue && attrs.keyvalue.length > 0);
    }
    exports.pandocAttrAvailable = pandocAttrAvailable;
    function pandocAttrFrom(attrs) {
        var pandocAttr = {};
        if (attrs.id) {
            pandocAttr.id = attrs.id;
        }
        if (attrs.classes) {
            pandocAttr.classes = attrs.classes;
        }
        if (attrs.keyvalue) {
            pandocAttr.keyvalue = attrs.keyvalue;
        }
        return pandocAttr;
    }
    exports.pandocAttrFrom = pandocAttrFrom;
    function pandocAttrInSpec(spec) {
        var keys = Object.keys(spec.attrs || {});
        return keys.includes('id') && keys.includes('classes') && keys.includes('keyvalue');
    }
    exports.pandocAttrInSpec = pandocAttrInSpec;
    function pandocAttrReadAST(tok, index) {
        var pandocAttr = tok.c[index];
        return {
            id: pandocAttr[PANDOC_ATTR_ID] || undefined,
            classes: pandocAttr[PANDOC_ATTR_CLASSES],
            keyvalue: pandocAttr[PANDOC_ATTR_KEYVAULE],
        };
    }
    exports.pandocAttrReadAST = pandocAttrReadAST;
    function pandocAttrToDomAttr(attrs) {
        // id and class
        var domAttr = {};
        if (attrs.id) {
            domAttr.id = attrs.id;
        }
        if (attrs.classes && attrs.classes.length > 0) {
            domAttr.class = attrs.classes.join(' ');
        }
        // keyvalue pairs
        attrs.keyvalue.forEach(function (keyvalue) {
            domAttr[keyvalue[0]] = keyvalue[1];
        });
        // return domAttr
        return domAttr;
    }
    exports.pandocAttrToDomAttr = pandocAttrToDomAttr;
    function pandocAttrParseDom(el, attrs) {
        var existingNames = Object.keys(attrs);
        var attr = {};
        attr.classes = [];
        attr.keyvalue = [];
        el.getAttributeNames().forEach(function (name) {
            var value = el.getAttribute(name);
            // exclude attributes already parsed and prosemirror internal attributes
            if (existingNames.indexOf(name) === -1 && !name.startsWith('data-pm')) {
                if (name === 'id') {
                    attr.id = value;
                }
                else if (name === 'class') {
                    attr.classes = value.split(/\s+/);
                }
                else {
                    attr.keyvalue.push([name, value]);
                }
            }
        });
        return attr;
    }
    exports.pandocAttrParseDom = pandocAttrParseDom;
});
//# sourceMappingURL=pandoc_attr.js.map