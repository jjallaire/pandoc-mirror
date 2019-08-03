import { Schema } from 'prosemirror-model';
import { IExtension, WrapCommand } from '../api';
import { wrappingInputRule } from 'prosemirror-inputrules';

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
        from: {
          token: 'BlockQuote',
          block: 'blockquote',
        },
        to: {},
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
