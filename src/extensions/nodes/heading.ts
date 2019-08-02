
import { Schema } from 'prosemirror-model'
import { setBlockType } from 'prosemirror-commands'
import { textblockTypeInputRule } from 'prosemirror-inputrules'

import { IExtension, BlockCommand } from '../api'
import { CommandFn } from '../../utils/command';

const HEADING_LEVEL = 0;
const HEADING_CHILDREN = 2;

const kHeadingLevels = [1,2,3,4,5,6]

class HeadingCommand extends BlockCommand {
  constructor(schema: Schema, level: number) {
    super(
      "heading" + level,
      ["Shift-Ctrl-" + level],
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
    return kHeadingLevels.map(level => new HeadingCommand(schema, level))
  },

  inputRules: (schema: Schema) => {
    return [
      textblockTypeInputRule(
        new RegExp("^(#{1," + kHeadingLevels.length + "})\\s$"),
        schema.nodes.heading, 
        match => ({level: match[1].length})
      )
    ]
  }
};

export default extension;