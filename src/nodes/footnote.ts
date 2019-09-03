import { Node as ProsemirrorNode, Schema, Fragment } from 'prosemirror-model';
import { Plugin, PluginKey, EditorState, Transaction } from 'prosemirror-state';
import { findChildrenByType } from 'prosemirror-utils';

import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { createNoteId } from 'api/notes';

const plugin = new PluginKey('footnote');

// TODO: Implement trailing_p for notes

// TODO: Transactions which affect the content of notes need to write back to data-content

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

            // if a footnote has a duplicate reference then generate a new id
            // and create a new node
            const refs = new Set<string>();
            footnotes.forEach((footnote, index) => {
              // alias ref
              let ref = footnote.node.attrs.ref;

              // get reference to note (if any)
              const note = findChildrenByType(newState.doc, schema.nodes.note, true).find(
                noteWithPos => noteWithPos.node.attrs.id === ref,
              );

              // we may be creating a new note to append
              let newNote: any;

              // if there is no note then create one using the content attr
              if (!note) {
                newNote = schema.nodes.note.createAndFill(
                  { id: ref },
                  Fragment.fromJSON(schema, JSON.parse(footnote.node.attrs.content)),
                );
              }

              // if we've already processed this ref then it's a duplicate we need to resolve
              else if (refs.has(ref)) {
                // create a new unique id and change the ref to it
                ref = createNoteId();

                // create and insert new note with this id
                newNote = schema.nodes.note.createAndFill({ id: ref }, note.node.content);
              }

              // create newNote if necessary
              if (newNote) {
                tr.insert(notes.pos + 1, newNote as ProsemirrorNode);
              }

              // indicate that we've seen this ref
              refs.add(ref);

              // set new footnote markup
              tr.setNodeMarkup(footnote.pos, schema.nodes.footnote, {
                ...footnote.node.attrs,
                ref,
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
