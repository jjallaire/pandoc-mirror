

import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocEngine, PandocAstToken, PandocAstNodeWriterFn } from 'api/pandoc';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  nodeWriters: { [key: string] : PandocAstNodeWriterFn }, 
  pandoc: PandocEngine,
  options: { [key: string] : any } = {},
): Promise<string> {
  
  // render to ast
  const serializer = new AstSerializerState(nodeWriters);
  serializer.renderBlocks(doc);
  
  // ast to markdown
  const format = 'markdown' +
    '-auto_identifiers';    // don't inject identifiers for headers w/o them
  return pandoc.astToMarkdown(format, serializer.pandocAst());
}

export class AstSerializerState {

  private ast: PandocAst; 
  private nodes: { [key: string]: PandocAstNodeWriterFn };
  private openedContent: any[][];

  constructor(nodes: { [key: string]: PandocAstNodeWriterFn }) {
    this.nodes = nodes;
    this.ast = {
      "blocks": [

      ],
      "pandoc-api-version": [
        1,
        17,
        5,
        1
      ],
      "meta": {}
    };
    this.openedContent = [this.ast.blocks];
  }

  public pandocAst() : PandocAst {
    return this.ast;
  }

  
  public renderBlock(type: string, render?: () => void) {
    this.openBlock(type, !!render);
    if (render) {
      render();
      this.closeContent();
    }
  }

  public renderList(render: () => void) {
    this.openList();
    render();
    this.closeContent();
  }

  public renderValue(value: any) {
    this.activeContent().push(value);
  }

  public renderAttr(id: string, classes = [], keyvalue = []) {
    this.activeContent().push([id, classes, keyvalue]);
  }

  public renderBlocks(parent: ProsemirrorNode) {
    parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
      this.nodes[node.type.name](this, node, parent, index);
    });
  }

  public renderInlines(parent: ProsemirrorNode) {

    const content = this.activeContent();
  
    parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
      const strs = node.textContent.split(' ');
      strs.forEach((value: string, i: number) => {
        if (value) {
          content.push({ t: "Str", c: value });
          if (i < (strs.length-1)) {
            content.push( { t: "Space" });
          }
        } else {
          content.push( { t: "Space" });
        }
      });
    });
  }

  private openBlock(type: string, children = true) : void {
    
    // create block to add
    const block: PandocAstToken = {
      t: type
    };
    if (children) {
      block.c = [];
    }

    // add to appropriate container
    this.activeContent().push(block);

    // track opened content
    if (children) {
      this.openedContent.push(block.c);
    }

  }

  private openList() {
    const list: any[] = [];
    this.activeContent().push(list);
    this.openedContent.push(list);
  }

  private closeContent() {
    this.openedContent.pop();
  }

  private activeContent() : any[] {
    return this.openedContent[this.openedContent.length-1];
  }
  
}

interface PandocAst { 
  blocks : PandocAstToken[]; 
  "pandoc-api-version": number[];
  meta: any;
}



const pandocAstDoc = {
  "blocks": [
    {
      "t": "Header",
      "c": [
        3,
        [
          "myHeading",
          [],
          []
        ],
        [
          {
            "t": "Str",
            "c": "Heading"
          }
        ]
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Strong",
          "c": [
            {
              "t": "Str",
              "c": "bold"
            }
          ]
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "text."
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Emph",
          "c": [
            {
              "t": "Str",
              "c": "italic"
            }
          ]
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "text."
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "hard"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "break."
        },
        {
          "t": "LineBreak"
        },
        {
          "t": "Str",
          "c": "Next"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "line"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "after"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "hard"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "break."
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "soft"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "break."
        },
        {
          "t": "SoftBreak"
        },
        {
          "t": "Str",
          "c": "Next"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "line"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "after"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "soft"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "break."
        }
      ]
    },
    {
      "t": "HorizontalRule"
    },
    {
      "t": "BulletList",
      "c": [
        [
          {
            "t": "Plain",
            "c": [
              {
                "t": "Str",
                "c": "Unordered"
              }
            ]
          }
        ],
        [
          {
            "t": "Plain",
            "c": [
              {
                "t": "Str",
                "c": "List"
              }
            ]
          }
        ],
        [
          {
            "t": "Plain",
            "c": [
              {
                "t": "Str",
                "c": "Here"
              },
              {
                "t": "Space"
              },
              {
                "t": "Str",
                "c": "we"
              },
              {
                "t": "Space"
              },
              {
                "t": "Str",
                "c": "go"
              }
            ]
          }
        ]
      ]
    },
    {
      "t": "OrderedList",
      "c": [
        [
          2,
          {
            "t": "Decimal"
          },
          {
            "t": "Period"
          }
        ],
        [
          [
            {
              "t": "Plain",
              "c": [
                {
                  "t": "Str",
                  "c": "Ordered"
                }
              ]
            }
          ],
          [
            {
              "t": "Plain",
              "c": [
                {
                  "t": "Str",
                  "c": "List"
                }
              ]
            }
          ],
          [
            {
              "t": "Plain",
              "c": [
                {
                  "t": "Str",
                  "c": "Example"
                },
                {
                  "t": "Space"
                },
                {
                  "t": "Str",
                  "c": "of"
                }
              ]
            }
          ]
        ]
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "a"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "link"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "to"
        },
        {
          "t": "Space"
        },
        {
          "t": "Link",
          "c": [
            [
              "myLink",
              [
                "splat"
              ],
              [
                [
                  "target",
                  "_blank"
                ]
              ]
            ],
            [
              {
                "t": "Str",
                "c": "Google"
              }
            ],
            [
              "https://www.google.com",
              ""
            ]
          ]
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "an"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "image:"
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Image",
          "c": [
            [
              "myImage",
              [
                "foo",
                "bar"
              ],
              [
                [
                  "width",
                  "400"
                ],
                [
                  "height",
                  "200"
                ],
                [
                  "style",
                  "border: 1px solid;"
                ]
              ]
            ],
            [],
            [
              "content/google.png",
              ""
            ]
          ]
        }
      ]
    },
    {
      "t": "CodeBlock",
      "c": [
        [
          "",
          [
            "r"
          ],
          []
        ],
        "Here is a code block.\n\nAnother line of code."
      ]
    },
    {
      "t": "BlockQuote",
      "c": [
        {
          "t": "Para",
          "c": [
            {
              "t": "Str",
              "c": "This"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "is"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "a"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "blockquote."
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "See"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "how"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "it"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "runs!"
            }
          ]
        }
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Str",
          "c": "This"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "is"
        },
        {
          "t": "Space"
        },
        {
          "t": "Code",
          "c": [
            [
              "",
              [
                "example"
              ],
              []
            ],
            "code"
          ]
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "text."
        }
      ]
    }
  ],
  "pandoc-api-version": [
    1,
    17,
    5,
    1
  ],
  "meta": {}
};