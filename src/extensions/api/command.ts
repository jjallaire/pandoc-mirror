import { lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { MarkType, Node, NodeType, Schema } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNode } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import { canInsertNode, nodeIsActive } from './node';
import { markIsActive } from './mark';

export type CommandFn = (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => boolean;

export class Command {
  public name: string;
  public keymap: string[] | null;
  public execute: CommandFn;

  constructor(name: string, keymap: string[] | null, execute: CommandFn) {
    this.name = name;
    this.keymap = keymap;
    this.execute = execute;
  }

  public isEnabled(state: EditorState): boolean {
    return this.execute(state);
  }

  public isActive(state: EditorState): boolean {
    return false;
  }
}

export class MarkCommand extends Command {
  public markType: MarkType;
  public attrs: object;

  constructor(name: string, keymap: string[] | null, markType: MarkType, attrs = {}) {
    super(name, keymap, toggleMark(markType, attrs) as CommandFn);
    this.markType = markType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return markIsActive(state, this.markType);
  }
}

export class NodeCommand extends Command {
  public nodeType: NodeType;
  public attrs: object;

  constructor(name: string, keymap: string[] | null, nodeType: NodeType, attrs: object, execute: CommandFn) {
    super(name, keymap, execute);
    this.nodeType = nodeType;
    this.attrs = attrs;
  }

  public isActive(state: EditorState) {
    return nodeIsActive(state, this.nodeType, this.attrs);
  }
}

export class ListCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, listType: NodeType, listItemType: NodeType) {
    super(name, keymap, listType, {}, commandToggleList(listType, listItemType));
  }
}

export class BlockCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, blockType: NodeType, toggleType: NodeType, attrs = {}) {
    super(name, keymap, blockType, attrs, commandToggleBlockType(blockType, toggleType, attrs));
  }
}

export class WrapCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, wrapType: NodeType) {
    super(name, keymap, wrapType, {}, commandToggleWrap(wrapType));
  }
}

export function commandToggleList(listType: NodeType, itemType: NodeType): CommandFn {
  function isList(node: Node, schema: Schema) {
    return (
      node.type === schema.nodes.bullet_list ||
      node.type === schema.nodes.ordered_list ||
      node.type === schema.nodes.todo_list
    );
  }

  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    const { schema, selection } = state;
    const { $from, $to } = selection;
    const range = $from.blockRange($to);

    if (!range) {
      return false;
    }

    const parentList = findParentNode(node => isList(node, schema))(selection);

    if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
      if (parentList.node.type === listType) {
        return liftListItem(itemType)(state, dispatch);
      }

      if (isList(parentList.node, schema) && listType.validContent(parentList.node.content)) {
        const tr: Transaction = state.tr;
        tr.setNodeMarkup(parentList.pos, listType);

        if (dispatch) {
          dispatch(tr);
        }

        return false;
      }
    }

    return wrapInList(listType)(state, dispatch);
  };
}

export function commandToggleBlockType(type: NodeType, toggletype: NodeType, attrs = {}): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
    const isActive = nodeIsActive(state, type, attrs);

    if (isActive) {
      return setBlockType(toggletype)(state, dispatch);
    }

    return setBlockType(type, attrs)(state, dispatch);
  };
}

export function commandToggleWrap(type: NodeType): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    const isActive = nodeIsActive(state, type);

    if (isActive) {
      return lift(state, dispatch);
    }

    return wrapIn(type)(state, dispatch);
  };
}

export function commandInsertNode(nodeType: NodeType, attrs = {}): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
    if (!canInsertNode(state, nodeType)) {
      return false;
    }

    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(nodeType.create(attrs)));
    }

    return true;
  };
}
