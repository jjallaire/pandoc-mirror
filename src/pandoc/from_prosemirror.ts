import { Node as ProsemirrorNode, Fragment, MarkType, Mark } from 'prosemirror-model';

import {
  PandocAst,
  PandocToken,
  PandocOutput,
  PandocNodeWriterFn,
  PandocNodeWriter,
  PandocMarkWriter,
  PandocApiVersion,
} from 'api/pandoc';

export function pandocFromProsemirror(
  doc: ProsemirrorNode,
  apiVersion: PandocApiVersion,
  nodeWriters: readonly PandocNodeWriter[],
  markWriters: readonly PandocMarkWriter[],
): PandocAst {
  const bodyNode = doc.child(0);
  const notesNode = doc.child(1);
  const writer = new PandocWriter(apiVersion, nodeWriters, markWriters, notesNode);
  writer.writeBlocks(bodyNode);
  return writer.output();
}

class PandocWriter implements PandocOutput {
  private readonly ast: PandocAst;
  private readonly nodeWriters: { [key: string]: PandocNodeWriterFn };
  private readonly markWriters: { [key: string]: PandocMarkWriter };
  private readonly notes: { [key: string]: ProsemirrorNode };
  private readonly containers: any[][];
  private readonly activeMarks: MarkType[];

  constructor(
    apiVersion: PandocApiVersion,
    nodeWriters: readonly PandocNodeWriter[],
    markWriters: readonly PandocMarkWriter[],
    notes: ProsemirrorNode,
  ) {
    // create maps of node and mark writers
    this.nodeWriters = {};
    nodeWriters.forEach((writer: PandocNodeWriter) => {
      this.nodeWriters[writer.name] = writer.write;
    });
    this.markWriters = {};
    markWriters.forEach((writer: PandocMarkWriter) => {
      this.markWriters[writer.name] = writer;
    });
    // create map of notes
    this.notes = {};
    notes.forEach((note: ProsemirrorNode) => {
      this.notes[note.attrs.ref] = note;
    });

    this.ast = {
      blocks: [],
      'pandoc-api-version': apiVersion,
      meta: {},
    };
    this.containers = [this.ast.blocks];
    this.activeMarks = [];
  }

  public output(): PandocAst {
    return this.ast;
  }

  public write(value: any) {
    const container = this.containers[this.containers.length - 1];
    container.push(value);
  }

  public writeToken(type: string, content?: (() => void) | any) {
    const token: PandocToken = {
      t: type,
    };
    if (content) {
      if (typeof content === 'function') {
        token.c = [];
        this.fill(token.c, content);
      } else {
        token.c = content;
      }
    }
    this.write(token);
  }

  public writeMark(type: string, parent: Fragment, expelEnclosingWhitespace = false) {
    if (expelEnclosingWhitespace) {
      // build output spec
      const output = {
        spaceBefore: false,
        nodes: new Array<ProsemirrorNode>(),
        spaceAfter: false,
      };

      // if we see leading or trailing spaces we need to output them as tokens
      // and substitute text nodes
      parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
        // check for leading/trailing space in first/last nodes
        if (node.isText) {
          let outputText = node.textContent;

          // checking for leading space in first node
          if (index === 0 && node.textContent.match(/^\s+/)) {
            output.spaceBefore = true;
            outputText = outputText.trimLeft();
          }

          // check for trailing space in last node
          if (index === parent.childCount - 1 && node.textContent.match(/\s+$/)) {
            output.spaceAfter = true;
            outputText = outputText.trimRight();
          }

          // if we modified the node's text then create a new node
          if (outputText !== node.textContent) {
            output.nodes.push(node.type.schema.text(outputText, node.marks));
          } else {
            output.nodes.push(node);
          }
        } else {
          output.nodes.push(node);
        }
      });

      // output space tokens before/after mark as necessary
      if (output.spaceBefore) {
        this.writeToken('Space');
      }
      this.writeToken(type, () => {
        this.writeInlines(Fragment.from(output.nodes));
      });
      if (output.spaceAfter) {
        this.writeToken('Space');
      }

      // normal codepath (not expelling existing whitespace)
    } else {
      this.writeToken(type, () => {
        this.writeInlines(parent);
      });
    }
  }

  public writeList(content: () => void) {
    const list: any[] = [];
    this.fill(list, content);
    this.write(list);
  }

  public writeAttr(id: string, classes = [], keyvalue = []) {
    this.write([id || '', classes, keyvalue]);
  }

  public writeText(text: string | null) {
    if (text) {
      const strs = text.split(' ');
      strs.forEach((value: string, i: number) => {
        if (value) {
          this.writeToken('Str', value);
          if (i < strs.length - 1) {
            this.writeToken('Space');
          }
        } else {
          this.writeToken('Space');
        }
      });
    }
  }

  public writeNote(note: ProsemirrorNode) {
    const noteBody = this.notes[note.attrs.ref];
    this.writeToken('Note', () => {
      this.writeBlocks(noteBody);
    });
  }

  public writeBlock(block: ProsemirrorNode) {
    this.nodeWriters[block.type.name](this, block);
  }

  public writeBlocks(parent: ProsemirrorNode) {
    parent.forEach(this.writeBlock.bind(this));
  }

  public writeInlines(parent: Fragment) {
    // get the marks from a node that are not already on the stack of active marks
    const nodeMarks = (node: ProsemirrorNode) => {
      // get marks -- order marks by priority (code lowest so that we never include
      // other markup inside code)
      let marks: Mark[] = node.marks.sort((a: Mark, b: Mark) => {
        const aPriority = this.markWriters[a.type.name].priority;
        const bPriority = this.markWriters[b.type.name].priority;
        if (aPriority < bPriority) {
          return -1;
        } else if (bPriority < aPriority) {
          return 1;
        } else {
          return 0;
        }
      });

      // remove active marks
      for (const activeMark of this.activeMarks) {
        marks = activeMark.removeFromSet(marks);
      }

      // return marks
      return marks;
    };

    // helpers to iterate through the nodes (sans any marks already on the stack)
    let currentChild = 0;
    const nextNode = () => {
      const childIndex = currentChild;
      currentChild++;
      return {
        node: parent.child(childIndex),
        marks: nodeMarks(parent.child(childIndex)),
      };
    };
    const putBackNode = () => {
      currentChild--;
    };

    // iterate through the nodes
    while (currentChild < parent.childCount) {
      // get the next node
      let next = nextNode();

      // if there are active marks then collect them up and call the mark handler
      // with all nodes that it contains, otherwise just process it as a plain
      // unmarked node
      if (next.marks.length > 0) {
        // get the mark and start building a list of marked nodes
        const mark = next.marks[0];
        const markedNodes: ProsemirrorNode[] = [next.node];

        // inner iteration to find nodes that have this mark
        while (currentChild < parent.childCount) {
          next = nextNode();
          if (mark.type.isInSet(next.marks)) {
            markedNodes.push(next.node);
          } else {
            // no mark found, "put back" the node
            putBackNode();
            break;
          }
        }

        // call the mark writer after noting that this mark is active (which
        // will cause subsequent recursive invocations of this function to
        // not re-process this mark)
        this.activeMarks.push(mark.type);
        this.markWriters[mark.type.name].write(this, mark, Fragment.from(markedNodes));
        this.activeMarks.pop();
      } else {
        // ordinary unmarked node, call the node writer
        this.nodeWriters[next.node.type.name](this, next.node);
      }
    }
  }

  private fill(container: any[], content: () => void) {
    this.containers.push(container);
    content();
    this.containers.pop();
  }
}
