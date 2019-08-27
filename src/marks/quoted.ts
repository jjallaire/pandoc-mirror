import { Schema, Mark, Fragment } from 'prosemirror-model';
import { smartQuotes } from 'prosemirror-inputrules';

import { Extension } from 'api/extension';
import { PandocOutput, PandocToken } from 'api/pandoc';
import { InputRule } from 'prosemirror-inputrules';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { findChildrenByMark } from 'prosemirror-utils';
import { getMarkRange, getSelectionMarkRange } from 'api/mark';

const QUOTE_TYPE = 0;
const QUOTED_CHILDREN = 1;

enum QuoteType {
  SingleQuote = "SingleQuote",
  DoubleQuote = "DoubleQuote"
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

  // plugin to fixup 'quoted' mark as the user edits (e.g. removes a quote)
  
  plugins: (schema: Schema) => {
    return [
      new Plugin({
        key: plugin,
        appendTransaction: (transactions: Transaction[], oldState: EditorState, newState: EditorState) => {
          
          // TODO: the code below only handles deletion of the beginning quote so 
          // won't be good enough. Rather, we'll likely need to inspect the newState
          // and add/remove marks as necessary, e.g. using:
          //  const quotedNodes = findChildrenByMark(newState.doc, schema.marks.quoted, true);
         
          const tr = newState.tr;
          transactions.forEach(transaction => {
            if (transaction.storedMarks && schema.marks.quoted.isInSet(transaction.storedMarks)) {
              const range = getSelectionMarkRange(tr.selection, schema.marks.quoted);
              const text = newState.doc.textBetween(range.from, range.to);
              if (!/”[^”]*”/.test(text) && !/‘[^’]’/.test(text)) {
                tr.removeMark(range.from, range.to, schema.marks.quoted);
              }
            }
          });
          return tr;
        }
      })
    ];
  },

  

  inputRules: (schema: Schema) => {
    return [
      quoteInputRule(schema, QuoteType.DoubleQuote),
      quoteInputRule(schema, QuoteType.SingleQuote),
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
