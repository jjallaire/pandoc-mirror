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

export function delimiterMarkInputRule(delim: string, markType: MarkType, prefixMask?: string) {
  // if there is no prefix mask then this is simple regex we can pass to markInputRule
  if (!prefixMask) {
    const regexp = `(?:${delim})([^${delim}]+)(?:${delim})$`;
    return markInputRule(new RegExp(regexp), markType);

    // otherwise we need custom logic to get mark placement/eliding right
  } else {
    // validate that delim and mask are single characters (our logic for computing offsets
    // below depends on this assumption)
    const validateParam = (name: string, value: string) => {
      // validate mask
      function throwError() {
        throw new Error(`${name} must be a single characater`);
      }
      if (value.startsWith('\\')) {
        if (value.length !== 2) {
          throwError();
        }
      } else if (value.length !== 1) {
        throwError();
      }
    };
    validateParam('delim', delim);
    validateParam('mask', prefixMask);

    // build regex (this regex assumes that mask is one character)
    const regexp = `(?:^|[^${prefixMask}])(?:${delim})([^${delim}]+)(?:${delim})$`;

    // return rule
    return new InputRule(new RegExp(regexp), (state: EditorState, match: string[], start: number, end: number) => {
      // init transaction
      const tr = state.tr;

      // compute offset for mask (should be zero if this was the beginning of a line,
      // in all other cases it would be 1). note we depend on the delimiter being
      // of size 1 here (this is enforced above)
      const kDelimSize = 1;
      const maskOffset = match[0].length - match[1].length - kDelimSize * 2;

      // position of text to be formatted
      const textStart = start + match[0].indexOf(match[1]);
      const textEnd = textStart + match[1].length;

      // remove trailing markdown
      tr.delete(textEnd, end);

      // update start/end to reflect the leading mask which we want to leave alone
      start = start + maskOffset;
      end = start + match[1].length;

      // remove leading markdown
      tr.delete(start, textStart);

      // add mark
      tr.addMark(start, end, markType.create());

      // remove stored mark so typing continues w/o the mark
      tr.removeStoredMark(markType);

      // return transaction
      return tr;
    });
  }
}
