import { wrappingInputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, NodeType, Schema, Slice } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, NodeView, DecorationSet, Decoration } from 'prosemirror-view';
import { findParentNodeOfType } from 'prosemirror-utils';

import { toggleList, NodeCommand, Command } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { EditorUI, OrderedListProps, OrderedListEditResult } from 'api/ui';
import { findChildrenByType } from 'prosemirror-utils';


const LIST_ATTRIBS = 0;
const LIST_CHILDREN = 1;

const LIST_ATTRIB_ORDER = 0;
const LIST_ATTRIB_NUMBER_STYLE = 1;
const LIST_ATTRIB_NUMBER_DELIM = 2;

enum ListNumberStyle {
  DefaultStyle = 'DefaultStyle',
  Decimal = 'Decimal',
  LowerRoman = 'LowerRoman',
  UpperRoman = 'UpperRoman',
  LowerAlpha = 'LowerAlpha',
  UpperAlpha = 'UpperAlpha',
}

enum ListNumberDelim {
  DefaultDelim = 'DefaultDelim',
  Period = 'Period',
  OneParen = 'OneParen',
  TwoParens = 'TwoParens',
}

const plugin = new PluginKey('list_item');

const extension: Extension = {
  nodes: [
    {
      name: 'list_item',
      spec: {
        content: 'paragraph block*',
        attrs: { tight: { default: false } },
        defining: true,
        parseDOM: [
          { tag: 'li', getAttrs: (dom: Node | string) => ({ tight: (dom as Element).hasAttribute('data-tight') }) },
        ],
        toDOM(node) {
          if (node.attrs.tight) {
            return ['li', { 'data-tight': 'true' }, 0];
          } else {
            return ['li', 0];
          }
        },
      },
      pandoc: {
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          const itemBlockType = node.attrs.tight ? 'Plain' : 'Para';
          output.writeList(() => {
            node.forEach((itemNode: ProsemirrorNode) => {
              output.writeToken(itemBlockType, () => {
                output.writeInlines(itemNode.content);
              });
            });
          });
        },
      },
    },
    {
      name: 'bullet_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        parseDOM: [{ tag: 'ul' }],
        toDOM() {
          return ['ul', 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'BulletList',
            list: 'bullet_list',
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('BulletList', () => {
            output.writeBlocks(node);
          });
        },
      },
    },
    {
      name: 'ordered_list',
      spec: {
        content: 'list_item+',
        group: 'block',
        attrs: {
          order: { default: 1 },
          number_style: { default: ListNumberStyle.Decimal },
          number_delim: { default: ListNumberDelim.Period },
        },
        parseDOM: [
          {
            tag: 'ol',
            getAttrs(dom: Node | string) {
              const el = dom as Element;

              let order: string | number | null = el.getAttribute('start');
              if (!order) {
                order = 1;
              }

              const numberStyle = typeToNumberStyle(el.getAttribute('type'));
              return { order, numberStyle };
            },
          },
        ],
        toDOM(node) {
          const attrs: { [key: string]: string } = {};
          if (node.attrs.order !== 1) {
            attrs.start = node.attrs.order;
          }
          const type = numberStyleToType(node.attrs.number_style);
          if (type) {
            attrs.type = type;
          }
          return ['ol', attrs, 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'OrderedList',
            list: 'ordered_list',
            getAttrs: (tok: PandocToken) => {
              const attribs = tok.c[LIST_ATTRIBS];
              return {
                order: attribs[LIST_ATTRIB_ORDER],
                number_style: attribs[LIST_ATTRIB_NUMBER_STYLE].t,
                number_delim: attribs[LIST_ATTRIB_NUMBER_DELIM].t,
              };
            },
            getChildren: (tok: PandocToken) => tok.c[LIST_CHILDREN],
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeToken('OrderedList', () => {
            output.writeList(() => {
              output.write(node.attrs.order);
              output.writeToken(node.attrs.number_style);
              output.writeToken(node.attrs.number_delim);
            });
            output.writeList(() => {
              output.writeBlocks(node);
            });
          });
        },
      },
    },
  ],

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        props: {
          decorations: checkedListItemDecorations(schema)
        },
      }),
    ];
  },

  keymap: (schema: Schema) => {
    return {
      'Shift-Ctrl-8': wrapInList(schema.nodes.bullet_list),
      'Shift-Ctrl-9': wrapInList(schema.nodes.ordered_list),
      Enter: splitListItem(schema.nodes.list_item),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item),
    };
  },

  commands: (schema: Schema, ui: EditorUI) => {
    return [
      new ListCommand('bullet_list', schema.nodes.bullet_list, schema.nodes.list_item),
      new ListCommand('ordered_list', schema.nodes.ordered_list, schema.nodes.list_item),
      new OrderedListEditCommand(schema, ui),
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

function checkedListItemDecorations(schema: Schema) {
  return (state: EditorState) => {

    // decorations
    const decorations: Decoration[] = [];

    // find all list items
    const listItems = findChildrenByType(state.doc, schema.nodes.list_item);
    listItems.forEach(nodeWithPos => {
      const item = nodeWithPos.node;
      if (nodeWithPos.node.nodeSize >= 2) {
        const firstChar = item.textBetween(1, 2);
        if (firstChar === '☐' || firstChar === '☒') {
          const checked = firstChar === '☒';
          decorations.push(Decoration.widget(nodeWithPos.pos+2, 
            (view, getPos: () => number) => {
              const input = window.document.createElement("input");
              input.setAttribute('type', 'checkbox');
              input.checked = checked;
              input.addEventListener("change", (ev: Event) => {
                const pos = getPos();
                const tr = view.state.tr;
                const char = checked ? '☐' : '☒' ;
                tr.replaceRangeWith(pos, pos+1, schema.text(char));
                view.dispatch(tr);
              });
              return input;
            }));
        }
      }
    });

    return DecorationSet.create(state.doc, decorations);
  };
}

class ListCommand extends NodeCommand {
  constructor(name: string, listType: NodeType, listItemType: NodeType) {
    super(name, null, listType, {}, toggleList(listType, listItemType));
  }
}

class OrderedListEditCommand extends Command {
  constructor(schema: Schema, ui: EditorUI) {
    super(
      'ordered_list_edit',
      null,
      (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
        // see if a parent node is an ordered list
        let node: ProsemirrorNode | null = null;
        let pos: number = 0;
        const nodeWithPos = findParentNodeOfType(schema.nodes.ordered_list)(state.selection);
        if (nodeWithPos) {
          node = nodeWithPos.node;
          pos = nodeWithPos.pos;
        }

        // return false (disabled) for no targets
        if (!node) {
          return false;
        }

        // execute command when requested
        if (dispatch) {
          editOrderedList(node as ProsemirrorNode, pos, state, dispatch, ui).then(() => {
            if (view) {
              view.focus();
            }
          });
        }

        return true;
      },
    );
  }
}

function editOrderedList(
  node: ProsemirrorNode,
  pos: number,
  state: EditorState,
  dispatch: (tr: Transaction<any>) => void,
  ui: EditorUI,
): Promise<void> {
  const attrs = node.attrs;
  return ui.editOrderedList({ ...attrs } as OrderedListProps).then((result: OrderedListEditResult | null) => {
    if (result) {
      const tr = state.tr;
      tr.setNodeMarkup(pos, node.type, {
        ...attrs,
        ...result,
      });
      dispatch(tr);
    }
  });
}

function numberStyleToType(style: ListNumberStyle): string | null {
  switch (style) {
    case ListNumberStyle.DefaultStyle:
    case ListNumberStyle.Decimal:
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
