

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
  serializer.renderContent(doc);
  
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

  public openBlock(type: string, children = true) : void {
    
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

  public closeBlock() {
    this.closeContent();
  }

  public openContent() {
    const content: any[] = [];
    this.activeContent().push(content);
    this.openedContent.push(content);
  }

  public closeContent() {
    this.openedContent.pop();
  }

  public renderAny(value: any) {
    this.activeContent().push(value);
  }

  public renderAttr(id: string, classes = [], keyvalue = []) {
    this.activeContent().push([id, classes, keyvalue]);
  }

  public renderContent(parent: ProsemirrorNode) {
    parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
      this.render(node, parent, index);
    });
  }

  public renderInline(parent: ProsemirrorNode) {

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

  private activeContent() : any[] {
    return this.openedContent[this.openedContent.length-1];
  }

  private render(node: ProsemirrorNode, parent: ProsemirrorNode, index: number) {
    this.nodes[node.type.name](this, node, parent, index);
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
          "",
          [],
          []
        ],
        [
          {
            "t": "Str",
            "c": "Heading"
          },
          {
            "t": "Space"
          },
          {
            "t": "Str",
            "c": "3"
          }
        ]
      ]
    },
    {
      "t": "Para",
      "c": [
        {
          "t": "Image",
          "c": [
            [
              "",
              [],
              []
            ],
            [
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
                "c": "the"
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
                "c": "text"
              }
            ],
            [
              "https://www.rstudio.com/wp-content/uploads/2016/09/RStudio-Logo-Blue-Gray-250.png",
              "The image title"
            ]
          ]
        }
      ]
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
                "c": "Item"
              },
              {
                "t": "Space"
              },
              {
                "t": "Str",
                "c": "1"
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
                "c": "Item"
              },
              {
                "t": "Space"
              },
              {
                "t": "Str",
                "c": "2"
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
                "c": "Item"
              },
              {
                "t": "Space"
              },
              {
                "t": "Str",
                "c": "3"
              }
            ]
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
          "c": "paragraph"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "has"
        },
        {
          "t": "Space"
        },
        {
          "t": "Emph",
          "c": [
            {
              "t": "Str",
              "c": "italics"
            }
          ]
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "and"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "also"
        },
        {
          "t": "LineBreak"
        },
        {
          "t": "Str",
          "c": "includes"
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
          "c": "hard"
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
          "c": "paragraph"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "has"
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
          "t": "Str",
          "c": "."
        }
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
              "c": "paragraph"
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
              "t": "Emph",
              "c": [
                {
                  "t": "Str",
                  "c": "blockquote"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "t": "HorizontalRule"
    },
    {
      "t": "CodeBlock",
      "c": [
        [
          "",
          [
            "swift"
          ],
          []
        ],
        "Fenced code region\n"
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
          "c": "paragraph"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "has"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "some"
        },
        {
          "t": "Space"
        },
        {
          "t": "Code",
          "c": [
            [
              "",
              [],
              []
            ],
            "inline code"
          ]
        },
        {
          "t": "Str",
          "c": "."
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
          "c": "paragraph"
        },
        {
          "t": "Space"
        },
        {
          "t": "Emph",
          "c": [
            {
              "t": "Str",
              "c": "combines"
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
              "c": "and"
            },
            {
              "t": "Space"
            },
            {
              "t": "Str",
              "c": "italics"
            }
          ]
        },
        {
          "t": "Str",
          "c": "."
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
          "c": "paragraph"
        },
        {
          "t": "Space"
        },
        {
          "t": "Str",
          "c": "has"
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
          "t": "Link",
          "c": [
            [
              "",
              [],
              []
            ],
            [
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
                "t": "Str",
                "c": "Google!"
              }
            ],
            [
              "http://google.com",
              ""
            ]
          ]
        },
        {
          "t": "Str",
          "c": "."
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