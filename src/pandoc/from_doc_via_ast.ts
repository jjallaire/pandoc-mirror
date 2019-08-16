

import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocEngine, PandocAstToken, PandocAstNodeWriterFn } from 'api/pandoc';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  nodeWriters: { [key: string] : PandocAstNodeWriterFn }, 
  pandoc: PandocEngine,
  options: { [key: string] : any } = {},
): Promise<string> {
  
  const format = 'markdown' +
    '-auto_identifiers';    // don't inject identifiers for headers w/o them
  
  const serializer = new AstSerializer(nodeWriters);

  return pandoc.astToMarkdown(format, serializer.serialize(doc));
}


interface PandocAst { 
  "blocks" : PandocAstToken[]; 
  "pandoc-api-version": number[];
  "meta": any;
}

class AstSerializer {
  private nodes: { [key: string]: PandocAstNodeWriterFn };

  constructor(nodes: { [key: string]: PandocAstNodeWriterFn }) {
    this.nodes = nodes;
  }

  public serialize(doc: ProsemirrorNode) : PandocAst {
    const state = new AstSerializerStateImpl(this.nodes);
    state.renderContent(doc);
    return state.pandocAst();
  }
}

export interface AstSerializerState {
  openBlock(type: string, children?: boolean): void;
  closeBlock() : void;
  render(node: ProsemirrorNode, parent: ProsemirrorNode, index: number) : void;
  renderInline(parent: ProsemirrorNode) : void;
  renderContent(parent: ProsemirrorNode) : void;
}

class AstSerializerStateImpl implements AstSerializerState {

  private ast: PandocAst; 
  
  private opendedBlocks: PandocAstToken[];


  private nodes: { [key: string]: PandocAstNodeWriterFn };

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
    this.opendedBlocks = [];

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
    const container = this.opendedBlocks.length ? this.opendedBlocks[this.opendedBlocks.length-1].c : this.ast.blocks;
    container.push(block);

    // track opened blocks
    this.opendedBlocks.push(block);
  }

  public closeBlock() {
    this.opendedBlocks.pop();
  }

  public render(node: ProsemirrorNode, parent: ProsemirrorNode, index: number) {
    this.nodes[node.type.name](this, node, parent, index);
  }

  public renderInline(parent: ProsemirrorNode) {

    const block = this.activeBlock();

    parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
      const strs = node.textContent.split(' ');
      strs.forEach((value: string, i: number) => {
        if (value) {
          block.c.push({ t: "Str", c: value });
          if (i < (strs.length-1)) {
            block.c.push( { t: "Space" });
          }
        } else {
          block.c.push( { t: "Space" });
        }
      });
    });

  }

  public renderContent(parent: ProsemirrorNode) {
    parent.forEach((node: ProsemirrorNode, offset: number, index: number) => {
      this.render(node, parent, index);
    });
  }

  public pandocAst() : PandocAst {
    return this.ast;
  }


  private activeBlock() : PandocAstToken {
    return this.opendedBlocks[this.opendedBlocks.length-1];
  }
  
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