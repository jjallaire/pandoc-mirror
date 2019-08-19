
import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';

import { PandocEngine, PandocTokenReader, PandocNodeWriter, PandocApiVersion } from 'api/pandoc';

import { pandocToProsemirror } from './to_prosemirror';
import { pandocFromProsemirror } from './from_prosemirror';

const kMarkdownFormat = 'markdown' 
  + '-auto_identifiers';  // don't inject identifiers for headers w/o them

export class PandocConverter {

  private readonly schema: Schema;
  private readonly readers: readonly PandocTokenReader[];
  private readonly writers: readonly PandocNodeWriter[];
  private readonly pandoc: PandocEngine;

  private apiVersion: PandocApiVersion | null;

  constructor(
    schema: Schema, 
    readers: readonly PandocTokenReader[], 
    writers: readonly PandocNodeWriter[],
    pandoc: PandocEngine
  ) {
    this.schema = schema;
    this.readers = readers;
    this.writers = writers;
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
    const ast = pandocFromProsemirror(doc, this.apiVersion, this.writers);
    return this.pandoc.astToMarkdown(kMarkdownFormat, ast);
  }


}