import { Node as ProsemirrorNode, Schema, Fragment, NodeType } from 'prosemirror-model';
import { NodeView, EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import {
  findChildrenByType,
  findParentNodeOfTypeClosestToPos,
  findParentNodeOfType,
  NodeWithPos,
} from 'prosemirror-utils';
import { InputRule, wrappingInputRule } from 'prosemirror-inputrules';

import { nodeDecoration } from 'api/decoration';
import { Command } from 'api/command';

const kItemChecked = '☒';
const kItemUnchecked = '☐';

// custom NodeView that accomodates display / interaction with item check boxes
export class ListItemNodeView implements NodeView {
  public readonly dom: HTMLElement;
  public readonly contentDOM: HTMLElement;

  private readonly node: ProsemirrorNode;
  private readonly view: EditorView;
  private readonly getPos: () => number;

  constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // create root li element
    this.dom = window.document.createElement('li');
    if (node.attrs.tight) {
      this.dom.setAttribute('data-tight', 'true');
    }

    const container = window.document.createElement('div');
    container.classList.add('list-item-container');
    this.dom.appendChild(container);

    // add checkbox for checked items
    if (node.attrs.checked !== null) {
      this.dom.setAttribute('data-checked', node.attrs.checked ? 'true' : 'false');

      // checkbox for editing checked state
      const input = window.document.createElement('input');
      input.classList.add('list-item-checkbox');
      input.setAttribute('type', 'checkbox');
      input.checked = node.attrs.checked;
      input.contentEditable = 'false';
      input.disabled = !(view as any).editable;
      input.addEventListener('mousedown', (ev: Event) => {
        ev.preventDefault(); // don't steal focus
      });
      input.addEventListener('change', (ev: Event) => {
        const tr = view.state.tr;
        tr.setNodeMarkup(getPos(), node.type, {
          ...node.attrs,
          checked: (ev.target as HTMLInputElement).checked,
        });
        view.dispatch(tr);
      });
      container.appendChild(input);
    }

    // content div
    const content = window.document.createElement('div');
    content.classList.add('list-item-content');
    this.contentDOM = content;
    container.appendChild(content);
  }
}

// provide css classes for checked list items and the lists that contain them
export function checkedListItemDecorations(schema: Schema) {
  return (state: EditorState) => {
    // decorations
    const decorations: Decoration[] = [];

    // find all list items
    const listItems = findChildrenByType(state.doc, schema.nodes.list_item);
    listItems.forEach(nodeWithPos => {
      if (nodeWithPos.node.attrs.checked !== null) {
        decorations.push(nodeDecoration(nodeWithPos, { class: 'task-item' }));
        // mark the parent list w/ css class indicating it's a task list
        const parentList = findParentNodeOfTypeClosestToPos(state.doc.resolve(nodeWithPos.pos), [
          schema.nodes.bullet_list,
          schema.nodes.ordered_list,
        ]);
        if (parentList) {
          decorations.push(nodeDecoration(parentList, { class: 'task-list' }));
        }
      }
    });

    return DecorationSet.create(state.doc, decorations);
  };
}

// command to toggle checked list items
export function checkedListItemCommandFn(itemType: NodeType) {
  return (state: EditorState, dispatch?: ((tr: Transaction) => void) | undefined) => {
    const itemNode = findParentNodeOfType(itemType)(state.selection);
    if (!itemNode) {
      return false;
    }

    if (dispatch) {
      const tr = state.tr;
      if (itemNode.node.attrs.checked !== null) {
        setItemChecked(tr, itemNode, null);
      } else {
        setItemChecked(tr, itemNode, false);
      }

      dispatch(tr);
    }

    return true;
  };
}

export function checkedListItemToggleCommandFn(itemType: NodeType) {
  return (state: EditorState, dispatch?: ((tr: Transaction) => void) | undefined) => {
    const itemNode = findParentNodeOfType(itemType)(state.selection);
    if (!itemNode || itemNode.node.attrs.checked === null) {
      return false;
    }

    if (dispatch) {
      const tr = state.tr;
      setItemChecked(tr, itemNode, !itemNode.node.attrs.checked);
      dispatch(tr);
    }

    return true;
  };
}

export class CheckedListItemCommand extends Command {
  constructor(itemType: NodeType) {
    super('list_item_check', null, checkedListItemCommandFn(itemType));
  }

  public isActive(state: EditorState): boolean {
    if (this.isEnabled(state)) {
      const itemNode = findParentNodeOfType(state.schema.nodes.list_item)(state.selection) as NodeWithPos;
      return itemNode.node.attrs.checked !== null;
    } else {
      return false;
    }
  }
}

export class CheckedListItemToggleCommand extends Command {
  constructor(itemType: NodeType) {
    super('list_item_check_toggle', null, checkedListItemToggleCommandFn(itemType));
  }
}

// allow users to type [x] or [ ] to define a checked list item
export function checkedListItemInputRule(schema: Schema) {
  return new InputRule(/\[([ x])\]\s$/, (state: EditorState, match: string[], start: number, end: number) => {
    const itemNode = findParentNodeOfType(schema.nodes.list_item)(state.selection);
    if (itemNode) {
      // create transaction
      const tr = state.tr;

      // set checked
      setItemChecked(tr, itemNode, match[1]);

      // delete entered text
      tr.delete(start, end);

      // return transaction
      return tr;
    } else {
      return null;
    }
  });
}

// allow users to begin a new checked list by typing [x] or [ ] at the beginning of a line
export function checkedListInputRule(schema: Schema) {
  // regex to match checked list at the beginning of a line
  const regex = /^\s*\[([ x])\]\s$/;

  // we are going to steal the handler from the base bullet list wrapping input rule
  const baseInputRule: any = wrappingInputRule(regex, schema.nodes.bullet_list);

  return new InputRule(regex, (state: EditorState, match: string[], start: number, end: number) => {
    // call the base handler to create the bullet list
    const tr = baseInputRule.handler(state, match, start, end);
    if (tr) {
      // set the checkbox
      const itemNode = findParentNodeOfType(schema.nodes.list_item)(tr.selection);
      if (itemNode) {
        setItemChecked(tr, itemNode, match[1]);
      }

      return tr;
    } else {
      return null;
    }
  });
}

function setItemChecked(tr: Transaction, itemNode: NodeWithPos, check: null | boolean | string) {
  tr.setNodeMarkup(itemNode.pos, itemNode.node.type, {
    ...itemNode.node.attrs,
    checked: check === null ? null : typeof check === 'string' ? check === 'x' : check,
  });
}

// prepend a check mark to the provided fragment
export function fragmentWithCheck(schema: Schema, fragment: Fragment, checked: boolean) {
  const checkedText = schema.text((checked ? kItemChecked : kItemUnchecked) + ' ');
  return Fragment.from(checkedText).append(fragment);
}
