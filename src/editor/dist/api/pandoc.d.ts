import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';
export interface PandocEngine {
    markdownToAst(markdown: string, format: string): Promise<PandocAst>;
    astToMarkdown(ast: PandocAst, format: string, options: string[]): Promise<string>;
}
export interface PandocAst {
    blocks: PandocToken[];
    'pandoc-api-version': PandocApiVersion;
    meta: any;
}
export declare type PandocApiVersion = [number, number, number, number];
export interface PandocToken {
    t: string;
    c?: any;
}
export interface PandocTokenReader {
    readonly token: string;
    readonly node?: string;
    readonly block?: string;
    readonly list?: string;
    readonly mark?: string;
    readonly note?: string;
    readonly text?: boolean;
    getAttrs?: (tok: PandocToken) => any;
    getChildren?: (tok: PandocToken) => any[];
    getText?: (tok: PandocToken) => string;
}
export interface PandocNodeWriter {
    readonly name: string;
    readonly write: PandocNodeWriterFn;
}
export declare type PandocNodeWriterFn = (output: PandocOutput, node: ProsemirrorNode) => void;
export interface PandocMarkWriter {
    readonly name: string;
    readonly priority: number;
    readonly write: PandocMarkWriterFn;
}
export declare type PandocMarkWriterFn = (output: PandocOutput, mark: Mark, parent: Fragment) => void;
export interface PandocOutput {
    write(value: any): void;
    writeToken(type: string, content?: (() => void) | any): void;
    writeMark(type: string, parent: Fragment, expelEnclosingWhitespace?: boolean): void;
    writeArray(content: () => void): void;
    writeAttr(id: string, classes?: readonly string[], keyvalue?: readonly string[]): void;
    writeText(text: string | null): void;
    writeBlock(block: ProsemirrorNode): void;
    writeBlocks(parent: ProsemirrorNode): void;
    writeListBlock(list: ProsemirrorNode, content: () => void): void;
    writeListItemParagraph(content: () => void): void;
    writeNote(note: ProsemirrorNode): void;
    writeInlines(parent: Fragment): void;
}
export declare function tokensCollectText(c: PandocToken[]): string;
export declare function mapTokens(c: PandocToken[], f: (tok: PandocToken) => PandocToken): PandocToken[];
