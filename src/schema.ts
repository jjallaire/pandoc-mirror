import OrderedMap from 'orderedmap';

import { Node, NodeSpec, MarkSpec, Schema } from 'prosemirror-model';

import { ExtensionManager } from './extensions/manager';
import { IMark, INode } from './extensions/api';

export function editorSchema(extensions: ExtensionManager): Schema {
  
  // build in doc node + nodes from extensions
  const nodes: { [name: string]: NodeSpec } = {
    doc: {
      content: 'block+',
    }
  };
  extensions.nodes().forEach((node: INode) => {
    nodes[node.name] = node.spec;
  });

  // marks from extensions
  const marks: { [name: string]: MarkSpec } = {};
  extensions.marks().forEach((mark: IMark) => {
    marks[mark.name] = mark.spec;
  });

  // return schema
  return new Schema({
    nodes: OrderedMap.from(nodes),
    marks: OrderedMap.from(marks),
  });
}

export function emptyDoc(schema: Schema): Node {
  return schema.nodeFromJSON({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  });
}
