
import { NodeType, Schema, Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { findParentNodeOfType, NodeWithPos } from "prosemirror-utils";

import { NodeCommand, toggleList, Command } from "api/command";
import { EditorUI, OrderedListProps, OrderedListEditResult } from "api/ui";


export class ListCommand extends NodeCommand {
  constructor(name: string, listType: NodeType, listItemType: NodeType) {
    super(name, null, listType, {}, toggleList(listType, listItemType));
  }
}

export class TightListCommand extends Command {
  
  constructor(schema: Schema) {
    super(
      'tight_list',
      ['Shift-Ctrl-0'],
      (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
        
        const parentList = findParentNodeOfType([schema.nodes.bullet_list, schema.nodes.ordered_list])(state.selection);
        if (!parentList) {
          return false;
        }

        if (dispatch) {
          const tr = state.tr;
          parentList.node.forEach((node, offset) => {
            tr.setNodeMarkup(parentList.pos + 1 + offset, schema.nodes.list_item, {
              ...node.attrs,
              tight: !node.attrs.tight
            }); 
          });

          dispatch(tr);
        }

        return true;
      },
    );
  }

  public isActive(state: EditorState): boolean {
    if (this.isEnabled(state)) {
      const itemNode = findParentNodeOfType(state.schema.nodes.list_item)(state.selection) as NodeWithPos;
      return itemNode.node.attrs.tight;
    } else {
      return false;
    }
  }

}

export class OrderedListEditCommand extends Command {
  constructor(schema: Schema, ui: EditorUI) {
    super(
      'ordered_list_edit',
      null,
      (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => {
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
