import { Schema, Fragment, Node as ProsemirrorNode } from 'prosemirror-model';
import { Transaction, EditorState, TextSelection } from 'prosemirror-state';
import { transactionsHaveChange } from 'api/transaction';
import { findChildrenByType, NodeWithPos, findSelectedNodeOfType, findChildren } from 'prosemirror-utils';

import { createNoteId, findNoteNode } from 'api/notes';

// examine editor transactions and append a transaction that handles fixup of footnote numbers,
// importing of pasted footnotes, selection propagation to the footnote editor, etc.

export function footnoteAppendTransaction(schema: Schema) {
  return (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {
    // transaction
    const tr = newState.tr;

    // do footnote fixups if there were any changes affecting footnotes
    const footnoteChange = (node: ProsemirrorNode) =>
      node.type === schema.nodes.footnote || node.type === schema.nodes.note;
    if (transactionsHaveChange(transactions, oldState, newState, footnoteChange)) {
      // footnotes in the document
      const footnotes = findChildrenByType(newState.doc, schema.nodes.footnote, true);

      // notes container
      const notes = findChildrenByType(newState.doc, schema.nodes.notes, true)[0];

      // iterate through footnotes in the newState
      const refs = new Set<string>();
      footnotes.forEach((footnote, index) => {
        // footnote number
        const number = index + 1;

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
          if (
            transactionsHaveChange(
              transactions,
              oldState,
              newState,
              node => node.type === schema.nodes.note && node.attrs.id === ref,
            )
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
              number,
            });
          }

          // if there is no note then create one using the content attr
        } else {
          const fragment = content 
            ? Fragment.fromJSON(schema, JSON.parse(content)) :
            schema.nodes.paragraph.create();
          newNote = schema.nodes.note.createAndFill(
            { id: ref, number },
            fragment,
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
      const noteNode = findNoteNode(tr.doc, ref);
      if (noteNode) {
        tr.setSelection(TextSelection.near(tr.doc.resolve(noteNode.pos)));
      }
    }

    if (tr.docChanged || tr.selectionSet) {
      return tr;
    }
  };
}

