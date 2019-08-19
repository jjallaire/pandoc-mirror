
import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';

import { PandocEngine, PandocTokenReader, PandocNodeWriter, PandocApiVersion, PandocMarkWriter } from 'api/pandoc';

import { pandocToProsemirror } from './to_prosemirror';
import { pandocFromProsemirror } from './from_prosemirror';

const kMarkdownFormat = 'markdown' 
  + '-auto_identifiers';  // don't inject identifiers for headers w/o them

export class PandocConverter {

  private readonly schema: Schema;
  private readonly readers: readonly PandocTokenReader[];
  private readonly nodeWriters: readonly PandocNodeWriter[];
  private readonly markWriters: readonly PandocMarkWriter[];
  private readonly pandoc: PandocEngine;

  private apiVersion: PandocApiVersion | null;

  constructor(
    schema: Schema, 
    readers: readonly PandocTokenReader[], 
    nodeWriters: readonly PandocNodeWriter[],
    markWriters: readonly PandocMarkWriter[],
    pandoc: PandocEngine
  ) {
    this.schema = schema;
    this.readers = readers;
    this.nodeWriters = nodeWriters;
    this.markWriters = markWriters;
    this.pandoc = pandoc;
    this.apiVersion = null;
  }

  public toProsemirror(markdown: string) : Promise<ProsemirrorNode> {
    return this.pandoc.markdownToAst(kMarkdownFormat, markdown).then(ast => {
      this.apiVersion = ast['pandoc-api-version'];
      return pandocToProsemirror(ast, this.schema, this.readers);
    });
  }

  public fromProsemirror(doc: ProsemirrorNode) : Promise<string> {
    if (!this.apiVersion) {
      throw new Error("API version not available (did you call toProsemirror first?)");
    }
    const ast = pandocFromProsemirror(doc, this.apiVersion, this.nodeWriters, this.markWriters);
    return this.pandoc.astToMarkdown(kMarkdownFormat, ast);
  }


}