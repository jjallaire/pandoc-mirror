import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';

import { BlockCommand } from 'api/command';
import { Extension } from 'api/extension';
import {
  pandocAttrSpec,
  pandocAttrParseDom,
  pandocAttrToDomAttr,
  pandocAttrToMarkdown,
  pandocAttrReadAST,
  pandocAttrAvailable,
} from 'api/pandoc_attr';
import { PandocAstToken } from 'api/pandoc';

const HEADING_LEVEL = 0;
const HEADING_ATTR = 1;
const HEADING_CHILDREN = 2;

const kHeadingLevels = [1, 2, 3, 4, 5, 6];

class HeadingCommand extends BlockCommand {
  constructor(schema: Schema, level: number) {
    super('heading' + level, ['Shift-Ctrl-' + level], schema.nodes.heading, schema.nodes.paragraph, { level });
  }
}

// function for getting attrs
function getHeadingAttrs(level: number) {
  return (dom: Node | string) => {
    const el = dom as Element;
    return {
      level,
      ...pandocAttrParseDom(el, {})
    };
  };
}

const extension: Extension = {

  nodes: [
    {
      name: 'heading',
      spec: {
        attrs: { 
          level: { default: 1 },
          ...pandocAttrSpec
        },
        content: 'inline*',
        group: 'block',
        defining: true,
        parseDOM: [
          { tag: 'h1', getAttrs: getHeadingAttrs(1) },
          { tag: 'h2', getAttrs: getHeadingAttrs(2) },
          { tag: 'h3', getAttrs: getHeadingAttrs(3) },
          { tag: 'h4', getAttrs: getHeadingAttrs(4) },
          { tag: 'h5', getAttrs: getHeadingAttrs(5) },
          { tag: 'h6', getAttrs: getHeadingAttrs(6) },
        ],
        toDOM(node) {
          return [
            'h' + node.attrs.level, 
            pandocAttrToDomAttr(node.attrs),
            0
          ];
        },
      },
      pandoc: {
        ast_reader: [
          {
            token: 'Header',
            block: 'heading',
            getAttrs: (tok: PandocAstToken) => ({
              level: tok.c[HEADING_LEVEL],
              ...pandocAttrReadAST(tok, HEADING_ATTR),
            }),
            getChildren: (tok: PandocAstToken) => tok.c[HEADING_CHILDREN],
          },
        ],
        markdown_writer: (state: MarkdownSerializerState, node: ProsemirrorNode) => {
          state.write(state.repeat('#', node.attrs.level) + ' ');
          state.renderInline(node);
          if (pandocAttrAvailable(node.attrs)) {
            state.write(' ');
            state.write(pandocAttrToMarkdown(node.attrs));
          }
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
