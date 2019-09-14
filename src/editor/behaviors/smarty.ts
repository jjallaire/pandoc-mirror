import { smartQuotes, ellipsis, emDash } from 'prosemirror-inputrules';

import { Extension } from 'editor/api/extension';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

const plugin = new PluginKey('smartypaste');

const extension: Extension = {
  inputRules: () => {
    return [...smartQuotes, ellipsis, emDash];
  },

  plugins: (schema: Schema) => {
    return [
      // apply smarty rules to plain text pastes
      new Plugin({
        key: plugin,
        props: {
          transformPastedText(text: string) {
            // double quotes
            text = text.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(")/g, x => {
              return x.slice(0, x.length - 1) + '“';
            });
            text = text.replace(/"/g, '”');

            // single quotes
            text = text.replace(/(?:^|[\s\{\[\(\<'"\u2018\u201C])(')/g, x => {
              return x.slice(0, x.length - 1) + '‘';
            });
            text = text.replace(/'/g, '’');

            // emdash
            text = text.replace(/--/, '—');

            // ellipses
            text = text.replace(/\.\.\./, '…');

            return text;
          },
        },
      }),
    ];
  },
};

export default extension;
