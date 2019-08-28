import { Schema, Mark, Fragment, Node as ProsemirrorNode } from 'prosemirror-model';
import { smartQuotes } from 'prosemirror-inputrules';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { InputRule } from 'prosemirror-inputrules';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { findChildrenByMark } from 'prosemirror-utils';
import { getMarkRange, getSelectionMarkRange } from 'api/mark';
import { transactionNodesAffected } from 'api/transaction';

const QUOTE_TYPE = 0;
const QUOTED_CHILDREN = 1;

enum QuoteType {
  SingleQuote = "SingleQuote",
  DoubleQuote = "DoubleQuote"
}

const kDoubleQuoted = /“[^”]*”/;
const kSingleQuoted = /‘[^’]*’/;

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
          { tag: "span[class='quoted']" },
        ],
        toDOM() {
          return ['span', { class: 'quoted' }, 0];
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
                  t: "Str",
                  c: quotes.begin
                },
                ...tok.c[QUOTED_CHILDREN],
                {
                  t: "Str",
                  c: quotes.end
                },
              ];
            }
          },
        ],
        writer: {
          priority: 3,
          write: (output: PandocOutput, mark: Mark, parent: Fragment) => {
            output.writeToken('Quoted', () => {
              output.writeToken(mark.attrs.type);
              output.writeList(() => {
                const text = parent.cut(1, parent.size-1);
                output.writeInlines(text);
              });
            });
          },
        },
      },
    },
  ],

  // plugin to add and remove 'quoted' marks as the user edits
  
  // https://discuss.prosemirror.net/t/adding-style-on-the-fly/703/11

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        appendTransaction: (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {
          
          const tr = newState.tr;
          transactions.forEach(transaction => {
            if (transaction.docChanged) { // mask out changes that don't affect contents (e.g. selection)
              transaction.steps.forEach(step => {
                step.getMap().forEach((_oldStart: number, _oldEnd: number, newStart: number, newEnd: number) => {
                  newState.doc.nodesBetween(newStart, newEnd, (parentNode: ProsemirrorNode, parentPos: number) => {

                    // screen by nodes that allow quoted marks
                    if (parentNode.type.allowsMarkType(schema.marks.quoted)) {

                      // find quoted marks where the text is no longer surrounded by quotes
                      const quotedNodes = findChildrenByMark(parentNode, schema.marks.quoted, true);
                      quotedNodes.forEach(quotedNode => {
                        const quotedRange = getMarkRange(newState.doc.resolve(parentPos + 1 + quotedNode.pos), 
                                                        schema.marks.quoted);
                        if (quotedRange) {

                          const text = newState.doc.textBetween(quotedRange.from, quotedRange.to);
                          if (!kDoubleQuoted.test(text) && !kSingleQuoted.test(text)) {
                            tr.removeMark(quotedRange.from, quotedRange.to, schema.marks.quoted);
                          }
                        }
                      });

                      const markQuotes = (type: QuoteType) => {
                        const re = type === QuoteType.DoubleQuote ? /“[^”]*”/g : /‘[^’]*’/g;
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
                });
              });
            }
          });
          return tr;
        }
      })
    ];
  },

  

  inputRules: (schema: Schema) => {
    return [
      // quoteInputRule(schema, QuoteType.DoubleQuote),
      // quoteInputRule(schema, QuoteType.SingleQuote),
      ...smartQuotes
    ];
  },
};

function quoteInputRule(schema: Schema, type: QuoteType) {
  const dblQuote = type === QuoteType.DoubleQuote;
  const char = dblQuote ? '"' : "'";
  const quotes = quotesForType(type);
  return new InputRule(
    new RegExp(`(?:^|[\\s\\{\\[\\(\\<'"\\u2018\\u201C])((?:${char}|${quotes.begin})[^${char}]+${char})$`), 
    (state: EditorState, match: string[], start: number, end: number) => {
      const tr = state.tr;
      const quoteStart = start + match[0].indexOf(match[1]);
      const quoted = match[1].slice(1, match[1].length - 1);
      tr.addMark(quoteStart, end, schema.marks.quoted.create({ type }));
      tr.insertText(quotes.begin + quoted + quotes.end, quoteStart, end);
      tr.removeStoredMark(schema.marks.quoted); // Do not continue with mark.
      return tr;
  });
}


function quotesForType(type: QuoteType) {
  const dblQuote = type === QuoteType.DoubleQuote;
  return {
    begin: dblQuote ? "“" : "‘",
    end: dblQuote ? "”" : "’"
  };
}




export default extension;
