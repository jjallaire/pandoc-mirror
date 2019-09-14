import { Node as ProsemirrorNode, NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState, Selection, Transaction } from 'prosemirror-state';
import { ContentNodeWithPos, NodeWithPos } from 'prosemirror-utils';
import { PandocTokenReader, PandocNodeWriterFn } from './pandoc';
export interface PandocNode {
    readonly name: string;
    readonly spec: NodeSpec;
    readonly pandoc: {
        readonly readers?: readonly PandocTokenReader[];
        readonly writer: PandocNodeWriterFn;
    };
}
export declare type NodeTraversalFn = (node: Node, pos: number, parent: Node, index: number) => boolean | void | null | undefined;
export declare function findNodeOfTypeInSelection(selection: Selection, type: NodeType): ContentNodeWithPos | undefined;
export declare function firstNode(parent: NodeWithPos, predicate: (node: ProsemirrorNode) => boolean): NodeWithPos | undefined;
export declare function lastNode(parent: NodeWithPos, predicate: (node: ProsemirrorNode) => boolean): NodeWithPos | undefined;
export declare function nodeIsActive(state: EditorState, type: NodeType, attrs?: {}): boolean;
export declare function canInsertNode(state: EditorState, nodeType: NodeType): boolean;
export declare function insertAndSelectNode(node: ProsemirrorNode, state: EditorState, dispatch: (tr: Transaction<any>) => void): void;
