import { MarkdownSerializerState } from 'prosemirror-markdown';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';
import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';

export interface PandocEngine {
  markdownToAst(format: string, markdown: string): Promise<object>;
  astToMarkdown(format: string, ast: object): Promise<string>;
}

export interface PandocAstReader {
  // pandoc token name (e.g. "Str", "Emph", etc.)
  token: string;

  // one and only one of these values must also be set
  node?: string;
  block?: string;
  list?: string;
  mark?: string;
  text?: boolean;

  // functions for getting attributes and children
  getAttrs?: (tok: PandocAstToken) => any;
  getChildren?: (tok: PandocAstToken) => any[];
  getText?: (tok: PandocAstToken) => string;
}

export interface PandocAstToken {
  t: string;
  c?: any;
}

export type PandocAstMarkWriterFn = (state: AstSerializerState, mark: Mark, parent: Fragment, index: number) => string;

export type PandocAstNodeWriterFn = (
  state: AstSerializerState,
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

export type PandocNodeWriterFn = (
  state: MarkdownSerializerState,
  node: ProsemirrorNode,
  parent: ProsemirrorNode,
  index: number,
) => void;
