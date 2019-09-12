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
  inputRules?: (schema: Schema) => readonly InputRule[];
  commands?: (schema: Schema, ui: EditorUI, mac: boolean) => readonly Command[];
  plugins?: (schema: Schema, ui: EditorUI, mac: boolean) => readonly Plugin[];
}
