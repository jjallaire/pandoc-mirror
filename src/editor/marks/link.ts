import { Fragment, Mark, MarkType, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Command } from 'editor/api/command';
import { Extension } from 'editor/api/extension';
import { getMarkAttrs, markIsActive, getSelectionMarkRange, markInputRule } from 'editor/api/mark';
import { PandocToken, PandocOutput } from 'editor/api/pandoc';
import { pandocAttrSpec, pandocAttrParseDom, pandocAttrToDomAttr, pandocAttrReadAST } from 'editor/api/pandoc_attr';
import { EditorUI, LinkEditorFn, LinkEditResult, LinkProps } from 'editor/api/ui';

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
          ...pandocAttrSpec,
        },
        inclusive: false,
        parseDOM: [
          {
            tag: 'a[href]',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              const attrs: { [key: string]: string | null } = {
                href: el.getAttribute('href'),
                title: el.getAttribute('title'),
              };
              return {
                ...attrs,
                ...pandocAttrParseDom(el, attrs),
              };
            },
          },
        ],
        toDOM(mark: Mark) {
          return [
            'a',
            {
              href: mark.attrs.href,
              title: mark.attrs.title,
              ...pandocAttrToDomAttr(mark.attrs),
            },
          ];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Link',
            mark: 'link',
            getAttrs: (tok: PandocToken) => {
              const target = tok.c[LINK_TARGET];
              return {
                href: target[TARGET_URL],
                title: target[TARGET_TITLE] || null,
                ...pandocAttrReadAST(tok, LINK_ATTR),
              };
            },
            getChildren: (tok: PandocToken) => tok.c[LINK_CHILDREN],
          },
        ],

        writer: {
          priority: 15,
          write: (output: PandocOutput, mark: Mark, parent: Fragment) => {
            output.writeToken('Link', () => {
              output.writeAttr(mark.attrs.id, mark.attrs.classes, mark.attrs.keyvalue);
              output.writeArray(() => {
                output.writeInlines(parent);
              });
              output.write([mark.attrs.href || '', mark.attrs.title || '']);
            });
          },
        },
      },
    },
  ],

  commands: (schema: Schema, ui: EditorUI) => {
    return [new Command('link', ['Shift-Mod-k'], linkCommand(schema.marks.link, ui.editLink))];
  },

  inputRules: (schema: Schema) => {
    return [
      markInputRule(/(?:<)([a-z]+:\/\/[^>]+)(?:>)$/, schema.marks.link, (match: string[]) => ({ href: match[1] })),
      markInputRule(/(?:\[)([^\]]+)(?:\]\()([^\)]+)(?:\))$/, schema.marks.link, (match: string[]) => ({
        href: match[2],
      })),
    ];
  },
};

function linkCommand(markType: MarkType, onEditLink: LinkEditorFn) {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    // if there is no contiguous selection and no existing link mark active
    // then the command should be disabled (unknown what the link target is)
    if (!markIsActive(state, markType) && state.selection.empty) {
      return false;
    }

    // if the current node doesn't allow this mark return false
    if (!state.selection.$from.node().type.allowsMarkType(markType)) {
      return false;
    }

    if (dispatch) {
      // get link attributes if we have them
      let link: { [key: string]: any } = {};
      if (markIsActive(state, markType)) {
        link = getMarkAttrs(state, markType);
      }

      // show edit ui
      onEditLink({ ...link } as LinkProps).then((result: LinkEditResult | null) => {
        if (result) {
          // determine the range we will edit
          const range = getSelectionMarkRange(state.selection, markType);
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
