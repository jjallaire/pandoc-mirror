import { wrappingInputRule, InputRule } from 'prosemirror-inputrules';
import { Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state';
import { EditorView, DecorationSet, Decoration } from 'prosemirror-view';
import { findParentNodeOfType, findParentNodeOfTypeClosestToPos, NodeWithPos } from 'prosemirror-utils';

import { toggleList, NodeCommand, Command } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { EditorUI, OrderedListProps, OrderedListEditResult } from 'api/ui';
import { findChildrenByType } from 'prosemirror-utils';
import { nodeDecoration } from 'api/decoration';
import { transactionsHaveChange } from 'api/transaction';


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
        attrs: { 
          tight: { default: false } }
        ,
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
        appendTransaction: checkedListItemAppendTransaction(schema),
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
      checkedListInputRule(schema),
      checkedListItemInputRule(schema)
    ];
  },
};

const kChecked = '☒';
const kUnchecked = '☐';

enum ListItemCheckedStatus {
  None,
  Checked,
  Unchecked
}

function listItemCheckedStatus(nodeWithPos: NodeWithPos) {
  const item = nodeWithPos.node;
  if (item.nodeSize >= 2) {
    const firstChar = item.textBetween(1, 2);
    switch(firstChar) {
      case kChecked:
        return ListItemCheckedStatus.Checked;
      case kUnchecked:
        return ListItemCheckedStatus.Unchecked;
      default:
        return ListItemCheckedStatus.None;
    }
  } else {
    return ListItemCheckedStatus.None;
  }
}

function checkedListItemAppendTransaction(schema: Schema) {

  const checkboxRegex = new RegExp(`[${kChecked}${kUnchecked}]`);
  const checkboxChange = (node: ProsemirrorNode) => node.isText && checkboxRegex.test(node.textContent);

  return (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {

    // if this was a mutating transaction (as opposed to a selection-only transaction)
    if (transactions.some(transaction => transaction.docChanged)) {
      
      // mask out removal of checkboxes (if we don't do this then removing the checkbox at the
      // beginning of a line isn't possible)
      if (transactionsHaveChange(transactions, oldState, newState, checkboxChange, "removed")) {
        return null;
      }

      // if the old state was a selection inside a checked list item
      const oldListItem = findParentNodeOfType(schema.nodes.list_item)(oldState.selection);
      if (oldListItem && listItemCheckedStatus(oldListItem) !== ListItemCheckedStatus.None) {

        // if the new state is at the beginning of a list item then insert a check box
        const newListItem = findParentNodeOfType(schema.nodes.list_item)(newState.selection);
        if (newListItem && (newListItem.pos + 2) === newState.selection.from) {
          const tr = newState.tr;
          tr.insertText(kUnchecked + ' ');
          return tr;
        }
      
      }
    }


  };
 
}


// Pandoc represents task lists by just inserting a '☒' or '☐' character at 
// the beginning of the list item. Here we define a node decorator that looks
// for list items w/ those characters at the beginning, then positions a 
// check box over that character. The check box then listens for change 
// events and creates a transaction to toggle the character underneath it.
function checkedListItemDecorations(schema: Schema) {
  
  
  
  return (state: EditorState) => {

    // decorations
    const decorations: Decoration[] = [];

    // find all list items
    const listItems = findChildrenByType(state.doc, schema.nodes.list_item);
    listItems.forEach(nodeWithPos => {
      const status = listItemCheckedStatus(nodeWithPos);
     
      if (status !== ListItemCheckedStatus.None) {
        
        // position a checkbox over the first character
        decorations.push(Decoration.widget(nodeWithPos.pos+2, 
          (view, getPos: () => number) => {
            const input = window.document.createElement("input");
            input.setAttribute('type', 'checkbox');
            input.checked = status === ListItemCheckedStatus.Checked;
            input.addEventListener("mousedown", (ev: Event) => {
              ev.preventDefault(); // don't steal focus
            });
            input.addEventListener("change", (ev: Event) => {
              const pos = getPos();
              const tr = view.state.tr;
              const char = input.checked ?  kChecked : kUnchecked;
              tr.replaceRangeWith(pos, pos+1, schema.text(char));
              view.dispatch(tr);
            });
            return input;
          }));
        // mark the item as a task item
        decorations.push(nodeDecoration(nodeWithPos, { class: 'task-item' }));
        // mark the parent list w/ css class indicating it's a task list
        const parentList = findParentNodeOfTypeClosestToPos(
          state.doc.resolve(nodeWithPos.pos), 
          schema.nodes.bullet_list
        );
        if (parentList) {
          decorations.push(nodeDecoration(parentList, { class: 'task-list' }));
        }
      }
      
    });

    return DecorationSet.create(state.doc, decorations);
  };
}



function insertCheckbox(tr: Transaction, match: string) {
 
  const checkText = match === 'x' ? kChecked : kUnchecked;
  tr.insertText(checkText + ' ');
  return tr;
}

function checkedListInputRule(schema: Schema) {

  // regex to match checked list at the beginning of a line
  const regex = /^\s*\[([ x])\]\s$/;

  // we are going to steal the handler from the base bullet list wrapping input rule
  const baseInputRule: any = wrappingInputRule(regex, schema.nodes.bullet_list);

  return new InputRule(regex, (state: EditorState, match: string[], start: number, end: number) => {

    // call the base handler to create the bullet list
    const tr = baseInputRule.handler(state, match, start, end);
    if (tr) {
      

      // insert the checkbox 
      return insertCheckbox(tr, match[1]);
    } else {
      return null;
    }
  });
}


function checkedListItemInputRule(schema: Schema) {
  return new InputRule(/\[([ x])\]\s$/, (state: EditorState, match: string[], start: number, end: number) => {

    if (findParentNodeOfType(schema.nodes.list_item)(state.selection)) {

      // delete entered text
      const tr = state.tr;
      tr.delete(start,end);

      // insert checkbox
      return insertCheckbox(tr, match[1]);

    } else {
      return null;
    }
  });
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
