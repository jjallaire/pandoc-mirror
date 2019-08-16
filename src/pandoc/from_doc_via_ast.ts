

import { Node as ProsemirrorNode } from 'prosemirror-model';
import { PandocEngine } from 'api/pandoc';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  pandoc: PandocEngine,
  options: { [key: string] : any } = {},
): Promise<string> {
  
  const format = 'markdown' +
  '-auto_identifiers';    // don't inject identifiers for headers w/o them
  
  return pandoc.astToMarkdown(format, pandocAstDoc);
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