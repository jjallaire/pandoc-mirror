import { Node as ProsemirrorNode, Schema, Fragment } from 'prosemirror-model';
import { NodeView, EditorView, Decoration, DecorationSet } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { Plugin, PluginKey, EditorState } from 'prosemirror-state';
import { findNodeOfTypeInSelection } from 'api/node';

const plugin = new PluginKey('footnote_view');

// TODO: Implement trailing_p for notes

// design: hidden part of document at end with
// popup gutter editor that swaps in the node for
// synchronized editing w/ main (a la footnote exampls)

// TODO: Copy/Paste creates wacky outcome
// TODO: Insert Footnote
// TODO: ui treatment/positioning
// TODO: what to do about nesting of marks, etc.
// TODO: double-enter in footnote
// TODO: css in code?
// TODO: is the footnote tag a thing? (use div or span)

const extension: Extension = {
  nodes: [
    {
      name: 'footnote',
      spec: {
        inline: true,
        attrs: {
          number: { default: 1 },
          ref: {},
        },
        group: 'inline',
        atom: true,
        parseDOM: [
          { 
            tag: "sup[class='footnote']", 
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                ref: el.getAttribute('data-ref'),
              };
            },
          }
        ],
        toDOM(node: ProsemirrorNode) {
          return [
            'sup', 
            { class: 'footnote', 'data-ref': node.attrs.ref }, 
            node.attrs.number.toString()
          ];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Note',
            note: 'footnote',
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeNote(node);
        },
      },
    },
  ],

};


/*

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,

        props: {
          // apply 'active' class to footnotes when the footnote is either selected completely (atom: true
          // will result in full selections) or within a selection. this in turn will result
          // in the footnote's contents becoming visible/editable in an absolutely positioned div
          decorations(state: EditorState) {
            const footnoteNode = findNodeOfTypeInSelection(state.selection, schema.nodes.footnote);
            if (footnoteNode) {
              return DecorationSet.create(state.doc, [
                Decoration.node(footnoteNode.pos, footnoteNode.pos + footnoteNode.node.nodeSize, { class: 'active' }),
              ]);
            } else {
              return DecorationSet.empty;
            }
          },

          // custom node view (implements collapsed / active state for footnotes)
          nodeViews: {
            footnote(node, view, getPos) {
              return new FootnoteView(node, view, getPos);
            },
          },
        },
      }),
    ];
  },

*/


/*
class FootnoteView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

  private readonly node: ProsemirrorNode;
  private readonly view: EditorView;
  private readonly getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // create footnote
    this.dom = window.document.createElement('span');
    this.dom.classList.add('footnote');

    // create a div that will be used for editing (+ it's scrolling container)
    const scrollContainer = window.document.createElement('div');
    this.contentDOM = window.document.createElement('div');
    scrollContainer.appendChild(this.contentDOM);
    this.dom.appendChild(scrollContainer);
  }

  public update(_node: ProsemirrorNode, decorations: Decoration[]) {
    // handle change of decorations (e.g. class: 'active' => inactive)
    return true;
  }
}
*/

export default extension;
