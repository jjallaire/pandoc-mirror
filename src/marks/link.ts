import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Fragment, Mark, MarkType, Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Command } from 'api/command';
import { Extension } from 'api/extension';
import { getMarkAttrs, getMarkRange, markIsActive } from 'api/mark';
import { PandocAstToken } from 'api/pandoc';
import { 
  pandocAttrSpec, 
  pandocAttrParseDOM, 
  pandocAttrToDOM, 
  pandocAttrMarkdown, 
  pandocAttrReadAST, 
  pandocAttrAvailable
} from "api/pandoc_attr";
import { EditorUI, LinkEditorFn, LinkEditResult, LinkProps } from 'api/ui';

const TARGET_URL = 0;
const TARGET_TITLE = 1;

const LINK_ATTR = 0;
const LINK_CHILDREN = 1;
const LINK_TARGET = 2;

const extension: Extension = {
  marks: [
    {
      name: 'link',
      spec: {
        attrs: {
          href: {},
          title: { default: null },
          ...pandocAttrSpec
        },
        inclusive: false,
        parseDOM: [
          {
            tag: 'a[href]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return { 
                href: el.getAttribute('href'), 
                title: el.getAttribute('title'),
                ...pandocAttrParseDOM(el)
              };
            },
          },
        ],
        toDOM(mark: Mark) {
          return ['a', {
            ...mark.attrs,
            ...pandocAttrToDOM(mark.attrs)
          }];
        },
      },
      pandoc: {
        ast_reader: [
          {
            token: 'Link',
            mark: 'link',
            getAttrs: (tok: PandocAstToken) => {
              const target = tok.c[LINK_TARGET];
              return {
                href: target[TARGET_URL],
                title: target[TARGET_TITLE] || null,
                ...pandocAttrReadAST(tok, LINK_ATTR)
              };
            },
            getChildren: (tok: PandocAstToken) => tok.c[LINK_CHILDREN],
          },
        ],
        markdown_writer: {
          open(_state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
            return isPlainURL(mark, parent, index, 1) ? '<' : '[';
          },
          close(state: MarkdownSerializerState, mark: Mark, parent: Fragment, index: number) {
            let link = isPlainURL(mark, parent, index, -1)
              ? '>'
              : '](' +
                  state.esc(mark.attrs.href) +
                  (mark.attrs.title
                    ? ' ' + (state as any).quote(mark.attrs.title) // quote function not declared in @types
                    : '') +
                  ')';

            if (pandocAttrAvailable(mark.attrs)) {
              link = link.concat(pandocAttrMarkdown(state, mark.attrs));
            }
            return link;
          },
        },
      },
    },
  ],

  commands: (schema: Schema, ui: EditorUI) => {
    return [new Command('link', ['Shift-Mod-k', 'Shift-Mod-Z'], linkCommand(schema.marks.link, ui.onEditLink))];
  },
};

function linkCommand(markType: MarkType, onEditLink: LinkEditorFn) {
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
      onEditLink(link as LinkProps).then((result: LinkEditResult | null) => {
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

function isPlainURL(link: Mark, parent: Fragment, index: number, side: -1 | 1) {
  if (link.attrs.title || pandocAttrAvailable(link.attrs)) {
    return false;
  }
  const content = parent.child(index + (side < 0 ? -1 : 0));
  if (!content.isText || content.text !== link.attrs.href || content.marks[content.marks.length - 1] !== link) {
    return false;
  }
  if (index === (side < 0 ? 1 : parent.childCount - 1)) {
    return true;
  }
  const next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

export default extension;
