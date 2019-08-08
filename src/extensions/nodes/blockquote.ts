import { wrappingInputRule } from 'prosemirror-inputrules';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { WrapCommand } from '../api/command';
import { IExtension } from '../api/extension';

const extension: IExtension = {
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
        from: [
          {
            token: 'BlockQuote',
            block: 'blockquote',
          },
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
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
