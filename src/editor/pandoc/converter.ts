import { Schema, Node as ProsemirrorNode } from 'prosemirror-model';

import {
  PandocEngine,
  PandocTokenReader,
  PandocNodeWriter,
  PandocApiVersion,
  PandocMarkWriter,
} from 'editor/api/pandoc';

import { pandocToProsemirror } from './to_prosemirror';
import { pandocFromProsemirror } from './from_prosemirror';

const kMarkdownFormat = 'markdown' + '-auto_identifiers'; // don't inject identifiers for headers w/o them

export interface PandocConverterOptions {
  reader: {};
  writer: {
    atxHeaders?: boolean;
    wrapColumn?: number;
  };
}

export class PandocConverter {
  private readonly schema: Schema;
  private readonly readers: readonly PandocTokenReader[];
  private readonly nodeWriters: readonly PandocNodeWriter[];
  private readonly markWriters: readonly PandocMarkWriter[];
  private readonly pandoc: PandocEngine;
  private readonly options: PandocConverterOptions;

  private apiVersion: PandocApiVersion | null;

  constructor(
    schema: Schema,
    readers: readonly PandocTokenReader[],
    nodeWriters: readonly PandocNodeWriter[],
    markWriters: readonly PandocMarkWriter[],
    pandoc: PandocEngine,
    options: PandocConverterOptions,
  ) {
    this.schema = schema;
    this.readers = readers;
    this.nodeWriters = nodeWriters;
    this.markWriters = markWriters;
    this.pandoc = pandoc;
    this.options = options;
    this.apiVersion = null;
  }

  public toProsemirror(markdown: string): Promise<ProsemirrorNode> {
    return this.pandoc.markdownToAst(markdown, kMarkdownFormat).then(ast => {
      this.apiVersion = ast['pandoc-api-version'];
      return pandocToProsemirror(ast, this.schema, this.readers);
    });
  }

  public fromProsemirror(doc: ProsemirrorNode): Promise<string> {
    if (!this.apiVersion) {
      throw new Error('API version not available (did you call toProsemirror first?)');
    }

    const ast = pandocFromProsemirror(doc, this.apiVersion, this.nodeWriters, this.markWriters);

    const options: string[] = [];
    if (this.options.writer.atxHeaders) {
      options.push('--atx-headers');
    }
    if (this.options.writer.wrapColumn) {
      options.push('--wrap=auto');
      options.push(`--column=${this.options.writer.wrapColumn}`);
    } else {
      options.push('--wrap=none');
    }

    return this.pandoc.astToMarkdown(ast, kMarkdownFormat, options);
  }
}
