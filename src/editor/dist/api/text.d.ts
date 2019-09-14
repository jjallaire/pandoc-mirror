import { Node as ProsemirrorNode } from 'prosemirror-model';
export interface TextWithPos {
    readonly text: string;
    readonly pos: number;
}
export declare function mergedTextNodes(doc: ProsemirrorNode, filter?: (node: ProsemirrorNode, parentNode: ProsemirrorNode) => boolean): TextWithPos[];
