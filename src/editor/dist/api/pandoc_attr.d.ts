import { PandocToken } from './pandoc';
import { NodeSpec, MarkSpec } from 'prosemirror-model';
export declare const pandocAttrSpec: {
    id: {
        default: null;
    };
    classes: {
        default: never[];
    };
    keyvalue: {
        default: never[];
    };
};
export declare function pandocAttrAvailable(attrs: any): any;
export declare function pandocAttrFrom(attrs: any): any;
export declare function pandocAttrInSpec(spec: NodeSpec | MarkSpec): boolean;
export declare function pandocAttrReadAST(tok: PandocToken, index: number): {
    id: any;
    classes: any;
    keyvalue: any;
};
export declare function pandocAttrToDomAttr(attrs: any): any;
export declare function pandocAttrParseDom(el: Element, attrs: {
    [key: string]: string | null;
}): any;
