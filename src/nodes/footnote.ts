
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { NodeView, EditorView, Decoration, DecorationSet } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { Plugin, PluginKey, EditorState } from 'prosemirror-state';
import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';

const plugin = new PluginKey('footnote_view');

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
        content: 'block+',
        group: 'inline',
        parseDOM: [{tag: "span[class='footnote']" } ],
        toDOM() {
          return ['span', { class: 'footnote' }, 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Note',
            block: 'footnote',
            getChildren: (tok: PandocToken) => {
              return tok.c;
            }
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('Note', () => {
            output.writeBlocks(node);
          });
        },
      },
    },
  ],

  plugins: (schema: Schema) => {



    return [

      new Plugin({
        key: plugin,

        props: {

          // apply 'active' class to footnotes when the footnote is either selected completely (atom: true 
          // will result in full selections) or within a selection
          decorations(state: EditorState) {
            const selection = state.selection;
            const decorations: Decoration[] = [];
            const footnoteNode = findSelectedNodeOfType(schema.nodes.footnote)(selection) ||
                                 findParentNode((n: ProsemirrorNode) => n.type === schema.nodes.footnote)(selection);
            if (footnoteNode) {
              decorations.push(
                Decoration.node(
                  footnoteNode.pos, 
                  footnoteNode.pos + footnoteNode.node.nodeSize, 
                  { class: 'active' } 
                )
              );
            }
            return DecorationSet.create(state.doc, decorations);
          },
        
          nodeViews: {
            footnote(node, view, getPos) {
              return new FootnoteView(node, view, getPos);
            }
          }
        }
      })
    ];
  }
};

class FootnoteView implements NodeView {
  
  public dom: HTMLElement;
  public contentDOM: HTMLElement;

  private node: ProsemirrorNode;
  private view: EditorView;
  private getPos: () => number;


  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = window.document.createElement("span");
    this.dom.classList.add('footnote');    
    const scrollContainer = window.document.createElement("div");
    this.contentDOM = window.document.createElement("div");
    scrollContainer.appendChild(this.contentDOM);
    this.dom.appendChild(scrollContainer);
  }

  public update(_node: ProsemirrorNode, decorations: Decoration[]) {

    // handle change of decorations (e.g. class: 'active' => inactive)
    return true;
  }
    
}



export default extension;



