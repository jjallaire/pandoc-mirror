


import OrderedMap from "orderedmap"

import { Node, NodeSpec, Schema } from "prosemirror-model"



export function pandocSchema() : Schema {

  const baseNodes : OrderedMap<NodeSpec> = OrderedMap.from({
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
  
  const nodes : OrderedMap<NodeSpec> = baseNodes;
  
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
