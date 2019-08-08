import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';

export interface IPandocReader {
  // pandoc token name (e.g. "Str", "Emph", etc.)
  token: string;

  // one and only one of these values must also be set
  node?: string;
  block?: string;
  list?: string;
  mark?: string;
  text?: boolean;

  // indication that the token has pandoc attributes in it's content
  // (i.e. [id, classes[], key,value[]])
  pandocAttr?: number;

  // functions for getting attributes and children
  getAttrs?: (tok: IPandocToken) => any;
  getChildren?: (tok: IPandocToken) => any[];
  getText?: (tok: IPandocToken) => string;
}

export interface IPandocToken {
  t: string;
  c: any;
}

export type PandocMarkWriterFn = (
  state: MarkdownSerializerState,
  mark: Mark,
  parent: Fragment,
  index: number,
) => string;
export interface IPandocMarkWriter {
  open: string | PandocMarkWriterFn;
  close: string | PandocMarkWriterFn;
  mixable?: boolean;
  escape?: boolean;
  expelEnclosingWhitespace?: boolean;
}

export type PandocNodeWriterFn = (
  state: MarkdownSerializerState,
  node: ProsemirrorNode,
  parent: ProsemirrorNode,
  index: number,
) => void;
