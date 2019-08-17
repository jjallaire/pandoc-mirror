
import { Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import { Command } from 'api/command';
import { Extension } from 'api/extension';
import { canInsertNode } from 'api/node';
import {
  pandocAttrSpec,
  pandocAttrParseDom,
  pandocAttrToDomAttr,
  pandocAttrReadAST,
} from 'api/pandoc_attr';
import { PandocSerializer, PandocToken } from 'api/pandoc';
import { EditorUI, ImageEditorFn } from 'api/ui';

import { imageDialog } from './dialog';
import { imagePlugin } from './plugin';
import { EditorView } from 'prosemirror-view';

const TARGET_URL = 0;
const TARGET_TITLE = 1;

const IMAGE_ATTR = 0;
const IMAGE_ALT = 1;
const IMAGE_TARGET = 2;

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
        ast_readers: [
          {
            token: 'Image',
            node: 'image',
            getAttrs: (tok: PandocToken) => {
              const target = tok.c[IMAGE_TARGET];
              return {
                src: target[TARGET_URL],
                title: target[TARGET_TITLE] || null,
                // TODO: support for figures
                alt: collectText(tok.c[IMAGE_ALT]) || null,
                ...pandocAttrReadAST(tok, IMAGE_ATTR),
              };
            },
          },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderToken('Image', () => {
            pandoc.renderAttr(node.attrs.id, node.attrs.classes, node.attrs.keyvalue);
            pandoc.renderList(() => {
              // TODO: support for arbitrary inlines in alt
              // May simply need a separate figure node type
              pandoc.renderText(node.attrs.alt);
            });
            pandoc.render([node.attrs.src, node.attrs.title || '']);
          });
        }
      },
    },
  ],

  commands: (schema: Schema, ui: EditorUI) => {
    return [new Command('image', null, imageCommand(schema.nodes.image, ui.onEditImage))];
  },

  plugins: (schema: Schema, ui: EditorUI) => {
    return [imagePlugin(schema.nodes.image, ui.onEditImage)];
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

// collect the text from a collection of pandoc ast
// elements (ignores marks, useful for ast elements
// that support marks but whose prosemirror equivalent
// does not, e.g. image alt text)
function collectText(c: PandocToken[]): string {
  return c
    .map(elem => {
      if (elem.t === 'Str') {
        return elem.c;
      } else if (elem.t === 'Space') {
        return ' ';
      } else if (elem.c) {
        return collectText(elem.c);
      } else {
        return '';
      }
    })
    .join('');
}

export default extension;
