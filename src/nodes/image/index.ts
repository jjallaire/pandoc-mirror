import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import { Command, NodeCommand } from 'api/command';
import { Extension } from 'api/extension';
import { canInsertNode } from 'api/node';
import { PandocAstToken } from 'api/pandoc';
import { EditorUI, ImageEditorFn } from 'api/ui';

import { imageDialog } from './dialog';
import { imagePlugin } from './plugin';
import { write } from 'fs';

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
          id: { default: null },
          class: { default: [] },
        },
        group: 'inline',
        draggable: true,
        parseDOM: [
          {
            tag: 'img[src]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              const clz = el.getAttribute('class');
              return {
                src: el.getAttribute('src'),
                title: el.getAttribute('title') || null,
                alt: el.getAttribute('alt') || null,
                id: el.getAttribute('id') || null,
                class: clz ? clz.split(/\s+/) : [],
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return ['img', { 
            ...node.attrs,
            class: node.attrs.class ? node.attrs.class.join(' ') : null
          }];
        },
      },
      pandoc: {
        from: [
          {
            token: 'Image',
            node: 'image',
            pandocAttr: IMAGE_ATTR,
            getAttrs: (tok: PandocAstToken) => {
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
          if (node.attrs.id || node.attrs.class) {
            state.write('{');
            if (node.attrs.id) {
              state.write('#' + state.esc(node.attrs.id));
              if (node.attrs.class.length > 0) {
                state.write(' ');
              }
            }
            if (node.attrs.class) {
              const classes = node.attrs.class.map((clz : string) => '.' + clz);
              state.write(state.esc(classes.join(' ')));
            }
            state.write('}');
          }
        },
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
function collectText(c: PandocAstToken[]): string {
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
