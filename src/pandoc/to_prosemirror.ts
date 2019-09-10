import { Mark, Node as ProsemirrorNode, NodeType, Schema } from 'prosemirror-model';
import { PandocTokenReader, PandocToken, PandocAst, mapTokens } from 'api/pandoc';
import { uuidv4 } from 'api/util';

export function pandocToProsemirror(ast: PandocAst, schema: Schema, readers: readonly PandocTokenReader[]) {
  const parser = new Parser(schema, readers);
  return parser.parse(ast);
}

class Parser {
  private readonly schema: Schema;
  private readonly handlers: { [token: string]: ParserTokenHandler };

  constructor(schema: Schema, readers: readonly PandocTokenReader[]) {
    this.schema = schema;
    this.handlers = this.createHandlers(readers);
  }

  public parse(ast: any): ProsemirrorNode {
    const state: ParserState = new ParserState(this.schema);
    this.parseTokens(state, ast.blocks);
    return state.doc();
  }

  private parseTokens(state: ParserState, tokens: PandocToken[]) {
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
  private createHandlers(readers: readonly PandocTokenReader[]) {
    const handlers = Object.create(null);
    for (const reader of readers) {
      // resolve children (provide default impl)
      const getChildren = reader.getChildren || ((tok: PandocToken) => tok.c);

      // resolve getAttrs (provide default imple)
      const getAttrs = reader.getAttrs ? reader.getAttrs : (tok: PandocToken) => ({});

      // text
      if (reader.text) {
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
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
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
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
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
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
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
          let content: ProsemirrorNode[] = [];
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
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
          const children = getChildren(tok);
          const tight = children.length && children[0][0].t === 'Plain';
          const attrs = getAttrs(tok);
          state.openNode(nodeType, attrs);
          children.forEach((child: PandocToken[]) => {
            const childAttrs: { tight?: boolean, checked: null | boolean } = { checked: null };
            if (tight) {
              childAttrs.tight = true;
            }

            // look for checkbox in first character of child tokens
            // if we see it, remove it and set childAttrs.checked as appropriate
            const childWithChecked = tokensWithChecked(child);
            childAttrs.checked = childWithChecked.checked;

            // process children
            state.openNode(listItemNodeType, childAttrs);
            this.parseTokens(state, childWithChecked.tokens);
            state.closeNode();
          });
          state.closeNode();
        };

        // footnotes
      } else if (reader.note) {
        if (!this.schema.nodes[reader.note]) {
          continue;
        }
        const nodeType = this.schema.nodes[reader.note];
        handlers[reader.token] = (state: ParserState, tok: PandocToken) => {
          // generate unique id
          const ref = uuidv4();

          // add note to notes collection (will be handled specially by closeNode b/c it
          // has schema.nodes.node type)
          state.openNote(ref);
          this.parseTokens(state, getChildren(tok));
          const noteNode = state.closeNode();

          // store json version of node in an attribute of the footnote (we can copy/paste)
          // between different documents
          const content = JSON.stringify(noteNode.content.toJSON());

          // add inline node to the body
          state.addNode(nodeType, { ref, number: noteNode.attrs.number, content }, []);
        };
      }
    }
    return handlers;
  }
}


const kCheckedChar = '☒';
const kUncheckedChar = '☐';

function tokensWithChecked(tokens: PandocToken[]) : { checked: null | boolean, tokens: PandocToken[] } {
    
  // will set this flag based on inspecting the first Str token
  let checked: null | boolean | undefined;
  let lastWasChecked = false;
  
  // map tokens
  const mappedTokens = mapTokens(tokens, tok => {
    
    // if the last token was checked then strip the next space
    if (tok.t === "Space" && lastWasChecked) {
      lastWasChecked = false;
      return {
        t: "Str",
        c: ""
      };
    }

    // derive 'checked' from first chraracter of first Str token encountered
    // if we find checked or unchecked then set the flag and strip off 
    // the first 2 chraracters (the check and the space after it)
    else if (tok.t === "Str" && (checked === undefined)) {
      let text = tok.c as string;
      if (text.charAt(0) === kCheckedChar) {
        checked = true;
        lastWasChecked = true;
        text = text.slice(1);
      } else  if (text.charAt(0) === kUncheckedChar) {
        checked = false;
        lastWasChecked = true;
        text = text.slice(1);
      } else {
        checked = null;
      }
      return {
        t: "Str",
        c: text
      };
    } else {
      return tok;
    }
  });
  
  // return
  return {
    checked: checked !== undefined ? checked : null,
    tokens: mappedTokens
  };
}


class ParserState {
  private readonly schema: Schema;
  private readonly stack: IParserStackElement[];
  private readonly notes: ProsemirrorNode[];
  private marks: Mark[];
  private footnoteNumber: number;

  constructor(schema: Schema) {
    this.schema = schema;
    this.stack = [{ type: this.schema.nodes.body, attrs: {}, content: [] }];
    this.notes = [];
    this.marks = Mark.none;
    this.footnoteNumber = 1;
  }

  public doc(): ProsemirrorNode {
    const content: ProsemirrorNode[] = [];
    content.push(this.top().type.createAndFill(null, this.top().content) as ProsemirrorNode);
    content.push(this.schema.nodes.notes.createAndFill(null, this.notes) as ProsemirrorNode);
    return this.schema.topNodeType.createAndFill({}, content) as ProsemirrorNode;
  }

  public addText(text: string) {
    if (!text) {
      return;
    }
    const nodes: ProsemirrorNode[] = this.top().content;
    const last: ProsemirrorNode = nodes[nodes.length - 1];
    const node: ProsemirrorNode = this.schema.text(text, this.marks);
    const merged: ProsemirrorNode | undefined = this.maybeMerge(last, node);
    if (last && merged) {
      nodes[nodes.length - 1] = merged;
    } else {
      nodes.push(node);
    }
  }

  public addNode(type: NodeType, attrs: {}, content: ProsemirrorNode[]) {
    const node: ProsemirrorNode | null | undefined = type.createAndFill(attrs, content, this.marks);
    if (!node) {
      return null;
    }
    if (this.stack.length) {
      if (type === this.schema.nodes.note) {
        this.notes.push(node);
      } else {
        this.top().content.push(node);
      }
    }
    return node;
  }

  public openNode(type: NodeType, attrs: {}) {
    this.stack.push({ type, attrs, content: [] });
  }

  public closeNode(): ProsemirrorNode {
    if (this.marks.length) {
      this.marks = Mark.none;
    }
    const info: IParserStackElement = this.stack.pop() as IParserStackElement;
    return this.addNode(info.type, info.attrs, info.content) as ProsemirrorNode;
  }

  public openMark(mark: Mark) {
    this.marks = mark.addToSet(this.marks);
  }

  public closeMark(mark: Mark) {
    this.marks = mark.removeFromSet(this.marks);
  }

  public openNote(ref: string) {
    this.openNode(this.schema.nodes.note, { ref, number: this.footnoteNumber++ });
  }

  private top(): IParserStackElement {
    return this.stack[this.stack.length - 1];
  }

  private maybeMerge(a: ProsemirrorNode, b: ProsemirrorNode): ProsemirrorNode | undefined {
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
  content: ProsemirrorNode[];
}

type ParserTokenHandler = (state: ParserState, tok: PandocToken) => void;
