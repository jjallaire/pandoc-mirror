import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { PandocTokenReader, PandocAst } from 'editor/api/pandoc';
export declare function pandocToProsemirror(ast: PandocAst, schema: Schema, readers: readonly PandocTokenReader[]): ProsemirrorNode<any>;
