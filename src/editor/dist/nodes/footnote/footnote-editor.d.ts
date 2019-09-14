import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorView, DecorationSet, NodeView } from 'prosemirror-view';
import { EditorState } from 'prosemirror-state';
export declare function footnoteEditorDecorations(schema: Schema): (state: EditorState<any>) => DecorationSet<any>;
export declare function footnoteEditorNodeViews(_schema: Schema): {
    note(node: ProsemirrorNode<any>, view: EditorView<any>, getPos: () => number): NoteEditorView;
};
declare class NoteEditorView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;
    private readonly node;
    private readonly view;
    private readonly getPos;
    constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number);
}
export declare function footnoteEditorKeyDownHandler(schema: Schema): (view: EditorView<any>, event: KeyboardEvent) => boolean;
export {};
