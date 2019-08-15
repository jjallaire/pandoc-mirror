import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Node as ProsemirrorNode, Schema, NodeType } from 'prosemirror-model';
import { PandocAstToken } from 'api/pandoc';
import { EditorState, Transaction } from 'prosemirror-state';
import { findParentNode } from 'prosemirror-utils';

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

const HEADING_LEVEL = 0;
const HEADING_ATTR = 1;
const HEADING_CHILDREN = 2;

const kHeadingLevels = [1, 2, 3, 4, 5, 6];

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

class HeadingCommand extends BlockCommand {

  public nodeType: NodeType;
  public level: number;

  constructor(schema: Schema, level: number) {
    super('heading' + level, ['Shift-Ctrl-' + level], schema.nodes.heading, schema.nodes.paragraph, { level });
    this.nodeType = schema.nodes.heading;
    this.level = level;
  }

  public isActive(state: EditorState) {
    const predicate = (n: ProsemirrorNode) => n.type === this.nodeType && n.attrs.level === this.level;
    const node = findParentNode(predicate)(state.selection);
    return !!node;
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


export default extension;
