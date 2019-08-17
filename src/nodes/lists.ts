import { wrappingInputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';

import { toggleList, NodeCommand } from 'api/command';
import { Extension } from 'api/extension';
import { PandocSerializer, PandocToken } from 'api/pandoc';

const LIST_ORDER = 0;
const LIST_CHILDREN = 1;
const LIST_ATTRIB_ORDER = 0;

const ORDER_START = 0;

class ListCommand extends NodeCommand {
  constructor(name: string, listType: NodeType, listItemType: NodeType) {
    super(name, null, listType, {}, toggleList(listType, listItemType));
  }
}

const extension: Extension = {
  nodes: [
    {
      name: 'list_item',
      spec: {
        content: 'paragraph block*',
        defining: true,
        parseDOM: [{ tag: 'li' }],
        toDOM() {
          return ['li', 0];
        },
      },
      pandoc: {
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode, parent: ProsemirrorNode) => {
          const itemBlockType = parent.attrs.tight ? 'Plain' : 'Para';
          pandoc.renderList(() => {
            node.forEach((itemNode: ProsemirrorNode) => {
              pandoc.renderToken(itemBlockType, () => {
                pandoc.renderInlines(itemNode);
              });
            });
          });
        }
      },
    },
    {
      name: 'bullet_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        attrs: { tight: { default: false } },
        parseDOM: [
          { tag: 'ul', getAttrs: (dom: Node | string) => ({ tight: (dom as Element).hasAttribute('data-tight') }) },
        ],
        toDOM(node) {
          if (node.attrs.tight) {
            return ['ul', { 'data-tight': 'true' }, 0];
          } else {
            return ['ul', 0];
          }
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'BulletList',
            list: 'bullet_list',
          },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderToken('BulletList', () => {
            pandoc.renderBlocks(node);
          });
        }
      },
    },
    {
      name: 'ordered_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        attrs: { order: { default: 1 }, tight: { default: false } },
        parseDOM: [
          {
            tag: 'ol',
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              let order: string | number | null = el.getAttribute('start');
              if (!order) {
                order = 1;
              }
              return { order, tight: el.hasAttribute('data-tight') };
            },
          },
        ],
        toDOM(node) {
          const attrs: { [key: string]: string } = {};
          if (node.attrs.order !== 1) {
            attrs.start = node.attrs.order;
          }
          if (node.attrs.tight) {
            attrs['data-tight'] = 'true';
          }
          return ['ol', attrs, 0];
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'OrderedList',
            list: 'ordered_list',
            getAttrs: (tok: PandocToken) => ({
              order: tok.c[LIST_ORDER][ORDER_START],
            }),
            getChildren: (tok: PandocToken) => tok.c[LIST_CHILDREN],
          },
        ],
        ast_writer: (pandoc: PandocSerializer, node: ProsemirrorNode) => {
          pandoc.renderToken('OrderedList', () => {
            pandoc.renderList(() => {
              pandoc.render(node.attrs.order);
              pandoc.renderToken('Decimal');
              pandoc.renderToken('Period');
            });
            pandoc.renderList(() => {
              pandoc.renderBlocks(node);
            });
          });
        },
      },
    },
  ],

  keymap: (schema: Schema) => {
    return {
      'Shift-Ctrl-8': wrapInList(schema.nodes.bullet_list),
      'Shift-Ctrl-9': wrapInList(schema.nodes.ordered_list),
      Enter: splitListItem(schema.nodes.list_item),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item),
    };
  },

  commands: (schema: Schema) => {
    return [
      new ListCommand('bullet_list', schema.nodes.bullet_list, schema.nodes.list_item),
      new ListCommand('ordered_list', schema.nodes.ordered_list, schema.nodes.list_item),
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
    ];
  },
};

export default extension;
