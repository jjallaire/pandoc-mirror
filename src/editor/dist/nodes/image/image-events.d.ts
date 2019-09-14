import { Node, NodeType } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { ImageEditorFn } from 'editor/api/ui';
export declare function imageDoubleClickOn(nodeType: NodeType, onEditImage: ImageEditorFn): (view: EditorView<any>, _pos: number, node: Node<any>) => boolean;
export declare function imageDrop(nodeType: NodeType): (view: EditorView<any>, event: Event) => boolean;
