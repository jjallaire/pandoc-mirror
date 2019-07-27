

import { EditorCommand, EditorCommandFn } from './command'

import { MarkType } from "prosemirror-model"
import { toggleMark } from "prosemirror-commands"
import { EditorState } from 'prosemirror-state';

export class MarkCommand extends EditorCommand {
  
  public markType: MarkType;
  public attrs: object

  constructor(name: string, keymap: string, markType: MarkType, attrs = {}) {
    super(name, keymap, toggleMark(markType, attrs) as EditorCommandFn);
    this.markType = markType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return markIsActive(state, this.markType);
  }
}

export function markIsActive(state: EditorState, type: MarkType) {
  const {
    from,
    $from,
    to,
    empty,
  } = state.selection

  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks())
  }

  return !!state.doc.rangeHasMark(from, to, type)
}
