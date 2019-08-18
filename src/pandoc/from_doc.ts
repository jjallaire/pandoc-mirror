import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocEngine, PandocToken, PandocOutput, PandocNodeWriterFn } from 'api/pandoc';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  nodeWriters: { [key: string]: PandocNodeWriterFn },
  pandoc: PandocEngine
): Promise<string> {
  
  // render to ast
  const writer = new PandocWriter(nodeWriters);
  writer.writeBlocks(doc);
  
  // ast to markdown
  const format = 'markdown' 
    + '-auto_identifiers'; // don't inject identifiers for headers w/o them
  return pandoc.astToMarkdown(format, writer.output());
}

class PandocWriter implements PandocOutput {

  private ast: PandocAst;
  private nodes: { [key: string]: PandocNodeWriterFn };
  private containers: any[][];

  constructor(nodes: { [key: string]: PandocNodeWriterFn }) {
    this.nodes = nodes;
    this.ast = {
      blocks: [],
      'pandoc-api-version': [1, 17, 5, 1],
      meta: {},
    };
    this.containers = [this.ast.blocks];
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
      this.nodes[node.type.name](this, node, parent, index);
    });
  }

  public writeInlines(parent: ProsemirrorNode) {
    parent.forEach((node: ProsemirrorNode, _offset: number, index: number) => {
      // TODO: juxtopose marks

      this.nodes[node.type.name](this, node, parent, index);
    });
  }

  private fill(container: any[], content: () => void) {
    this.containers.push(container);
    content();
    this.containers.pop();
  }
}

interface PandocAst {
  blocks: PandocToken[];
  'pandoc-api-version': number[];
  meta: any;
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
