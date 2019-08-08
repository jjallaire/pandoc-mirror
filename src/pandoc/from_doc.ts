import { MarkdownSerializer } from 'prosemirror-markdown';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { IPandocMarkWriter, PandocNodeWriterFn } from '../extensions/api/pandoc';


export function markdownFromDoc(
  doc: ProsemirrorNode,
  markWriters: { [name: string]: IPandocMarkWriter },
  nodeWriters: { [name: string]: PandocNodeWriterFn },
  options: { tightLists?: boolean } = {},
): string {
  const serializer = new MarkdownSerializer(nodeWriters, markWriters);
  return serializer.serialize(doc, options);
}
