import { Schema, Node as ProsemirrorNode, NodeType } from 'prosemirror-model';
import { NodeSelection, EditorState, Transaction } from 'prosemirror-state';

import { IExtension, Command, IPandocToken, IEditorUI, IImageEditor } from '../../api';
import { canInsertNode } from '../../../utils/node';

import { imagePlugin } from './plugin';
import { imageDialog } from './dialog';

const TARGET_URL = 0;
const TARGET_TITLE = 1;

const IMAGE_ALT = 1;
const IMAGE_TARGET = 2;

const extension: IExtension = {
  nodes: [
    {
      name: 'image',
      spec: {
        inline: true,
        attrs: {
          src: {},
          alt: { default: null },
          title: { default: null },
        },
        group: 'inline',
        draggable: true,
        parseDOM: [
          {
            tag: 'img[src]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                src: el.getAttribute('src'),
                title: el.getAttribute('title'),
                alt: el.getAttribute('alt'),
              };
            },
          },
        ],
        toDOM(node) {
          return ['img', node.attrs];
        },
      },
      pandoc: {
        from: {
          token: 'Image',
          node: 'image',
          getAttrs: (tok: IPandocToken) => {
            const target = tok.c[IMAGE_TARGET];
            return {
              src: target[TARGET_URL],
              title: target[TARGET_TITLE] || null,
              // TODO: support for figures
              alt: collectText(tok.c[IMAGE_ALT]),
            };
          },
        },
        to: {},
      },
    },
  ],

  commands: (schema: Schema, ui: IEditorUI) => {
    return [new Command('image', null, imageCommand(schema.nodes.image, ui.onEditImage))];
  },

  plugins: (schema: Schema, ui: IEditorUI) => {
    return [imagePlugin(schema.nodes.image, ui.onEditImage)];
  },
};

function imageCommand(nodeType: NodeType, onEditImage: IImageEditor) {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
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
      imageDialog(node, nodeType, state, dispatch, onEditImage);
    }

    return true;
  };
}

// collect the text from a collection of pandoc ast
// elements (ignores marks, useful for ast elements
// that support marks but whose prosemirror equivalent
// does not, e.g. image alt text)
function collectText(c: IPandocToken[]): string {
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
