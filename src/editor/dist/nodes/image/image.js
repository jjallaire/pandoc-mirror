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
define(["require", "exports", "prosemirror-state", "editor/api/command", "editor/api/node", "editor/api/pandoc_attr", "editor/api/pandoc", "./image-dialog", "./image-events"], function (require, exports, prosemirror_state_1, command_1, node_1, pandoc_attr_1, pandoc_1, image_dialog_1, image_events_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TARGET_URL = 0;
    var TARGET_TITLE = 1;
    var IMAGE_ATTR = 0;
    var IMAGE_ALT = 1;
    var IMAGE_TARGET = 2;
    var plugin = new prosemirror_state_1.PluginKey('image');
    var extension = {
        nodes: [
            {
                name: 'image',
                spec: {
                    inline: true,
                    attrs: __assign({ src: {}, alt: { default: null }, title: { default: null } }, pandoc_attr_1.pandocAttrSpec),
                    group: 'inline',
                    draggable: true,
                    parseDOM: [
                        {
                            tag: 'img[src]',
                            getAttrs: function (dom) {
                                var el = dom;
                                var attrs = {
                                    src: el.getAttribute('src') || null,
                                    title: el.getAttribute('title') || null,
                                    alt: el.getAttribute('alt') || null,
                                };
                                return __assign(__assign({}, attrs), pandoc_attr_1.pandocAttrParseDom(el, attrs));
                            },
                        },
                    ],
                    toDOM: function (node) {
                        return [
                            'img',
                            __assign({ src: node.attrs.src, title: node.attrs.title, alt: node.attrs.alt }, pandoc_attr_1.pandocAttrToDomAttr(node.attrs)),
                        ];
                    },
                },
                pandoc: {
                    readers: [
                        {
                            token: 'Image',
                            node: 'image',
                            getAttrs: function (tok) {
                                var target = tok.c[IMAGE_TARGET];
                                return __assign({ src: target[TARGET_URL], title: target[TARGET_TITLE] || null, 
                                    // TODO: support for figures. actually represent within the DOM as a <figure>
                                    /*
                                    <figure>
                                      <img src="/media/examples/elephant-660-480.jpg"
                                          alt="Elephant at sunset">
                                      <figcaption>An elephant at sunset</figcaption>
                                    </figure>
                                    */
                                    alt: pandoc_1.tokensCollectText(tok.c[IMAGE_ALT]) || null }, pandoc_attr_1.pandocAttrReadAST(tok, IMAGE_ATTR));
                            },
                        },
                    ],
                    writer: function (output, node) {
                        output.writeToken('Image', function () {
                            output.writeAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
                            output.writeArray(function () {
                                // TODO: support for arbitrary inlines in alt
                                // May simply need a separate figure node type
                                output.writeText(node.attrs.alt);
                            });
                            output.write([node.attrs.src, node.attrs.title || '']);
                        });
                    },
                },
            },
        ],
        commands: function (schema, ui) {
            return [new command_1.Command('image', null, imageCommand(schema.nodes.image, ui.editImage))];
        },
        plugins: function (schema, ui) {
            return [
                new prosemirror_state_1.Plugin({
                    key: plugin,
                    props: {
                        handleDoubleClickOn: image_events_1.imageDoubleClickOn(schema.nodes.image, ui.editImage),
                        handleDOMEvents: {
                            drop: image_events_1.imageDrop(schema.nodes.image),
                        },
                    },
                }),
            ];
        },
    };
    function imageCommand(nodeType, onEditImage) {
        return function (state, dispatch, view) {
            if (!node_1.canInsertNode(state, nodeType)) {
                return false;
            }
            if (dispatch) {
                // see if we are editing an existing node
                var node = null;
                if (state.selection instanceof prosemirror_state_1.NodeSelection && state.selection.node.type === nodeType) {
                    node = state.selection.node;
                }
                // show dialog
                image_dialog_1.imageDialog(node, nodeType, state, dispatch, view, onEditImage);
            }
            return true;
        };
    }
    exports.default = extension;
});
//# sourceMappingURL=image.js.map