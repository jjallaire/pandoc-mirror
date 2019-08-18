import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';

export interface PandocEngine {
  markdownToAst(format: string, markdown: string): Promise<PandocAst>;
  astToMarkdown(format: string, ast: PandocAst): Promise<string>;
}

export interface PandocAst {
  blocks: PandocToken[];
  'pandoc-api-version': PandocApiVersion;
  meta: any;
}

export type PandocApiVersion = [number,number,number,number];

export interface PandocToken {
  t: string;
  c?: any;
}

export interface PandocTokenReader {
  // pandoc token name (e.g. "Str", "Emph", etc.)
  token: string;

  // one and only one of these values must also be set
  node?: string;
  block?: string;
  list?: string;
  mark?: string;
  text?: boolean;

  // functions for getting attributes and children
  getAttrs?: (tok: PandocToken) => any;
  getChildren?: (tok: PandocToken) => any[];
  getText?: (tok: PandocToken) => string;
}

export interface PandocNodeWriter {
  name: string;
  write: PandocNodeWriterFn;
}

export type PandocNodeWriterFn = (
  pandoc: PandocOutput,
  node: ProsemirrorNode,
  parent: ProsemirrorNode,
  index: number,
) => void;

export interface PandocMarkWriter {
  open: string | PandocMarkWriterFn;
  close: string | PandocMarkWriterFn;
  mixable?: boolean;
  escape?: boolean;
  expelEnclosingWhitespace?: boolean;
}

export type PandocMarkWriterFn = (
  state: MarkdownSerializerState,
  mark: Mark,
  parent: Fragment,
  index: number,
) => string;


export interface PandocOutput {
  write(value: any) : void;
  writeToken(type: string, content?: (() => void) | any) : void;
  writeList(content: () => void) : void;
  writeAttr(id: string, classes?: string[], keyvalue?: { [key: string]: any }) : void; 
  writeText(text: string | null) : void;
  writeBlocks(parent: ProsemirrorNode) : void; 
  writeInlines(parent: ProsemirrorNode) : void;
}



