import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import { IPandocToken } from 'api/pandoc';

const HEADING_LEVEL = 0;
const HEADING_CHILDREN = 2;

const kHeadingLevels = [1, 2, 3, 4, 5, 6];

class HeadingCommand extends BlockCommand {
  constructor(schema: Schema, level: number) {
    super('heading' + level, ['Shift-Ctrl-' + level], schema.nodes.heading, schema.nodes.paragraph, { level });
  }
}

const extension: Extension = {
  nodes: [
    {
      name: 'heading',
      spec: {
        attrs: { level: { default: 1 } },
        content: 'inline*',
        group: 'block',
        defining: true,
        parseDOM: [
          { tag: 'h1', attrs: { level: 1 } },
          { tag: 'h2', attrs: { level: 2 } },
          { tag: 'h3', attrs: { level: 3 } },
          { tag: 'h4', attrs: { level: 4 } },
          { tag: 'h5', attrs: { level: 5 } },
          { tag: 'h6', attrs: { level: 6 } },
        ],
        toDOM(node) {
          return ['h' + node.attrs.level, 0];
        },
      },
      pandoc: {
        from: [
          {
            token: 'Header',
            block: 'heading',
            getAttrs: (tok: IPandocToken) => ({
              level: tok.c[HEADING_LEVEL],
            }),
            getChildren: (tok: IPandocToken) => tok.c[HEADING_CHILDREN],
          },
        ],
        to: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.write(state.repeat('#', node.attrs.level) + ' ');
          state.renderInline(node);
          state.closeBlock(node);
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return kHeadingLevels.map(level => new HeadingCommand(schema, level));
  },

  inputRules: (schema: Schema) => {
    return [
      textblockTypeInputRule(new RegExp('^(#{1,' + kHeadingLevels.length + '})\\s$'), schema.nodes.heading, match => ({
        level: match[1].length,
      })),
    ];
  },
};

export default extension;
