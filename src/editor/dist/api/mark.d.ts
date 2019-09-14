import { MarkSpec, MarkType, ResolvedPos } from 'prosemirror-model';
import { EditorState, Selection } from 'prosemirror-state';
import { PandocTokenReader, PandocMarkWriterFn } from './pandoc';
import { InputRule } from 'prosemirror-inputrules';
export interface PandocMark {
    readonly name: string;
    readonly spec: MarkSpec;
    readonly pandoc: {
        readonly readers: readonly PandocTokenReader[];
        readonly writer: {
            priority: number;
            write: PandocMarkWriterFn;
        };
    };
}
export declare function markIsActive(state: EditorState, type: MarkType): boolean;
export declare function getMarkAttrs(state: EditorState, type: MarkType): {
    [key: string]: any;
};
export declare function getMarkRange($pos?: ResolvedPos, type?: MarkType): false | {
    from: number;
    to: number;
};
export declare function getSelectionMarkRange(selection: Selection, markType: MarkType): {
    from: number;
    to: number;
};
export declare function markInputRule(regexp: RegExp, markType: MarkType, getAttrs?: ((match: string[]) => object) | object): InputRule<any>;
export declare function delimiterMarkInputRule(delim: string, markType: MarkType, prefixMask?: string): InputRule<any>;
