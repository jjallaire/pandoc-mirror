import { Schema } from 'prosemirror-model';

import { Command, insertNode } from 'api/command';
import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { InputRule } from 'prosemirror-inputrules';
import { findParentNodeOfType } from 'prosemirror-utils';
import { EditorState } from 'prosemirror-state';

const extension: Extension = {
  nodes: [
    {
      name: 'horizontal_rule',
      spec: {
        group: 'block',
        parseDOM: [{ tag: 'hr' }],
        toDOM() {
          return ['div', ['hr']];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'HorizontalRule',
            node: 'horizontal_rule',
          },
        ],
        writer: (output: PandocOutput) => {
          output.writeToken('HorizontalRule');
        },
      },
    },
  ],

  commands: (schema: Schema) => {
    return [new Command('horizontal_rule', ['Mod-_'], insertNode(schema.nodes.horizontal_rule))];
  },

  inputRules: (schema: Schema) => {

    return [
      new InputRule(/^\*{3}$/, (state: EditorState, match: string[], start: number, end: number) => {
        const paraNode = findParentNodeOfType(schema.nodes.paragraph)(state.selection);
        if (paraNode && state.selection.$anchor.depth === 2) { // only in top-level paragraphs
          return state.tr.replaceRangeWith(start, end, schema.nodes.horizontal_rule.create());
        } else {
          return null;
        }
      })
    ];
  },
};

export default extension;
