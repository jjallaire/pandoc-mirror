import { Node as ProsemirrorNode, Fragment, MarkType, Mark } from 'prosemirror-model';
import { PandocAst, PandocToken, PandocOutput, PandocNodeWriterFn, PandocNodeWriter, PandocMarkWriter, PandocApiVersion, PandocMarkWriterFn } from 'api/pandoc';


export function pandocFromProsemirror(
    doc: ProsemirrorNode, 
    apiVersion: 
    PandocApiVersion, 
    nodeWriters: readonly PandocNodeWriter[],
    markWriters: readonly PandocMarkWriter[]) : PandocAst {

  const writer = new PandocWriter(apiVersion, nodeWriters, markWriters);
  writer.writeBlocks(doc);
  return writer.output();

}

class PandocWriter implements PandocOutput {

  private readonly ast: PandocAst;
  private readonly nodeWriters: { [key: string]: PandocNodeWriterFn };
  private readonly markWriters: { [key: string]: PandocMarkWriterFn };
  private readonly containers: any[][];
  private readonly activeMarks: MarkType[];

  constructor(
    apiVersion: PandocApiVersion, 
    nodeWriters: readonly PandocNodeWriter[],
    markWriters: readonly PandocMarkWriter[]
  ) {
    
    // create maps of node and mark writers
    this.nodeWriters = {};
    nodeWriters.forEach((writer: PandocNodeWriter) => {
      this.nodeWriters[writer.name] = writer.write;
    });
    this.markWriters = {};
    markWriters.forEach((writer: PandocMarkWriter) => {
      this.markWriters[writer.name] = writer.write;
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

  public writeMark(type: string, parent: Fragment) {
    this.writeToken(type, () => {
      this.writeInlines(parent);
    });  
  }

  public writeList(content: () => void) {
    const list: any[] = [];
    this.fill(list, content);
    this.write(list);
  }

  public writeAttr(id: string, classes = [], keyvalue = []) {
    this.write([id || "", classes, keyvalue]);
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

  public writeBlocks(parent: ProsemirrorNode) {
    parent.forEach((node: ProsemirrorNode, _offset: number, index: number) => {
      this.nodeWriters[node.type.name](this, node);
    });
  }

  public writeInlines(parent: Fragment) {
    
    // track the current child
    let currentChild = 0;

    // helper to get the next node sans any marks already on the stack
    const nextNode = () => {
      const childIndex = currentChild;
      currentChild++;
      return {
        node: parent.child(childIndex),
        marks: this.nodeMarks(parent.child(childIndex))
      };
    };

    // iterate through the nodes
    while (currentChild < parent.childCount) {

      // get the next node
      let next = nextNode();

      // if there are active marks then collect them up and call the mark handler
      // with all nodes that it contains, otherwise just process it as a plain
      // unmarked node
      if (next.marks.length > 0) {
        const mark = next.marks[0];
        const markedNodes: ProsemirrorNode[] = [next.node];
        
        // inner iteration to find nodes that have this mark
        while (currentChild < parent.childCount) {
          next = nextNode();
          if (mark.type.isInSet(next.marks)) {
            markedNodes.push(next.node);
          } else { // no mark found, "put back" the node
            currentChild--; 
            break;
          }
        }

        // call the mark writer after noting that this mark is active (which
        // will cause subsequent recursive invocations of this function to
        // not re-process this mark) 
        this.activeMarks.push(mark.type);
        this.markWriters[mark.type.name](this, mark, Fragment.from(markedNodes));
        this.activeMarks.pop();

      } else {
        // ordinary unmarked node, call the node writer
        this.nodeWriters[next.node.type.name](this, next.node); 
      }    
    }
  }

  private nodeMarks(node: ProsemirrorNode) {
    let marks: Mark[] = node.marks;
    for (const activeMark of this.activeMarks) {
      marks = activeMark.removeFromSet(marks);
    }
    return marks;
  }

  private fill(container: any[], content: () => void) {
    this.containers.push(container);
    content();
    this.containers.pop();
  }
}


const pandocAstDoc = {
  blocks: [
    {
      t: 'Header',
      c: [
        3,
        ['myHeading', [], []],
        [
          {
            t: 'Str',
            c: 'Heading',
          },
        ],
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Strong',
          c: [
            {
              t: 'Str',
              c: 'bold',
            },
          ],
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'text.',
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Emph',
          c: [
            {
              t: 'Str',
              c: 'italic',
            },
          ],
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'text.',
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'hard',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'break.',
        },
        {
          t: 'LineBreak',
        },
        {
          t: 'Str',
          c: 'Next',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'line',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'after',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'hard',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'break.',
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'soft',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'break.',
        },
        {
          t: 'SoftBreak',
        },
        {
          t: 'Str',
          c: 'Next',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'line',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'after',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'soft',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'break.',
        },
      ],
    },
    {
      t: 'HorizontalRule',
    },
    {
      t: 'BulletList',
      c: [
        [
          {
            t: 'Plain',
            c: [
              {
                t: 'Str',
                c: 'Unordered',
              },
            ],
          },
        ],
        [
          {
            t: 'Plain',
            c: [
              {
                t: 'Str',
                c: 'List',
              },
            ],
          },
        ],
        [
          {
            t: 'Plain',
            c: [
              {
                t: 'Str',
                c: 'Here',
              },
              {
                t: 'Space',
              },
              {
                t: 'Str',
                c: 'we',
              },
              {
                t: 'Space',
              },
              {
                t: 'Str',
                c: 'go',
              },
            ],
          },
        ],
      ],
    },
    {
      t: 'OrderedList',
      c: [
        [
          2,
          {
            t: 'Decimal',
          },
          {
            t: 'Period',
          },
        ],
        [
          [
            {
              t: 'Plain',
              c: [
                {
                  t: 'Str',
                  c: 'Ordered',
                },
              ],
            },
          ],
          [
            {
              t: 'Plain',
              c: [
                {
                  t: 'Str',
                  c: 'List',
                },
              ],
            },
          ],
          [
            {
              t: 'Plain',
              c: [
                {
                  t: 'Str',
                  c: 'Example',
                },
                {
                  t: 'Space',
                },
                {
                  t: 'Str',
                  c: 'of',
                },
              ],
            },
          ],
        ],
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'a',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'link',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'to',
        },
        {
          t: 'Space',
        },
        {
          t: 'Link',
          c: [
            ['myLink', ['splat'], [['target', '_blank']]],
            [
              {
                t: 'Str',
                c: 'Google',
              },
            ],
            ['https://www.google.com', ''],
          ],
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'an',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'image:',
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Image',
          c: [
            ['myImage', ['foo', 'bar'], [['width', '400'], ['height', '200'], ['style', 'border: 1px solid;']]],
            [],
            ['content/google.png', ''],
          ],
        },
      ],
    },
    {
      t: 'CodeBlock',
      c: [['', ['r'], []], 'Here is a code block.\n\nAnother line of code.'],
    },
    {
      t: 'BlockQuote',
      c: [
        {
          t: 'Para',
          c: [
            {
              t: 'Str',
              c: 'This',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'is',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'a',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'blockquote.',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'See',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'how',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'it',
            },
            {
              t: 'Space',
            },
            {
              t: 'Str',
              c: 'runs!',
            },
          ],
        },
      ],
    },
    {
      t: 'Para',
      c: [
        {
          t: 'Str',
          c: 'This',
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'is',
        },
        {
          t: 'Space',
        },
        {
          t: 'Code',
          c: [['', ['example'], []], 'code'],
        },
        {
          t: 'Space',
        },
        {
          t: 'Str',
          c: 'text.',
        },
      ],
    },
  ],
  'pandoc-api-version': [1, 17, 5, 1],
  meta: {},
};
