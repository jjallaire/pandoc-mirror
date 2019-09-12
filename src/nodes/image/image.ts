import { Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction, Plugin, PluginKey } from 'prosemirror-state';

import { Command } from 'api/command';
import { Extension } from 'api/extension';
import { canInsertNode } from 'api/node';
import { pandocAttrSpec, pandocAttrParseDom, pandocAttrToDomAttr, pandocAttrReadAST } from 'api/pandoc_attr';
import { PandocOutput, PandocToken, tokensCollectText } from 'api/pandoc';
import { EditorUI, ImageEditorFn } from 'api/ui';

import { imageDialog } from './image-dialog';
import { EditorView } from 'prosemirror-view';
import { imageDoubleClickOn, imageDrop } from './image-events';

const TARGET_URL = 0;
const TARGET_TITLE = 1;

const IMAGE_ATTR = 0;
const IMAGE_ALT = 1;
const IMAGE_TARGET = 2;

const plugin = new PluginKey('image');

const extension: Extension = {
  nodes: [
    {
      name: 'image',
      spec: {
        inline: true,
        attrs: {
          src: {},
          alt: { default: null },
          title: { default: null },
          ...pandocAttrSpec,
        },
        group: 'inline',
        draggable: true,
        parseDOM: [
          {
            tag: 'img[src]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              const attrs: { [key: string]: string | null } = {
                src: el.getAttribute('src') || null,
                title: el.getAttribute('title') || null,
                alt: el.getAttribute('alt') || null,
              };
              return {
                ...attrs,
                ...pandocAttrParseDom(el, attrs),
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return [
            'img',
            {
              src: node.attrs.src,
              title: node.attrs.title,
              alt: node.attrs.alt,
              ...pandocAttrToDomAttr(node.attrs),
            },
          ];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Image',
            node: 'image',
            getAttrs: (tok: PandocToken) => {
              const target = tok.c[IMAGE_TARGET];
              return {
                src: target[TARGET_URL],
                title: target[TARGET_TITLE] || null,
                // TODO: support for figures. actually represent within the DOM as a <figure>
                /*
                <figure>
                  <img src="/media/examples/elephant-660-480.jpg"
                      alt="Elephant at sunset">
                  <figcaption>An elephant at sunset</figcaption>
                </figure>
                */
                alt: tokensCollectText(tok.c[IMAGE_ALT]) || null,
                ...pandocAttrReadAST(tok, IMAGE_ATTR),
              };
            },
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('Image', () => {
            output.writeAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
            output.writeArray(() => {
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

  commands: (schema: Schema, ui: EditorUI) => {
    return [new Command('image', null, imageCommand(schema.nodes.image, ui.editImage))];
  },

  plugins: (schema: Schema, ui: EditorUI) => {
    return [
      new Plugin({
        key: plugin,
        props: {
          handleDoubleClickOn: imageDoubleClickOn(schema.nodes.image, ui.editImage),
          handleDOMEvents: {
            drop: imageDrop(schema.nodes.image),
          },
        },
      }),
    ];
  },
};

function imageCommand(nodeType: NodeType, onEditImage: ImageEditorFn) {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    if (!canInsertNode(state, nodeType)) {
      return false;
    }

    if (dispatch) {
      // see if we are editing an existing node
      let node: ProsemirrorNode | null = null;
      if (state.selection instanceof NodeSelection && state.selection.node.type === nodeType) {
        node = state.selection.node;
      }

      // show dialog
      imageDialog(node, nodeType, state, dispatch, view, onEditImage);
    }

    return true;
  };
}

export default extension;
