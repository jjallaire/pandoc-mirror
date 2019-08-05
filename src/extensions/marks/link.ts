import { Schema, MarkType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { IExtension, Command, IEditorUI, ILinkEditor, ILinkEditResult, ILinkProps, IPandocToken } from '../api';
import { markIsActive, getMarkAttrs, getMarkRange } from '../../utils/mark';

const TARGET_URL = 0;
const TARGET_TITLE = 1;
const LINK_CHILDREN = 1;
const LINK_TARGET = 2;

const extension: IExtension = {
  marks: [
    {
      name: 'link',
      spec: {
        attrs: {
          href: {},
          title: { default: null },
        },
        inclusive: false,
        parseDOM: [
          {
            tag: 'a[href]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return { href: el.getAttribute('href'), title: el.getAttribute('title') };
            },
          },
        ],
        toDOM(node) {
          return ['a', node.attrs];
        },
      },
      pandoc: {
        from: {
          token: 'Link',
          mark: 'link',
          getAttrs: (tok : IPandocToken) => {
            const target = tok.c[LINK_TARGET];
            return {
              href: target[TARGET_URL],
              title: target[TARGET_TITLE] || null,
            };
          },
          getChildren: tok => tok.c[LINK_CHILDREN],
        },
        to: {},
      },
    },
  ],

  commands: (schema: Schema, ui: IEditorUI) => {
    return [new Command('link', ['Shift-Mod-k', 'Shift-Mod-Z'], linkCommand(schema.marks.link, ui.onEditLink))];
  },
};

function linkCommand(markType: MarkType, onEditLink: ILinkEditor) {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    // if there is no contiguous selection and no existing link mark active
    // then the command should be disabled (unknown what the link target is)
    if (!markIsActive(state, markType) && state.selection.empty) {
      return false;
    }

    if (dispatch) {
      // get link attributes if we have them
      let link: { [key: string]: any } = {};
      if (markIsActive(state, markType)) {
        link = getMarkAttrs(state, markType);
      }

      // show edit ui
      onEditLink(link as ILinkProps).then((result: ILinkEditResult | null) => {
        if (result) {
          // determine the range we will edit (if the selection is empty
          // then expand from the cursor to discover the mark range,
          // otherwise just use the selection itself)
          interface IRange {
            from: number;
            to: number;
          }
          let range: IRange | null = null;
          if (state.selection.empty) {
            range = getMarkRange(state.selection.$head, markType) as IRange;
          } else {
            range = { from: state.selection.from, to: state.selection.to };
          }

          const tr = state.tr;
          tr.removeMark(range.from, range.to, markType);
          if (result.action === 'edit') {
            tr.addMark(range.from, range.to, markType.create(result.link));
          } 
          dispatch(tr);
        }

        if (view) {
          view.focus();
        }
      });
    }

    return true;
  };
}

export default extension;
