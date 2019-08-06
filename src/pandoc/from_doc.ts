import { Node as ProsemirrorNode } from 'prosemirror-model';
import { MarkdownSerializer } from 'prosemirror-markdown';

import { IPandocMarkWriter, PandocNodeWriterFn } from '../extensions/api';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  markWriters: { [name: string]: IPandocMarkWriter },
  nodeWriters: { [name: string]: PandocNodeWriterFn },
  options: { tightLists?: boolean } = {},
): string {
  const serializer = new MarkdownSerializer(nodeWriters, markWriters);
  return serializer.serialize(doc, options);
}
