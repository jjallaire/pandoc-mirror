import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { Command, CommandFn } from './command';
import { PandocMark } from './mark';
import { PandocNode } from './node';
import { EditorUI } from './ui';

export interface Extension {
  marks?: PandocMark[];
  nodes?: PandocNode[];
  keymap?: (schema: Schema, mac: boolean) => { [key: string]: CommandFn };
  commands?: (schema: Schema, ui: EditorUI) => Command[];
  inputRules?: (schema: Schema) => InputRule[];
  plugins?: (schema: Schema, ui: EditorUI) => Plugin[];
}
