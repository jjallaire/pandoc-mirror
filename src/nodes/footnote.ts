import { Node as ProsemirrorNode, Schema, Fragment } from 'prosemirror-model';
import { Plugin, PluginKey, EditorState, Transaction } from 'prosemirror-state';
import { findChildrenByType } from 'prosemirror-utils';

import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { createNoteId } from 'api/notes';

const plugin = new PluginKey('footnote');

// TODO: Implement trailing_p for notes

// https://discuss.prosemirror.net/t/find-new-node-instances-and-track-them/96/7

// we could get those ranges and then see if:
//  1) any of them include footnotes
//  2) any of them are inside notes
// then do the full scan if true

// https://discuss.prosemirror.net/t/reacting-to-node-adding-removing-changing/676/4
// https://discuss.prosemirror.net/t/adding-style-on-the-fly/703

// https://discuss.prosemirror.net/t/tracked-changes-with-strict-document-format/1142/4
// https://github.com/ProseMirror/prosemirror-changeset

// TODO: only run the code if a footnote was affected (same for quotes)

// TODO: Insert Footnote
// TODO: ui treatment/positioning

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

        appendTransaction: (transactions: Transaction[], _oldState: EditorState, newState: EditorState) => {
          //  only process transactions which changed the document
          if (transactions.some(transaction => transaction.docChanged)) {
            // transaction
            const tr = newState.tr;

            // footnotes in the document
            const footnotes = findChildrenByType(newState.doc, schema.nodes.footnote, true);

            // notes container
            const notes = findChildrenByType(newState.doc, schema.nodes.notes, true)[0];

            // iterate through footnotes in the newState
            const refs = new Set<string>();
            footnotes.forEach((footnote, index) => {

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

                // update content (used to propagate user edits back to data-content)
                content = JSON.stringify(note.node.content.toJSON());

                // if we've already processed this ref then it's a duplicate, make a copy w/ a new ref/id
                if (refs.has(ref)) {

                  // create a new unique id and change the ref to it
                  ref = createNoteId();

                  // create and insert new note with this id
                  newNote = schema.nodes.note.createAndFill({ id: ref }, note.node.content);
                }

              // if there is no note then create one using the content attr
              } else {
                newNote = schema.nodes.note.createAndFill(
                  { id: ref },
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

            if (tr.docChanged) {
              return tr;
            }
          }
        },
      }),
    ];
  },
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
