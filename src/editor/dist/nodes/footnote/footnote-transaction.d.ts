import { Schema } from 'prosemirror-model';
import { Transaction, EditorState } from 'prosemirror-state';
export declare function footnoteFilterTransaction(schema: Schema): (tr: Transaction<any>, _state: EditorState<any>) => boolean;
export declare function footnoteAppendTransaction(schema: Schema): (transactions: Transaction<any>[], oldState: EditorState<any>, newState: EditorState<any>) => Transaction<any> | undefined;
