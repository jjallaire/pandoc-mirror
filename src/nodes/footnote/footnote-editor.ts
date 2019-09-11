import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView, DecorationSet, NodeView } from 'prosemirror-view';
import { findParentNodeOfType, NodeWithPos, findChildrenByType, findChildren } from 'prosemirror-utils';
import { EditorState, TextSelection } from 'prosemirror-state';

import { nodeDecoration } from 'api/decoration';
import { firstNode, lastNode } from 'api/node';
import { selectionIsWithin } from 'api/selection';

import { findFootnoteNode, selectedFootnote, selectedNote } from './footnote';

// selection-driven decorations (mostly css classes) required to activate the footnote editor
export function footnoteEditorDecorations(schema: Schema) {
  return (state: EditorState) => {
    // see if either a footnote node or note (footnote editor) node has the selection
    let footnoteNode = selectedFootnote(schema, state.selection);
    let noteNode = selectedNote(schema, state.selection);

    // if they do then we need to enable footnote editing/behavior by
    // using decorators to inject appropriate css classes
    if (footnoteNode || noteNode) {
      // get body and notes nodes
      const bodyNode = findChildrenByType(state.doc, schema.nodes.body)[0];
      const notesNode = findChildrenByType(state.doc, schema.nodes.notes)[0];

      // resolve the specific footnote node or specific note node
      if (footnoteNode) {
        const ref = footnoteNode.node.attrs.ref;
        const matching = findChildren(notesNode.node, node => node.attrs.ref === ref);
        if (matching.length) {
          noteNode = matching[0];
          noteNode.pos = notesNode.pos + 1 + noteNode.pos;
        }
      } else if (noteNode) {
        const ref = noteNode.node.attrs.ref;
        const matching = findChildren(
          state.doc,
          node => node.type === schema.nodes.footnote && node.attrs.ref === ref,
          true,
        );
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
  };
}

// node view that display the note number alongside the note content
export function footnoteEditorNodeViews(_schema: Schema) {
  return {
    note(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
      return new NoteEditorView(node, view, getPos);
    },
  };
}

class NoteEditorView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

  private readonly node: ProsemirrorNode;
  private readonly view: EditorView;
  private readonly getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = window.document.createElement('div');
    this.dom.setAttribute('data-ref', this.node.attrs.ref);
    this.dom.classList.add('note');

    const label = window.document.createElement('div');
    label.classList.add('note-label');
    label.contentEditable = 'false';
    label.innerHTML = `<p>${this.node.attrs.number}:</p>`;
    this.dom.appendChild(label);

    const content = window.document.createElement('div');
    content.classList.add('note-content');
    this.contentDOM = content;
    this.dom.appendChild(content);
  }
}

// custom handling for arrow keys that cause selection to escape the editor
export function footnoteEditorKeyDownHandler(schema: Schema) {
  return (view: EditorView, event: KeyboardEvent) => {
    // alias selection
    const selection = view.state.selection;

    // pass if the selection isn't in a note
    const noteNode: NodeWithPos | undefined = findParentNodeOfType(schema.nodes.note)(selection);
    if (!noteNode) {
      return false;
    }

    // function to find and move selection to associated footnote
    // will call this from Escape, ArrowLeft, and ArrowUp handlers below
    const selectFootnote = (before = true) => {
      const footnoteNode = findFootnoteNode(view.state.doc, noteNode.node.attrs.ref);
      if (footnoteNode) {
        const tr = view.state.tr;
        tr.setSelection(TextSelection.near(tr.doc.resolve(footnoteNode.pos + (before ? 0 : 1))));
        view.dispatch(tr);
      }
    };

    // if this is the Escape key then close the editor
    if (event.key === 'Escape') {
      selectFootnote();
      return true;
    }

    // ...otherwise check to see if the user is attempting to arrow out of the footnote

    // get first and last text block nodes (bail if we aren't in either)
    const firstTextBlock = firstNode(noteNode, node => node.isTextblock);
    const lastTextBlock = lastNode(noteNode, node => node.isTextblock);
    if (!firstTextBlock && !lastTextBlock) {
      return false;
    }

    // exiting from first text block w/ left or up arrow?
    if (firstTextBlock) {
      if (selectionIsWithin(selection, firstTextBlock)) {
        switch (event.key) {
          case 'ArrowLeft':
            if (selection.anchor === firstTextBlock.pos + 1) {
              selectFootnote(true);
              return true;
            }
            break;
          case 'ArrowUp': {
            if (view.endOfTextblock('up')) {
              selectFootnote(true);
              return true;
            }
            break;
          }
        }
      }
    }

    // exiting from last text block with right or down arrow?
    if (lastTextBlock) {
      if (selectionIsWithin(selection, lastTextBlock)) {
        switch (event.key) {
          case 'ArrowRight':
            if (selection.anchor === lastTextBlock.pos + lastTextBlock.node.nodeSize - 1) {
              selectFootnote(false);
              return true;
            }
            break;
          case 'ArrowDown': {
            if (view.endOfTextblock('down')) {
              selectFootnote(false);
              return true;
            }
            break;
          }
        }
      }
    }

    return false;
  };
}
