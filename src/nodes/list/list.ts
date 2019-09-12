import { wrappingInputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { Extension } from 'api/extension';
import { EditorUI } from 'api/ui';

import { ListCommand, TightListCommand, OrderedListEditCommand } from './list-commands';

import {
  ListItemNodeView,
  checkedListItemDecorations,
  checkedListItemInputRule,
  checkedListInputRule,
  CheckedListItemCommand,
  CheckedListItemToggleCommand,
} from './list-checked';

import { exampleListsAppendTransaction } from './list-example';

import {
  pandocWriteListItem,
  pandocWriteBulletList,
  pandocOrderedListReader,
  pandocWriteOrderedList,
} from './list-pandoc';

export enum ListNumberStyle {
  DefaultStyle = 'DefaultStyle',
  Decimal = 'Decimal',
  LowerRoman = 'LowerRoman',
  UpperRoman = 'UpperRoman',
  LowerAlpha = 'LowerAlpha',
  UpperAlpha = 'UpperAlpha',
  Example = 'Example',
}

export enum ListNumberDelim {
  DefaultDelim = 'DefaultDelim',
  Period = 'Period',
  OneParen = 'OneParen',
  TwoParens = 'TwoParens',
}

const plugin = new PluginKey('list');

const extension: Extension = {
  nodes: [
    {
      name: 'list_item',
      spec: {
        content: 'paragraph block*',
        attrs: {
          checked: { default: null },
        },
        defining: true,
        parseDOM: [
          {
            tag: 'li',
            getAttrs: (dom: Node | string) => {
              const el = dom as Element;
              const attrs: any = {};
              if (el.hasAttribute('data-checked')) {
                attrs.checked = el.getAttribute('data-checked') === 'true';
              }
              return attrs;
            },
          },
        ],
        toDOM(node) {
          const attrs: any = {};
          if (node.attrs.checked !== null) {
            attrs['data-checked'] = node.attrs.checked ? 'true' : 'false';
          }
          return ['li', attrs, 0];
        },
      },
      pandoc: {
        writer: pandocWriteListItem,
      },
    },
    {
      name: 'bullet_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        attrs: {
          tight: { default: true },
        },
        parseDOM: [
          { 
            tag: 'ul',
            getAttrs: (dom: Node | string) => {
              const el = dom as Element;
              const attrs: any = {};
              if (el.hasAttribute('data-tight')) {
                attrs.tight = true;
              }
              return attrs;
            }
          }
        ],
        toDOM(node) {
          const attrs: { [key: string]: string } = {};
          if (node.attrs.tight) {
            attrs['data-tight'] = 'true';
          }
          return ['ul', attrs, 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'BulletList',
            list: 'bullet_list',
          },
        ],
        writer: pandocWriteBulletList,
      },
    },
    {
      name: 'ordered_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        attrs: {
          tight: { default: true },
          order: { default: 1 },
          number_style: { default: ListNumberStyle.Decimal },
          number_delim: { default: ListNumberDelim.Period },
        },
        parseDOM: [
          {
            tag: 'ol',
            getAttrs(dom: Node | string) {
              const el = dom as Element;

              const tight = el.hasAttribute('data-tight');

              let order: string | number | null = el.getAttribute('start');
              if (!order) {
                order = 1;
              }

              const numberStyle = el.getAttribute('data-example')
                ? ListNumberStyle.Example
                : typeToNumberStyle(el.getAttribute('type'));

              return { tight, order, numberStyle };
            },
          },
        ],
        toDOM(node) {
          const attrs: { [key: string]: string } = {};
          if (node.attrs.tight) {
            attrs['data-tight'] = 'true';
          }
          if (node.attrs.order !== 1) {
            attrs.start = node.attrs.order;
          }
          const type = numberStyleToType(node.attrs.number_style);
          if (type) {
            attrs.type = type;
          }
          if (attrs.number_style === ListNumberStyle.Example) {
            attrs['data-example'] = '1';
          }
          return ['ol', attrs, 0];
        },
      },
      pandoc: {
        readers: [pandocOrderedListReader],
        writer: pandocWriteOrderedList,
      },
    },
  ],

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        props: {
          decorations: checkedListItemDecorations(schema),
          nodeViews: {
            list_item(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
              return new ListItemNodeView(node, view, getPos);
            },
          },
        },
        appendTransaction: exampleListsAppendTransaction(schema),
      }),
    ];
  },

  keymap: (schema: Schema) => {
    return {
      'Shift-Ctrl-8': wrapInList(schema.nodes.bullet_list),
      'Shift-Ctrl-9': wrapInList(schema.nodes.ordered_list),
      Enter: splitListItem(schema.nodes.list_item),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Shift-Tab': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item),
      Tab: sinkListItem(schema.nodes.list_item),
    };
  },

  commands: (schema: Schema, ui: EditorUI) => {
    return [
      new ListCommand('bullet_list', schema.nodes.bullet_list, schema.nodes.list_item),
      new ListCommand('ordered_list', schema.nodes.ordered_list, schema.nodes.list_item),
      new OrderedListEditCommand(schema, ui),
      new TightListCommand(schema),
      new CheckedListItemCommand(schema.nodes.list_item),
      new CheckedListItemToggleCommand(schema.nodes.list_item),
    ];
  },

  inputRules: (schema: Schema) => {
    return [
      wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),
      wrappingInputRule(
        /^(\d+)\.\s$/,
        schema.nodes.ordered_list,
        match => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1],
      ),
      checkedListInputRule(schema),
      checkedListItemInputRule(schema),
    ];
  },
};

function numberStyleToType(style: ListNumberStyle): string | null {
  switch (style) {
    case ListNumberStyle.DefaultStyle:
    case ListNumberStyle.Decimal:
    case ListNumberStyle.Example:
      return 'l';
    case ListNumberStyle.LowerAlpha:
      return 'a';
    case ListNumberStyle.UpperAlpha:
      return 'A';
    case ListNumberStyle.LowerRoman:
      return 'i';
    case ListNumberStyle.UpperRoman:
      return 'I';
    default:
      return null;
  }
}

function typeToNumberStyle(type: string | null): ListNumberStyle {
  switch (type) {
    case 'l':
      return ListNumberStyle.Decimal;
    case 'a':
      return ListNumberStyle.LowerAlpha;
    case 'A':
      return ListNumberStyle.UpperAlpha;
    case 'i':
      return ListNumberStyle.LowerRoman;
    case 'I':
      return ListNumberStyle.UpperRoman;
    default:
      return ListNumberStyle.Decimal;
  }
}

export default extension;
