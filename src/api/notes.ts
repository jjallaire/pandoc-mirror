

import { findChildren, NodeWithPos } from 'prosemirror-utils';
import { Node as ProsemirrorNode, NodeType } from 'prosemirror-model';

import { uuidv4 } from './util';

export function createNoteId() {
  return uuidv4();
}

export function findNoteNode(doc: ProsemirrorNode, ref: string) : NodeWithPos | undefined {
  return findNodeWithRef(doc, doc.type.schema.nodes.note, ref);
}

export function findFootnoteNode(doc: ProsemirrorNode, ref: string) : NodeWithPos | undefined {
  return findNodeWithRef(doc, doc.type.schema.nodes.footnote, ref);
}

function findNodeWithRef(doc: ProsemirrorNode, type: NodeType, ref: string) : NodeWithPos | undefined {
  const foundNode = findChildren(
    doc,
    node => node.type === type && node.attrs.ref === ref,
    true,
  );
  if (foundNode.length) {
    return foundNode[0];
  } else {
    return undefined;
  }
}
