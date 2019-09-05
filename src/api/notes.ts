

import { findChildren, NodeWithPos } from 'prosemirror-utils';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { uuidv4 } from './util';

export function createNoteId() {
  return uuidv4();
}

export function findNoteNode(doc: ProsemirrorNode, ref: string) : NodeWithPos | undefined {
  const noteNode = findChildren(
    doc,
    node => node.type === doc.type.schema.nodes.note && node.attrs.ref === ref,
    true,
  );
  if (noteNode.length) {
    return noteNode[0];
  } else {
    return undefined;
  }
}

