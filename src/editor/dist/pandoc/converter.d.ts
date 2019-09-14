import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocEngine, PandocTokenReader, PandocNodeWriter, PandocMarkWriter } from 'editor/api/pandoc';
export interface PandocConverterOptions {
    reader: {};
    writer: {
        atxHeaders?: boolean;
        wrapColumn?: number;
    };
}
export declare class PandocConverter {
    private readonly schema;
    private readonly readers;
    private readonly nodeWriters;
    private readonly markWriters;
    private readonly pandoc;
    private readonly options;
    private apiVersion;
    constructor(schema: Schema, readers: readonly PandocTokenReader[], nodeWriters: readonly PandocNodeWriter[], markWriters: readonly PandocMarkWriter[], pandoc: PandocEngine, options: PandocConverterOptions);
    toProsemirror(markdown: string): Promise<ProsemirrorNode>;
    fromProsemirror(doc: ProsemirrorNode): Promise<string>;
}
