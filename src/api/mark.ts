import { Mark, MarkSpec, MarkType, ResolvedPos } from 'prosemirror-model';
import { EditorState, Selection } from 'prosemirror-state';

import { PandocTokenReader, PandocMarkWriterFn } from './pandoc';
import { InputRule } from 'prosemirror-inputrules';

export interface PandocMark {
  readonly name: string;
  readonly spec: MarkSpec;
  readonly pandoc: {
    readonly readers: readonly PandocTokenReader[];
    readonly writer: {
      priority: number;
      write: PandocMarkWriterFn;
    };
  };
}

export function markIsActive(state: EditorState, type: MarkType) {
  const { from, $from, to, empty } = state.selection;

  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks());
  }

  return !!state.doc.rangeHasMark(from, to, type);
}

export function getMarkAttrs(state: EditorState, type: MarkType) {
  const { from, to } = state.selection;
  let marks: Mark[] = [];

  state.doc.nodesBetween(from, to, node => {
    marks = [...marks, ...node.marks];
  });

  const mark = marks.find(markItem => markItem.type.name === type.name);

  if (mark) {
    return mark.attrs;
  }

  return {};
}

export function getMarkRange($pos?: ResolvedPos, type?: MarkType) {
  if (!$pos || !type) {
    return false;
  }

  const start = $pos.parent.childAfter($pos.parentOffset);

  if (!start.node) {
    return false;
  }

  const link = start.node.marks.find((mark: Mark) => mark.type === type);
  if (!link) {
    return false;
  }

  let startIndex = $pos.index();
  let startPos = $pos.start() + start.offset;
  let endIndex = startIndex + 1;
  let endPos = startPos + start.node.nodeSize;

  while (startIndex > 0 && link.isInSet($pos.parent.child(startIndex - 1).marks)) {
    startIndex -= 1;
    startPos -= $pos.parent.child(startIndex).nodeSize;
  }

  while (endIndex < $pos.parent.childCount && link.isInSet($pos.parent.child(endIndex).marks)) {
    endPos += $pos.parent.child(endIndex).nodeSize;
    endIndex += 1;
  }

  return { from: startPos, to: endPos };
}

export function getSelectionMarkRange(selection: Selection, markType: MarkType): { from: number; to: number } {
  let range: { from: number; to: number };
  if (selection.empty) {
    range = getMarkRange(selection.$head, markType) as { from: number; to: number };
  } else {
    range = { from: selection.from, to: selection.to };
  }
  return range;
}

// see https://discuss.prosemirror.net/t/input-rules-for-wrapping-marks/537/11
// NOTE: may need to add an offset to the deletion, etc. to accomodate rules that need
// to do an exclusion of prefix characters (e.g. em wants to exclude a * before it's * 
// so it doesn't get mistaken for strong). The offset might be computable 
// automatically though (investigate). In this code the offset would be added in
// these 2 lines:
//    tr.delete(start + offset, textStart)
//    end = start + offset + match[1].length;
//

export function delimiterMarkInputRule(delim: string, markType: MarkType) {
  const regex = `(?:${delim})([^${delim}]+)(?:${delim})$`;
  return markInputRule(new RegExp(regex), markType);
}



export function markInputRule(regexp: RegExp, markType: MarkType, getAttrs?: ((match: string[]) => object) | object) {
  return new InputRule(regexp, (state: EditorState, match: string[], start: number, end: number) => {
    const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;
    const tr = state.tr;
    if (match[1]) {
      const textStart = start + match[0].indexOf(match[1]);
      const textEnd = textStart + match[1].length;
      if (textEnd < end) { 
        tr.delete(textEnd, end);
      }
      if (textStart > start) {
        tr.delete(start, textStart);
      }
      end = start + match[1].length;
    }
    tr.addMark(start, end, markType.create(attrs));
    tr.removeStoredMark(markType); // Do not continue with mark.
    return tr;
  });
}