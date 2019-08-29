
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { NodeView, EditorView } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { Plugin, PluginKey } from 'prosemirror-state';

const plugin = new PluginKey('footnote_View');

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

      // apply smarty rules to plain text pastes
      new Plugin({
        key: plugin,
        props: {
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
    this.dom = window.document.createElement("footnote");    
    this.contentDOM = window.document.createElement("div");
    this.dom.appendChild(this.contentDOM);
  }


}

export default extension;



