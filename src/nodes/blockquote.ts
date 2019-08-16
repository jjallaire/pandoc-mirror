import { wrappingInputRule } from 'prosemirror-inputrules';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { WrapCommand } from 'api/command';
import { Extension } from 'api/extension';
import { AstSerializerState } from 'pandoc/from_doc_via_ast';

const extension: Extension = {
  nodes: [
    {
      name: 'blockquote',
      spec: {
        content: 'block+',
        group: 'block',
        parseDOM: [{ tag: 'blockquote' }],
        toDOM() {
          return ['blockquote', 0];
        },
      },
      pandoc: {
        ast_readers: [
          {
            token: 'BlockQuote',
            block: 'blockquote',
          },
        ],
        ast_writer: (state: AstSerializerState, node: ProsemirrorNode) => {
          state.renderBlock("BlockQuote", () => {
            state.renderContent(node);
          });
        },
        markdown_writer: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.wrapBlock('> ', undefined, node, () => state.renderContent(node));
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new WrapCommand('blockquote', ['Ctrl->'], schema.nodes.blockquote)];
  },

  inputRules: (schema: Schema) => {
    return [wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote)];
  },
};

export default extension;
