import { EditorState, Transaction, NodeSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { findParentNode, ContentNodeWithPos } from 'prosemirror-utils';
import { Node as ProsemirrorNode, Mark, MarkType } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { Command } from 'api/command';
import { EditorUI, AttrEditResult } from 'api/ui';
import { Schema } from 'prosemirror-model';
import { pandocAttrInSpec } from 'api/pandoc_attr';
import { getSelectionMarkRange } from 'api/mark';

class AttrEditCommand extends Command {
  constructor(ui: EditorUI) {
    super('attr_edit', null, (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
      // see if there is an active mark with attrs or a parent node with attrs
      const marks = state.storedMarks || state.selection.$head.marks();
      const mark = marks.find((m: Mark) => pandocAttrInSpec(m.type.spec));

      let node: ProsemirrorNode | null = null;
      let pos: number = 0;
      if (state.selection instanceof NodeSelection && pandocAttrInSpec(state.selection.node.type.spec)) {
        node = state.selection.node;
        pos = state.selection.$anchor.pos;
      } else {
        const nodeWithPos = findParentNode((n: ProsemirrorNode) => pandocAttrInSpec(n.type.spec))(state.selection);
        if (nodeWithPos) {
          node = nodeWithPos.node;
          pos = nodeWithPos.pos;
        }
      }

      // return false (disabled) for no targets
      if (!mark && !node) {
        return false;
      }

      // execute command when requested
      if (dispatch) {
        const editPromise: Promise<void> = mark
          ? editMarkAttrs(mark, state, dispatch, ui)
          : editNodeAttrs(node as ProsemirrorNode, pos, state, dispatch, ui);

        editPromise.then(() => {
          if (view) {
            view.focus();
          }
        });
      }

      return true;
    });
  }
}

function editMarkAttrs(
  mark: Mark,
  state: EditorState,
  dispatch: (tr: Transaction<any>) => void,
  ui: EditorUI,
): Promise<void> {
  const attrs = mark.attrs;
  const markType = mark.type;
  return ui.onEditAttr(attrs).then((result: AttrEditResult | null) => {
    if (result) {
      const tr = state.tr;
      const range = getSelectionMarkRange(state.selection, markType);
      tr.removeMark(range.from, range.to, markType);
      tr.addMark(
        range.from,
        range.to,
        markType.create({
          ...attrs,
          ...result,
        }),
      );
      dispatch(tr);
    }
  });
}

function editNodeAttrs(
  node: ProsemirrorNode,
  pos: number,
  state: EditorState,
  dispatch: (tr: Transaction<any>) => void,
  ui: EditorUI,
): Promise<void> {
  const attrs = node.attrs;
  return ui.onEditAttr(attrs).then((result: AttrEditResult | null) => {
    if (result) {
      dispatch(
        state.tr.setNodeMarkup(pos, node.type, {
          ...attrs,
          ...result,
        }),
      );
    }
  });
}

const extension: Extension = {
  commands: (_schema: Schema, ui: EditorUI) => {
    return [new AttrEditCommand(ui)];
  },
};

export default extension;
