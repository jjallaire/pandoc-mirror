import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocOutput, PandocToken } from 'editor/api/pandoc';
export declare const pandocOrderedListReader: {
    token: string;
    list: string;
    getAttrs: (tok: PandocToken) => {
        order: any;
        number_style: any;
        number_delim: any;
    };
    getChildren: (tok: PandocToken) => any;
};
export declare function pandocWriteOrderedList(output: PandocOutput, node: ProsemirrorNode): void;
export declare function pandocWriteBulletList(output: PandocOutput, node: ProsemirrorNode): void;
export declare function pandocWriteListItem(output: PandocOutput, node: ProsemirrorNode): void;
