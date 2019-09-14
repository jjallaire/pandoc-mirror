import { Schema } from 'prosemirror-model';
import { Transaction, EditorState } from 'prosemirror-state';
export declare function exampleListsAppendTransaction(schema: Schema): (transactions: Transaction<any>[], oldState: EditorState<any>, newState: EditorState<any>) => Transaction<any> | undefined;
