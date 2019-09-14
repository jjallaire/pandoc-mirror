import { Transaction, EditorState } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';
export declare function transactionsHaveChange(transactions: Transaction[], oldState: EditorState, newState: EditorState, predicate: (node: ProsemirrorNode<any>, pos: number, parent: ProsemirrorNode<any>, index: number) => boolean): boolean;
