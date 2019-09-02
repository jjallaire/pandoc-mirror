import { Schema, Mark, Fragment, Node as ProsemirrorNode } from 'prosemirror-model';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { findChildrenByMark } from 'prosemirror-utils';
import { getMarkRange } from 'api/mark';
import { transactionNodesAffected } from 'api/transaction';

const QUOTE_TYPE = 0;
const QUOTED_CHILDREN = 1;

const kDoubleQuoted = /“[^”]*”/;
const kSingleQuoted = /‘[^’]*’/;

enum QuoteType {
  SingleQuote = 'SingleQuote',
  DoubleQuote = 'DoubleQuote',
}

const plugin = new PluginKey('remove_quoted');

const extension: Extension = {
  marks: [
    {
      name: 'quoted',
      spec: {
        attrs: {
          type: {},
        },
        parseDOM: [
          {
            tag: "span[class='quoted']",
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                type: el.getAttribute('data-type'),
              };
            },
          },
        ],
        toDOM(mark: Mark) {
          return ['span', { class: 'quoted', 'data-type': mark.attrs.type }, 0];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Quoted',
            mark: 'quoted',
            getAttrs: (tok: PandocToken) => {
              return {
                type: tok.c[QUOTE_TYPE].t,
              };
            },
            getChildren: (tok: PandocToken) => {
              const type = tok.c[QUOTE_TYPE].t;
              const quotes = quotesForType(type);
              return [
                {
                  t: 'Str',
                  c: quotes.begin,
                },
                ...tok.c[QUOTED_CHILDREN],
                {
                  t: 'Str',
                  c: quotes.end,
                },
              ];
            },
          },
        ],
        writer: {
          priority: 3,
          write: (output: PandocOutput, mark: Mark, parent: Fragment) => {
            output.writeToken('Quoted', () => {
              output.writeToken(mark.attrs.type);
              output.writeList(() => {
                const text = parent.cut(1, parent.size - 1);
                output.writeInlines(text);
              });
            });
          },
        },
      },
    },
  ],

  // plugin to add and remove 'quoted' marks as the user edits
  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        appendTransaction: (transactions: Transaction[], _oldState: EditorState, newState: EditorState) => {
          //  transaction to append
          const tr = newState.tr;

          // iterate over all nodes affected by these transactions
          transactionNodesAffected(newState, transactions, (parentNode: ProsemirrorNode, parentPos: number) => {
            // only examine nodes that allow quoted marks
            if (parentNode.type.allowsMarkType(schema.marks.quoted)) {
              // find quoted marks where the text is no longer quoted (remove the mark)
              const quotedNodes = findChildrenByMark(parentNode, schema.marks.quoted, true);
              quotedNodes.forEach(quotedNode => {
                const quotedRange = getMarkRange(
                  newState.doc.resolve(parentPos + 1 + quotedNode.pos),
                  schema.marks.quoted,
                );
                if (quotedRange) {
                  const text = newState.doc.textBetween(quotedRange.from, quotedRange.to);
                  if (!kDoubleQuoted.test(text) && !kSingleQuoted.test(text)) {
                    tr.removeMark(quotedRange.from, quotedRange.to, schema.marks.quoted);
                  }
                }
              });

              // find quoted text that doesn't have a quoted mark (add the mark)
              const markQuotes = (type: QuoteType) => {
                const re = new RegExp(type === QuoteType.DoubleQuote ? kDoubleQuoted : kSingleQuoted, 'g');
                let match = re.exec(parentNode.textContent);
                while (match !== null) {
                  const from = parentPos + 1 + match.index;
                  const to = from + match[0].length;
                  if (!newState.doc.rangeHasMark(from, to, schema.marks.quoted)) {
                    const mark = schema.mark('quoted', { type });
                    tr.addMark(from, to, mark);
                  }
                  match = re.exec(parentNode.textContent);
                }
              };
              markQuotes(QuoteType.DoubleQuote);
              markQuotes(QuoteType.SingleQuote);
            }
          });

          // return transaction to append
          if (tr.docChanged) {
            return tr;
          }
        },
      }),
    ];
  },
};

function quotesForType(type: QuoteType) {
  const dblQuote = type === QuoteType.DoubleQuote;
  return {
    begin: dblQuote ? '“' : '‘',
    end: dblQuote ? '”' : '’',
  };
}

export default extension;
