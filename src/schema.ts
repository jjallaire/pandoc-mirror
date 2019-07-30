


import OrderedMap from "orderedmap"

import { Node, NodeSpec, MarkSpec, Schema } from "prosemirror-model"

import { ExtensionManager } from "./extensions/manager"
import { IMark, INode } from "./extensions/api"


export function editorSchema(extensions: ExtensionManager) : Schema {

  // get nodes from extensions (combine with base nodes)
  const nodes: { [name: string]: NodeSpec; } = {
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
  };
  extensions.nodes().forEach((node: INode) => {
    nodes[node.name] = node.spec
  });

  // get marks from extensions
  const marks: { [name: string]: MarkSpec; } = {}
  extensions.marks().forEach((mark: IMark) => {
    marks[mark.name] = mark.spec
  });
  
  return new Schema({ 
    nodes: OrderedMap.from(nodes),
    marks: OrderedMap.from(marks), 
  });
}

export function emptyDoc(schema: Schema) : Node {
  return schema.nodeFromJSON({
    type: 'doc',
    content: [{
      type: 'paragraph',
    }],
  });
}
