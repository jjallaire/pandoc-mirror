import { Node, NodeType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { ImageEditorFn } from 'editor/api/ui';
import { EditorView } from 'prosemirror-view';
export declare function imageDialog(node: Node | null, nodeType: NodeType, state: EditorState, dispatch: (tr: Transaction<any>) => void, view: EditorView | undefined, onEditImage: ImageEditorFn): void;
