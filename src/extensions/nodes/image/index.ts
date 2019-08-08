import { Schema, Node as ProsemirrorNode, NodeType } from 'prosemirror-model';
import { NodeSelection, EditorState, Transaction } from 'prosemirror-state';
import { MarkdownSerializerState } from 'prosemirror-markdown';

import { IExtension } from '../../api/extension';
import { Command } from '../../api/command';
import { IPandocToken } from '../../api/pandoc';
import { IEditorUI, IImageEditor } from '../../api/ui';
import { canInsertNode } from '../../api/node';

import { imagePlugin } from './plugin';
import { imageDialog } from './dialog';

const TARGET_URL = 0;
const TARGET_TITLE = 1;

const IMAGE_ATTR = 0;
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
          id: { default: null },
          class: { default: null },
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
                title: el.getAttribute('title') || null,
                alt: el.getAttribute('alt') || null,
                id: el.getAttribute('id') || null,
                class: el.getAttribute('class') || null,
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return ['img', node.attrs];
        },
      },
      pandoc: {
        from: [
          {
            token: 'Image',
            node: 'image',
            pandocAttr: IMAGE_ATTR,
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
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.write(
            '![' +
              state.esc(node.attrs.alt || '') +
              '](' +
              state.esc(node.attrs.src) +
              (node.attrs.title ? ' ' + (state as any).quote(node.attrs.title) : '') +
              ')',
          );
        },
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
