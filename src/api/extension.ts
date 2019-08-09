import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { Command, CommandFn } from './command';
import { PandocMark } from './mark';
import { PandocNode } from './node';
import { EditorUI } from './ui';
import { PandocAstReader, PandocMarkWriter, PandocNodeWriterFn } from './pandoc';

export interface Extension {
  marks?: PandocMark[];
  nodes?: PandocNode[];
  keymap?: (schema: Schema, mac: boolean) => { [key: string]: CommandFn };
  commands?: (schema: Schema, ui: EditorUI) => Command[];
  inputRules?: (schema: Schema) => InputRule[];
  plugins?: (schema: Schema, ui: EditorUI) => Plugin[];
}

export class ExtensionManager {
  private extensions: Extension[];

  public constructor() {
    this.extensions = [];
  }

  public register(extensions: Extension[]): void {
    this.extensions.push(...extensions);
  }

  public pandocMarks(): PandocMark[] {
    return this.collect<PandocMark>((extension: Extension) => extension.marks);
  }

  public pandocNodes(): PandocNode[] {
    return this.collect<PandocNode>((extension: Extension) => extension.nodes);
  }

  public pandocAstReaders(): PandocAstReader[] {
    const readers: PandocAstReader[] = [];
    this.pandocMarks().forEach((mark: PandocMark) => {
      readers.push(...mark.pandoc.from);
    });
    this.pandocNodes().forEach((node: PandocNode) => {
      if (node.pandoc.from) {
        readers.push(...node.pandoc.from);
      }
    });

    return readers;
  }

  public pandocMarkWriters(): { [key: string]: PandocMarkWriter } {
    const writers: { [key: string]: PandocMarkWriter } = {};
    this.pandocMarks().forEach((mark: PandocMark) => {
      writers[mark.name] = mark.pandoc.to;
    });
    return writers;
  }

  public pandocNodeWriters(): { [key: string]: PandocNodeWriterFn } {
    const writers: { [key: string]: PandocNodeWriterFn } = {};
    this.pandocNodes().forEach((node: PandocNode) => {
      writers[node.name] = node.pandoc.to;
    });
    return writers;
  }

  public keymap(schema: Schema, mac: boolean): { [key: string]: CommandFn } {
    let keys: { [key: string]: CommandFn } = {};
    this.extensions.forEach(extension => {
      if (extension.keymap) {
        keys = { ...keys, ...extension.keymap(schema, mac) };
      }
    });
    return keys;
  }

  public commands(schema: Schema, ui: EditorUI): Command[] {
    return this.collect<Command>((extension: Extension) => {
      if (extension.commands) {
        return extension.commands(schema, ui);
      } else {
        return undefined;
      }
    });
  }

  public plugins(schema: Schema, ui: EditorUI): Plugin[] {
    return this.collect<Plugin>((extension: Extension) => {
      if (extension.plugins) {
        return extension.plugins(schema, ui);
      } else {
        return undefined;
      }
    });
  }

  public inputRules(schema: Schema): InputRule[] {
    return this.collect<InputRule>((extension: Extension) => {
      if (extension.inputRules) {
        return extension.inputRules(schema);
      } else {
        return undefined;
      }
    });
  }

  private collect<T>(collector: (extension: Extension) => T[] | undefined) {
    let items: T[] = [];
    this.extensions.forEach(extension => {
      const collected: T[] | undefined = collector(extension);
      if (collected !== undefined) {
        items = items.concat(collected);
      }
    });
    return items;
  }
}
