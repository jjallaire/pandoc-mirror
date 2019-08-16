import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';

const extension: Extension = {
  nodes: [
    {
      name: 'paragraph',
      spec: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{ tag: 'p' }],
        toDOM() {
          return ['p', 0];
        },
      },
      pandoc: {
        ast_readers: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
        ast_writer: (
          state: AstSerializerState,
          node: ProsemirrorNode,
          parent: ProsemirrorNode,
          index: number
        ) => {
          state.openBlock("Para");
          state.renderInline(node);
          state.closeBlock();
        },
        markdown_writer: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.renderInline(node);
          state.closeBlock(node);
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new BlockCommand('paragraph', ['Shift-Ctrl-0'], schema.nodes.paragraph, schema.nodes.paragraph)];
  },
};

export default extension;
