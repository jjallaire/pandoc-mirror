import { Schema } from 'prosemirror-model';
import { InputRule } from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';

import { IMark } from './mark';
import { INode } from './node';
import { Command, CommandFn } from './command';
import { IEditorUI } from './ui';

export interface IExtension {
  marks?: IMark[];
  nodes?: INode[];
  keymap?: (schema: Schema, mac: boolean) => { [key: string]: CommandFn };
  commands?: (schema: Schema, ui: IEditorUI) => Command[];
  inputRules?: (schema: Schema) => InputRule[];
  plugins?: (schema: Schema, ui: IEditorUI) => Plugin[];
}
