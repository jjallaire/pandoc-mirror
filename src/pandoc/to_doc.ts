import { Mark, Node, NodeType, Schema } from 'prosemirror-model';
import { PandocEngine, PandocAstReader, PandocAstToken } from 'api/pandoc';

export function markdownToDoc(
  markdown: string,
  schema: Schema,
  pandoc: PandocEngine,
  pandocReaders: PandocAstReader[],
): Promise<Node> {
  return pandoc.markdownToAst(markdown).then(ast => {
    const parser: Parser = new Parser(schema, pandocReaders);
    return parser.parse(ast);
  });
}

class Parser {
  private schema: Schema;
  private handlers: { [token: string]: ParserTokenHandler };

  constructor(schema: Schema, readers: PandocAstReader[]) {
    this.schema = schema;
    this.handlers = this.createHandlers(readers);
  }

  public parse(ast: any): Node {
    const state: ParserState = new ParserState(this.schema);
    this.parseTokens(state, ast.blocks);
    return state.topNode();
  }

  private parseTokens(state: ParserState, tokens: PandocAstToken[]) {
    for (const tok of tokens) {
      const handler = this.handlers[tok.t];
      if (handler) {
        handler(state, tok);
      } else {
        throw new Error(`No handler for pandoc token ${tok.t}`);
      }
    }
  }

  // create parser token handler functions based on the passed readers
  private createHandlers(readers: PandocAstReader[]) {
    const handlers = Object.create(null);
    for (const reader of readers) {
      // resolve children (provide default impl)
      const getChildren = reader.getChildren || ((tok: PandocAstToken) => tok.c);

      // resolve getAttrs (provide default imple)
      const getAttrs = reader.getAttrs ? reader.getAttrs : (tok: PandocAstToken) => ({});

      // text
      if (reader.text) {
        handlers[reader.token] = (state: ParserState, tok: PandocAstToken) => {
          if (reader.getText) {
            const text = reader.getText(tok);
            state.addText(text);
          }
        };

        // marks (ignore unknown)
      } else if (reader.mark) {
        if (!this.schema.marks[reader.mark]) {
          continue;
        }
        handlers[reader.token] = (state: ParserState, tok: PandocAstToken) => {
          const markType = this.schema.marks[reader.mark as string];
          const mark = markType.create(getAttrs(tok));
          state.openMark(mark);
          if (reader.getText) {
            state.addText(reader.getText(tok));
          } else {
            this.parseTokens(state, getChildren(tok));
          }
          state.closeMark(mark);
        };

        // blocks (ignore unknown)
      } else if (reader.block) {
        if (!this.schema.nodes[reader.block]) {
          continue;
        }
        const nodeType = this.schema.nodes[reader.block];
        handlers[reader.token] = (state: ParserState, tok: PandocAstToken) => {
          state.openNode(nodeType, getAttrs(tok));
          if (reader.getText) {
            state.addText(reader.getText(tok));
          } else {
            this.parseTokens(state, getChildren(tok));
          }
          state.closeNode();
        };

        // nodes (inore unknown)
      } else if (reader.node) {
        if (!this.schema.nodes[reader.node]) {
          continue;
        }
        const nodeType = this.schema.nodes[reader.node];
        handlers[reader.token] = (state: ParserState, tok: PandocAstToken) => {
          let content: Node[] = [];
          if (reader.getText) {
            content = [this.schema.text(reader.getText(tok))];
          }
          state.addNode(nodeType, getAttrs(tok), content);
        };

        // lists (ignore unknown)
      } else if (reader.list) {
        if (!this.schema.nodes[reader.list]) {
          continue;
        }
        const nodeType = this.schema.nodes[reader.list];
        const listItem = 'list_item';
        const listItemNodeType = this.schema.nodes[listItem];
        handlers[reader.token] = (state: ParserState, tok: PandocAstToken) => {
          const children = getChildren(tok);
          const tight = children.length && children[0][0].t === 'Plain';
          const attrs = getAttrs(tok);
          if (tight) {
            attrs.tight = 'true';
          }
          state.openNode(nodeType, attrs);
          children.forEach((child: PandocAstToken[]) => {
            state.openNode(listItemNodeType, {});
            this.parseTokens(state, child);
            state.closeNode();
          });
          state.closeNode();
        };
      }
    }
    return handlers;
  }
}

class ParserState {
  private schema: Schema;
  private stack: IParserStackElement[];
  private marks: Mark[];

  constructor(schema: Schema) {
    this.schema = schema;
    this.stack = [{ type: this.schema.topNodeType, attrs: {}, content: [] }];
    this.marks = Mark.none;
  }

  public topNode(): Node {
    return this.top().type.createAndFill(null, this.top().content) as Node;
  }

  public addText(text: string) {
    if (!text) {
      return;
    }
    const nodes: Node[] = this.top().content;
    const last: Node = nodes[nodes.length - 1];
    const node: Node = this.schema.text(text, this.marks);
    const merged: Node | undefined = this.maybeMerge(last, node);
    if (last && merged) {
      nodes[nodes.length - 1] = merged;
    } else {
      nodes.push(node);
    }
  }

  public addNode(type: NodeType, attrs: {}, content: Node[]) {
    const node: Node | null | undefined = type.createAndFill(attrs, content, this.marks);
    if (!node) {
      return null;
    }
    if (this.stack.length) {
      this.top().content.push(node);
    }
    return node;
  }

  public openNode(type: NodeType, attrs: {}) {
    this.stack.push({ type, attrs, content: [] });
  }

  public closeNode(): Node {
    if (this.marks.length) {
      this.marks = Mark.none;
    }
    const info: IParserStackElement = this.stack.pop() as IParserStackElement;
    return this.addNode(info.type, info.attrs, info.content) as Node;
  }

  public openMark(mark: Mark) {
    this.marks = mark.addToSet(this.marks);
  }

  public closeMark(mark: Mark) {
    this.marks = mark.removeFromSet(this.marks);
  }

  private top(): IParserStackElement {
    return this.stack[this.stack.length - 1];
  }

  private maybeMerge(a: Node, b: Node): Node | undefined {
    if (a && a.isText && b.isText && Mark.sameSet(a.marks, b.marks)) {
      return this.schema.text(((a.text as string) + b.text) as string, a.marks);
    } else {
      return undefined;
    }
  }
}

interface IParserStackElement {
  type: NodeType;
  attrs: {};
  content: Node[];
}

type ParserTokenHandler = (state: ParserState, tok: PandocAstToken) => void;
