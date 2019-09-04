import { Node as ProsemirrorNode, Schema, Fragment, ResolvedPos } from 'prosemirror-model';
import { Plugin, PluginKey, EditorState, Transaction, Selection, TextSelection } from 'prosemirror-state';
import { findChildrenByType, findSelectedNodeOfType, findParentNodeOfType, ContentNodeWithPos, NodeWithPos, findChildren } from 'prosemirror-utils';
import { DecorationSet, NodeView, EditorView, Decoration } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { createNoteId } from 'api/notes';
import { nodeDecoration } from 'api/decoration';
import { transactionsHaveChange } from 'api/transaction';

const plugin = new PluginKey('footnote');

// TODO: Implement trailing_p for notes
// TODO: Insert Footnote
//

// TODO: break into multiple files?
// TODO: indicate footnote number in note editor
// TODO: arrow selection back should move to before note (should not go to end of doc)
// TODO: ESC key gesture to close footnote view?


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
        atom: true,
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

        props: {
          // if a footnote is selected OR the selection is within a note, then apply
          // css classes required to show the footnote editor
          decorations(state: EditorState) {
            
            // see if either a footnote node or note (footnote editor) node has the selection
            let footnoteNode: NodeWithPos | undefined = findSelectedNodeOfType(schema.nodes.footnote)(state.selection);
            let noteNode: NodeWithPos | undefined = findParentNodeOfType(schema.nodes.note)(state.selection);
            
            // if they do then we need to enable footnote editing/behavior by 
            // using decorators to inject appropriate css classes
            if (footnoteNode || noteNode) {

              // get body and notes nodes    
              const bodyNode = findChildrenByType(state.doc, schema.nodes.body)[0];
              const notesNode = findChildrenByType(state.doc, schema.nodes.notes)[0];

              // resolve the specific footnote node or specific note node
              if (footnoteNode) {
                const ref = footnoteNode.node.attrs.ref;
                const matching = findChildren(notesNode.node, node => node.attrs.id === ref);
                if (matching.length) {
                  noteNode = matching[0];
                  noteNode.pos = notesNode.pos + 1 + noteNode.pos; 
                }
              } else if (noteNode) {
                const id = noteNode.node.attrs.id;
                const matching = findChildren(state.doc, node => node.type === schema.nodes.footnote && node.attrs.ref === id, true);
                if (matching.length) {
                  footnoteNode = matching[0];
                }
              }
             
              if (footnoteNode && noteNode) {
                return DecorationSet.create(state.doc, [
                  // make notes node visible
                  nodeDecoration(noteNode, { class: 'active' }),

                  // paint outline over footnote
                  nodeDecoration(footnoteNode, { class: 'active' }),

                  // position body and notes nodes for footnote editing
                  nodeDecoration(bodyNode, { class: 'editing-footnote' }),
                  nodeDecoration(notesNode, { class: 'editing-footnote' }),
                ]);
              } else {
                return DecorationSet.empty;
              }
            } else {
              return DecorationSet.empty;
            }
          },

          nodeViews: {
            note(node, view, getPos) {
              return new NoteView(node, view, getPos);
            },
          },
        },

        appendTransaction: (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {

          // transaction
          const tr = newState.tr;

          // do footnote fixups if there were any changes affecting footnotes
          const footnoteChange = (node: ProsemirrorNode) => node.type === schema.nodes.footnote || node.type === schema.nodes.note;
          if (transactionsHaveChange(transactions, oldState, newState, footnoteChange)) {
           
            // footnotes in the document
            const footnotes = findChildrenByType(newState.doc, schema.nodes.footnote, true);

            // notes container
            const notes = findChildrenByType(newState.doc, schema.nodes.notes, true)[0];

            // iterate through footnotes in the newState
            const refs = new Set<string>();
            footnotes.forEach((footnote, index) => {

              // footnote number
              const number = index+1;

              // alias ref and content (either or both may be updated)
              let { ref, content } = footnote.node.attrs;
              
              // we may be creating a new note to append
              let newNote: any;

              // get reference to note (if any)
              const note = findChildrenByType(newState.doc, schema.nodes.note, true).find(
                noteWithPos => noteWithPos.node.attrs.id === ref,
              );

              // matching note found 
              if (note) {

                // update content if this particular note changed
                // (used to propagate user edits back to data-content)
                if (transactionsHaveChange(
                    transactions, oldState, newState,
                    node => node.type === schema.nodes.note && node.attrs.id === ref)
                  ) {
                  content = JSON.stringify(note.node.content.toJSON());
                }

                // if we've already processed this ref then it's a duplicate, make a copy w/ a new ref/id
                if (refs.has(ref)) {

                  // create a new unique id and change the ref to it
                  ref = createNoteId();

                  // create and insert new note with this id
                  newNote = schema.nodes.note.createAndFill({ id: ref, number }, note.node.content);
                
                // otherwise update the note with the correct number
                } else {
                  tr.setNodeMarkup(note.pos, schema.nodes.note, {
                    ...note.node.attrs,
                    number
                  });
                }

              // if there is no note then create one using the content attr
              } else {
                newNote = schema.nodes.note.createAndFill(
                  { id: ref, number },
                  Fragment.fromJSON(schema, JSON.parse(content)),
                );
              }

              // insert newNote if necessary
              if (newNote) {
                tr.insert(notes.pos + 1, newNote as ProsemirrorNode);
              }

              // indicate that we've seen this ref
              refs.add(ref);

              // set new footnote markup
              tr.setNodeMarkup(footnote.pos, schema.nodes.footnote, {
                ...footnote.node.attrs,
                ref,
                content,
                number: index + 1,
              });
            });
          }

          // if a footnote is selected then forward selection to it's corresponding note editor
          const footnoteNode: NodeWithPos | undefined = findSelectedNodeOfType(schema.nodes.footnote)(newState.selection);
          if (footnoteNode) {
            const ref = footnoteNode.node.attrs.ref;
            const noteNode = findChildren(newState.doc, node => node.type === schema.nodes.note && node.attrs.id === ref, true);
            if (noteNode.length) {
              tr.setSelection(TextSelection.near(newState.doc.resolve(noteNode[0].pos)));
            }
          }

          if (tr.docChanged || tr.selectionSet) {
            return tr;
          }
          
        }

      }),
    ];
  },
};

class NoteView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

  private readonly node: ProsemirrorNode;
  private readonly view: EditorView;
  private readonly getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    
    // ['div', { id: node.attrs.id, class: 'note' }, 0]
    this.dom = window.document.createElement('div');
    this.dom.id = this.node.attrs.id;
    this.dom.classList.add('note');

    const label = window.document.createElement('div');
    label.classList.add('note-label');
    label.contentEditable = "false";
    label.innerHTML = `<p>${this.node.attrs.number}:</p>`;
    this.dom.appendChild(label);

    const content = window.document.createElement('div');
    content.classList.add('note-content');
    this.contentDOM = content;
    this.dom.appendChild(content);



  }
  
}



export default extension;
