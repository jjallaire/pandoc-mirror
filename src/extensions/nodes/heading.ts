
import { Schema } from 'prosemirror-model'
import { IExtension, BlockCommand } from '../api'

const HEADING_LEVEL = 0;
const HEADING_CHILDREN = 2;

class HeadingCommand extends BlockCommand {
  constructor(schema: Schema, level: number) {
    super(
      "heading" + level,
      null,
      schema.nodes.heading, 
      schema.nodes.paragraph,
      { level }
    )
  }
}

const extension : IExtension = {
  
  nodes: [{
    name: "heading",
    spec: {
      attrs: {level: {default: 1}},
      content: "inline*",
      group: "block",
      defining: true,
      parseDOM: [{tag: "h1", attrs: {level: 1}},
                 {tag: "h2", attrs: {level: 2}},
                 {tag: "h3", attrs: {level: 3}},
                 {tag: "h4", attrs: {level: 4}},
                 {tag: "h5", attrs: {level: 5}},
                 {tag: "h6", attrs: {level: 6}}],
      toDOM(node) { return ["h" + node.attrs.level, 0] }
    },
    pandoc: {
      from: {
        token: "Header",
        block: "heading", 
        getAttrs: tok => ({
          level: tok.c[HEADING_LEVEL]
        }),
        getChildren: tok => tok.c[HEADING_CHILDREN]
      },
      to: {}
    },
  }],
  
  commands: (schema: Schema) => {
    return [
      new HeadingCommand(schema, 1),
      new HeadingCommand(schema, 2),
      new HeadingCommand(schema, 3),
      new HeadingCommand(schema, 4),
      new HeadingCommand(schema, 5),
      new HeadingCommand(schema, 6),
    ]
  }
};

export default extension;