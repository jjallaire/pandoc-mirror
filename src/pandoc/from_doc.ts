import { MarkdownSerializer } from 'prosemirror-markdown';
import { Node as ProsemirrorNode } from 'prosemirror-model';

import { PandocMarkWriter, PandocNodeWriterFn } from 'api/pandoc';

export function markdownFromDoc(
  doc: ProsemirrorNode,
  markWriters: { [name: string]: PandocMarkWriter },
  nodeWriters: { [name: string]: PandocNodeWriterFn },
  options: { tightLists?: boolean } = {},
): string {
  const serializer = new MarkdownSerializer(nodeWriters, markWriters);
  return serializer.serialize(doc, options);
}
