import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocAst, PandocNodeWriter, PandocMarkWriter, PandocApiVersion } from 'editor/api/pandoc';
export declare function pandocFromProsemirror(doc: ProsemirrorNode, apiVersion: PandocApiVersion, nodeWriters: readonly PandocNodeWriter[], markWriters: readonly PandocMarkWriter[]): PandocAst;
