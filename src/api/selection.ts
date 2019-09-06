

import { Selection } from 'prosemirror-state';
import { NodeWithPos } from 'prosemirror-utils';
 
export function selectionIsWithin(selection: Selection, nodeWithPos: NodeWithPos) {
  const begin = nodeWithPos.pos + 1;
  const end = begin + nodeWithPos.node.nodeSize;
  return selection.anchor >= begin && selection.anchor <= end;
}