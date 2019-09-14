import { MarkType, NodeType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
export declare class Command {
    readonly name: string;
    readonly keymap: readonly string[] | null;
    readonly execute: CommandFn;
    constructor(name: string, keymap: readonly string[] | null, execute: CommandFn);
    isEnabled(state: EditorState): boolean;
    isActive(state: EditorState): boolean;
}
export declare class MarkCommand extends Command {
    readonly markType: MarkType;
    readonly attrs: object;
    constructor(name: string, keymap: string[] | null, markType: MarkType, attrs?: {});
    isActive(state: EditorState): boolean;
}
export declare class NodeCommand extends Command {
    readonly nodeType: NodeType;
    readonly attrs: object;
    constructor(name: string, keymap: string[] | null, nodeType: NodeType, attrs: object, execute: CommandFn);
    isActive(state: EditorState): boolean;
}
export declare class ListCommand extends NodeCommand {
    constructor(name: string, keymap: string[] | null, listType: NodeType, listItemType: NodeType);
}
export declare class BlockCommand extends NodeCommand {
    constructor(name: string, keymap: string[] | null, blockType: NodeType, toggleType: NodeType, attrs?: {});
}
export declare class WrapCommand extends NodeCommand {
    constructor(name: string, keymap: string[] | null, wrapType: NodeType);
}
export declare function toggleList(listType: NodeType, itemType: NodeType): CommandFn;
export declare type CommandFn = (state: EditorState, dispatch?: (tr: Transaction<any>) => void, view?: EditorView) => boolean;
export declare function toggleBlockType(type: NodeType, toggletype: NodeType, attrs?: {}): CommandFn;
export declare function toggleWrap(type: NodeType): CommandFn;
export declare function insertNode(nodeType: NodeType, attrs?: {}): CommandFn;
