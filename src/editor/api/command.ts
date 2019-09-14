import { lift, setBlockType, toggleMark, wrapIn } from 'prosemirror-commands';
import { MarkType, Node, NodeType, Schema } from 'prosemirror-model';
import { liftListItem, wrapInList } from 'prosemirror-schema-list';
import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNode } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';

import { markIsActive } from './mark';
import { canInsertNode, nodeIsActive } from './node';
import { pandocAttrInSpec, pandocAttrAvailable, pandocAttrFrom } from './pandoc_attr';

export class Command {
  public readonly name: string;
  public readonly keymap: readonly string[] | null;
  public readonly execute: CommandFn;

  constructor(name: string, keymap: readonly string[] | null, execute: CommandFn) {
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
  public readonly markType: MarkType;
  public readonly attrs: object;

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
  public readonly nodeType: NodeType;
  public readonly attrs: object;

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
    super(name, keymap, listType, {}, toggleList(listType, listItemType));
  }
}

export class BlockCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, blockType: NodeType, toggleType: NodeType, attrs = {}) {
    super(name, keymap, blockType, attrs, toggleBlockType(blockType, toggleType, attrs));
  }
}

export class WrapCommand extends NodeCommand {
  constructor(name: string, keymap: string[] | null, wrapType: NodeType) {
    super(name, keymap, wrapType, {}, toggleWrap(wrapType));
  }
}

export function toggleList(listType: NodeType, itemType: NodeType): CommandFn {
  function isList(node: Node, schema: Schema) {
    return (
      node.type === schema.nodes.bullet_list ||
      node.type === schema.nodes.ordered_list
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

export type CommandFn = (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => boolean;

export function toggleBlockType(type: NodeType, toggletype: NodeType, attrs = {}): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void) => {
    const isActive = nodeIsActive(state, type, attrs);

    if (isActive) {
      return setBlockType(toggletype)(state, dispatch);
    }

    // if the type has pandoc attrs then see if we can transfer from the existing node
    let pandocAttr: any = {};
    if (pandocAttrInSpec(type.spec)) {
      const predicate = (n: Node) => pandocAttrAvailable(n.attrs);
      const node = findParentNode(predicate)(state.selection);
      if (node) {
        pandocAttr = pandocAttrFrom(node.node.attrs);
      }
    }

    return setBlockType(type, { ...attrs, ...pandocAttr })(state, dispatch);
  };
}

export function toggleWrap(type: NodeType): CommandFn {
  return (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => {
    const isActive = nodeIsActive(state, type);

    if (isActive) {
      return lift(state, dispatch);
    }

    return wrapIn(type)(state, dispatch);
  };
}

export function insertNode(nodeType: NodeType, attrs = {}): CommandFn {
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
