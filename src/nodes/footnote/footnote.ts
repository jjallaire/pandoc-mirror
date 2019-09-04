import { Node as ProsemirrorNode, Schema } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';

import { Extension } from 'api/extension';
import { PandocOutput } from 'api/pandoc';
import { footnoteEditorKeyDownHandler, footnoteEditorDecorations, footnoteEditorNodeViews } from './editor';
import { footnoteAppendTransaction } from './transaction';

const plugin = new PluginKey('footnote');

// TODO: Implement trailing_p for notes
// TODO: Insert Footnote
// TODO: Use uuid for note ids
// TODO: flashing when switching between footnotes

// TODO: arrow selection back should move to before note (should not go to end of doc)
// TODO: ESC key gesture to close footnote view?


const extension: Extension = {
  nodes: [
    {
      name: 'footnote',
      spec: {
        inline: true,
        attrs: {
          number: { default: 1 },
          ref: {},
          content: { default: '' },
        },
        group: 'inline',
        atom: true,
        parseDOM: [
          {
            tag: "span[class='footnote']",
            getAttrs(dom: Node | string) {
              const el = dom as Element;
              return {
                ref: el.getAttribute('data-ref'),
                content: el.getAttribute('data-content'),
              };
            },
          },
        ],
        toDOM(node: ProsemirrorNode) {
          return [
            'span',
            { class: 'footnote', 'data-ref': node.attrs.ref, 'data-content': node.attrs.content },
            node.attrs.number.toString(),
          ];
        },
      },
      pandoc: {
        readers: [
          {
            token: 'Note',
            note: 'footnote',
          },
        ],
        writer: (output: PandocOutput, node: ProsemirrorNode) => {
          output.writeNote(node);
        },
      },
    },
  ],

  plugins: (schema: Schema) => {
    return [
      new Plugin({
        
        key: plugin,

        // footnote editor 
        props: { 
          handleKeyDown: footnoteEditorKeyDownHandler(schema),
          decorations: footnoteEditorDecorations(schema),
          nodeViews: footnoteEditorNodeViews(schema)
        },

        // footnote transactions (fixups, etc.)
        appendTransaction: footnoteAppendTransaction(schema),
      })
    ];
  },
};

export default extension;
