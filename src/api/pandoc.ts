import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';

export interface PandocEngine {
  markdownToAst(format: string, markdown: string): Promise<object>;
  astToMarkdown(format: string, ast: object): Promise<string>;
}

export interface PandocReader {
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

export interface PandocToken {
  t: string;
  c?: any;
}

export type PandocAstMarkWriterFn = (state: PandocSerializer, mark: Mark, parent: Fragment, index: number) => string;



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


export interface PandocSerializer {
  render(value: any) : void;
  renderToken(type: string, content?: (() => void) | any) : void;
  renderList(content: () => void) : void;
  renderAttr(id: string, classes?: string[], keyvalue?: { [key: string]: any }) : void; 
  renderText(text: string | null) : void;
  renderBlocks(parent: ProsemirrorNode) : void; 
  renderInlines(parent: ProsemirrorNode) : void;
}


export type PandocNodeWriterFn = (
  pandoc: PandocSerializer,
  node: ProsemirrorNode,
  parent: ProsemirrorNode,
  index: number,
) => void;

