import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Command, CommandFn } from './command';
import { IMark } from './mark';
import { INode } from './node';
import { IEditorUI } from './ui';


export interface IExtension {
  marks?: IMark[];
  nodes?: INode[];
  keymap?: (schema: Schema, mac: boolean) => { [key: string]: CommandFn };
  commands?: (schema: Schema, ui: IEditorUI) => Command[];
  inputRules?: (schema: Schema) => InputRule[];
  plugins?: (schema: Schema, ui: IEditorUI) => Plugin[];
}
