import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { Plugin, PluginKey, EditorState, Transaction, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { findChildrenByType } from 'prosemirror-utils';

import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { Command } from 'api/command';
import { createNoteId, findNoteNode } from 'api/notes';
import { canInsertNode } from 'api/node';

import { 
  footnoteEditorKeyDownHandler, 
  footnoteEditorDecorations, 
  footnoteEditorNodeViews 
} from './footnote-editor';
import { footnoteAppendTransaction } from './footnote-transaction';

const plugin = new PluginKey('footnote');

const extension: Extension = {
  nodes: [
    {
      name: 'footnote',
      spec: {
        inline: true,
        attrs: {
          number: { default: 1 },
          ref: {},
          content: { default: '' },
        },
        group: 'inline',
        // atom: true,
        parseDOM: [
          {
            tag: "span[class='footnote']",
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                ref: el.getAttribute('data-ref'),
                content: el.getAttribute('data-content'),
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return [
            'span',
            { class: 'footnote', 'data-ref': node.attrs.ref, 'data-content': node.attrs.content },
            node.attrs.number.toString(),
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

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,

        // footnote editor
        props: {
          handleKeyDown: footnoteEditorKeyDownHandler(schema),
          decorations: footnoteEditorDecorations(schema),
          nodeViews: footnoteEditorNodeViews(schema),
        },

        // footnote transactions (fixups, etc.)
        appendTransaction: footnoteAppendTransaction(schema),
      }),
    ];
  },
  
  commands: (schema: Schema) => {
    return [
      new Command('footnote', ['Mod-^'], footnoteCommandFn(schema))
    ];
  },
};


function footnoteCommandFn(schema: Schema) {
  
  return (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
    
    if (!canInsertNode(state,  schema.nodes.footnote)) {
      return false;
    }

    if (dispatch) {
      const tr = state.tr;
      
      // generate note id
      const ref = createNoteId();

      // insert empty note
      const notes = findChildrenByType(tr.doc, schema.nodes.notes, true)[0];
      const note = schema.nodes.note.createAndFill( { ref }, schema.nodes.paragraph.create() );
      tr.insert(notes.pos + 1, note as ProsemirrorNode);
    
      // insert footnote linked to note
      const footnote = schema.nodes.footnote.create({ ref });
      tr.replaceSelectionWith(footnote);
    
      // open note editor
      const noteNode = findNoteNode(tr.doc, ref);
      if (noteNode) {
        tr.setSelection(TextSelection.near(tr.doc.resolve(noteNode.pos)));
      }
    
      // dispatch transaction
      dispatch(tr);
    }

    return true;
  };
}

export default extension;
