import { Fragment, Mark, Node as ProsemirrorNode } from 'prosemirror-model';

export interface PandocEngine {
  markdownToAst(markdown: string, format: string): Promise<PandocAst>;
  astToMarkdown(ast: PandocAst, format: string, options: string[]): Promise<string>;
}

export interface PandocAst {
  blocks: PandocToken[];
  'pandoc-api-version': PandocApiVersion;
  meta: any;
}

export type PandocApiVersion = [number, number, number, number];

export interface PandocToken {
  t: string;
  c?: any;
}

export interface PandocTokenReader {
  // pandoc token name (e.g. "Str", "Emph", etc.)
  readonly token: string;

  // one and only one of these values must also be set
  readonly node?: string;
  readonly block?: string;
  readonly list?: string;
  readonly mark?: string;
  readonly note?: string;
  readonly text?: boolean;

  // functions for getting attributes and children
  getAttrs?: (tok: PandocToken) => any;
  getChildren?: (tok: PandocToken) => any[];
  getText?: (tok: PandocToken) => string;
}

export interface PandocNodeWriter {
  readonly name: string;
  readonly write: PandocNodeWriterFn;
}

export type PandocNodeWriterFn = (output: PandocOutput, node: ProsemirrorNode) => void;

export interface PandocMarkWriter {
  // pandoc mark name
  readonly name: string;

  // The 'priority' property allows us to dicate the order of nesting
  // for marks (this is required b/c Prosemirror uses a flat structure
  // whereby multiple marks are attached to text nodes). This allows us
  // to e.g. ensure that strong and em always occur outside code.
  readonly priority: number;

  // writer function
  readonly write: PandocMarkWriterFn;
}

export type PandocMarkWriterFn = (output: PandocOutput, mark: Mark, parent: Fragment) => void;

export interface PandocOutput {
  write(value: any): void;
  writeToken(type: string, content?: (() => void) | any): void;
  writeMark(type: string, parent: Fragment, expelEnclosingWhitespace?: boolean): void;
  writeArray(content: () => void): void;
  writeAttr(id: string, classes?: readonly string[], keyvalue?: readonly string[]): void;
  writeText(text: string | null): void;
  writeBlock(block: ProsemirrorNode): void;
  writeBlocks(parent: ProsemirrorNode): void;
  writeListBlock(list: ProsemirrorNode, content: () => void): void;
  writeListItemParagraph(content: () => void): void;
  writeNote(note: ProsemirrorNode): void;
  writeInlines(parent: Fragment): void;
}

// collect the text from a collection of pandoc ast
// elements (ignores marks, useful for ast elements
// that support marks but whose prosemirror equivalent
// does not, e.g. image alt text)
export function tokensCollectText(c: PandocToken[]): string {
  return c
    .map(elem => {
      if (elem.t === 'Str') {
        return elem.c;
      } else if (elem.t === 'Space') {
        return ' ';
      } else if (elem.c) {
        return tokensCollectText(elem.c);
      } else {
        return '';
      }
    })
    .join('');
}

export function mapTokens(c: PandocToken[], f: (tok: PandocToken) => PandocToken) {
  return c.map(tok => {
    const mappedTok = f(tok);
    if (mappedTok.c instanceof Array) {
      mappedTok.c = mapTokens(mappedTok.c, f);
    }
    return mappedTok;
  });
}
