
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { NodeView, EditorView, Decoration, DecorationSet } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { Plugin, PluginKey, EditorState } from 'prosemirror-state';
import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';

// TODO: consider using marks for footnotes? https://discuss.prosemirror.net/t/discussion-inline-nodes-with-content/496/2

const plugin = new PluginKey('footnote_view');

const extension: Extension = {
  nodes: [
    {
      name: 'footnote',
      spec: {
        inline: true,
        content: 'block+',
        group: 'inline',
        parseDOM: [{ tag: 'footnote' }],
        toDOM() {
          return ['footnote', 0];
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

          // apply 'active' class to footnotes when the cursor is inside the footnote
          decorations(state: EditorState) {
            const selection = state.selection;
            const decorations: Decoration[] = [];
            const footnoteNode = findSelectedNodeOfType(schema.nodes.footnote)(selection) ||
                                 findParentNode((n: ProsemirrorNode) => n.type === schema.nodes.footnote)(selection);
            if (footnoteNode) {
              decorations.push(Decoration.node(footnoteNode.pos, footnoteNode.pos + footnoteNode.node.nodeSize, { class: 'active'} ));
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

  // TODO: may need to use ignoreMutation hook if we mess with the contentDOM
  // TODO: scroll container for contentDOM

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.dom = window.document.createElement("footnote");    
    this.contentDOM = window.document.createElement("div");
    this.dom.appendChild(this.contentDOM);
  }

  public update(_node: ProsemirrorNode, _decorations: Decoration[]) {
    // handle change of decorations (e.g. class: 'active' => inactive)
    return true;
  }
    
}



export default extension;



