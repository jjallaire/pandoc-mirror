


import OrderedMap from "orderedmap"

import { Node, NodeSpec, Schema } from "prosemirror-model"

const baseNodes = {
  "doc": {
    content: "block+"
  },
  "paragraph": {
    content: "inline*",
    group: "block",
    parseDOM: [{tag: "p"}],
    toDOM() { return ["p", 0] }
  },
  "text": {
    group: "inline",
    toDOM(node: Node) : any { return node.text }
  }
}


export function pandocSchema() : Schema {

  const nodes = OrderedMap.from({
    "doc": { 
      content: "block+" 
    },
    "paragraph": {
      content: "inline*",
      group: "block",
      parseDOM: [{tag: "p"}],
      toDOM(node: Node) : any { return ["p", 0] }
    },
    "text": {
      group: "inline",
      toDOM(node: Node) : any { return node.text }
    }
  });
  
  
  

  return new Schema({ nodes });
}

export function pandocEmptyDoc(schema: Schema) : Node {
  return schema.nodeFromJSON({
    type: 'doc',
    content: [{
      type: 'paragraph',
    }],
  });
}
