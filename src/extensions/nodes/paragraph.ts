import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { BlockCommand } from 'extensions/api/command';
import { IExtension } from 'extensions/api/extension';


const extension: IExtension = {
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
        from: [{ token: 'Para', block: 'paragraph' }, { token: 'Plain', block: 'paragraph' }],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
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
