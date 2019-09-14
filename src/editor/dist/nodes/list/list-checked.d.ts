import { Node as ProsemirrorNode, Schema, Fragment, NodeType } from 'prosemirror-model';
import { NodeView, EditorView, DecorationSet } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { InputRule } from 'prosemirror-inputrules';
import { Command } from 'editor/api/command';
export declare class ListItemNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private readonly node;
    private readonly view;
    private readonly getPos;
    constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number);
}
export declare function checkedListItemDecorations(schema: Schema): (state: EditorState<any>) => DecorationSet<any>;
export declare function checkedListItemCommandFn(itemType: NodeType): (state: EditorState<any>, dispatch?: ((tr: Transaction<any>) => void) | undefined) => boolean;
export declare function checkedListItemToggleCommandFn(itemType: NodeType): (state: EditorState<any>, dispatch?: ((tr: Transaction<any>) => void) | undefined) => boolean;
export declare class CheckedListItemCommand extends Command {
    constructor(itemType: NodeType);
    isActive(state: EditorState): boolean;
}
export declare class CheckedListItemToggleCommand extends Command {
    constructor(itemType: NodeType);
}
export declare function checkedListItemInputRule(schema: Schema): InputRule<any>;
export declare function checkedListInputRule(schema: Schema): InputRule<any>;
export declare function fragmentWithCheck(schema: Schema, fragment: Fragment, checked: boolean): Fragment<Schema<any, any>>;
