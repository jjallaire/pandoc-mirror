import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { Command, CommandFn } from './api/command';
import { IExtension } from './api/extension';
import { IMark } from './api/mark';
import { INode } from './api/node';
import { IPandocMarkWriter, IPandocReader, PandocNodeWriterFn } from './api/pandoc';
import { IEditorUI } from './api/ui';
import behaviorBasekeys from './behaviors/basekeys';
import behaviorCursor from './behaviors/cursor';
import behaviorHistory from './behaviors/history';
import behaviorSmarty from './behaviors/smarty';
import markCode from './marks/code';
import markEm from './marks/em';
import markLink from './marks/link';
import markStrong from './marks/strong';
import nodeBlockquote from './nodes/blockquote';
import nodeCodeBlock from './nodes/code_block';
import nodeHardBreak from './nodes/hard_break';
import nodeHeading from './nodes/heading';
import nodeHorizontalRule from './nodes/horizontal_rule';
import nodeImage from './nodes/image/index';
import nodeLists from './nodes/lists';
import nodeParagraph from './nodes/paragraph';
import nodeText from './nodes/text';









export class Extensions {
  public static create(): Extensions {
    const manager = new Extensions();
    manager.register([
      // behaviors
      behaviorBasekeys,
      behaviorCursor,
      behaviorSmarty,
      behaviorHistory,

      // marks
      markEm,
      markStrong,
      markCode,
      markLink,

      // nodes
      nodeText,
      nodeParagraph,
      nodeHeading,
      nodeBlockquote,
      nodeHorizontalRule,
      nodeCodeBlock,
      nodeLists,
      nodeHardBreak,
      nodeImage,
    ]);
    return manager;
  }

  private extensions: IExtension[];

  private constructor() {
    this.extensions = [];
  }

  public register(extensions: IExtension[]): void {
    this.extensions.push(...extensions);
  }

  public marks(): IMark[] {
    return this.collect<IMark>((extension: IExtension) => extension.marks);
  }

  public nodes(): INode[] {
    return this.collect<INode>((extension: IExtension) => extension.nodes);
  }

  public pandocReaders(): IPandocReader[] {
    const readers: IPandocReader[] = [];
    this.marks().forEach((mark: IMark) => {
      readers.push(...mark.pandoc.from);
    });
    this.nodes().forEach((node: INode) => {
      if (node.pandoc.from) {
        readers.push(...node.pandoc.from);
      }
    });

    return readers;
  }

  public pandocMarkWriters(): { [key: string]: IPandocMarkWriter } {
    const writers: { [key: string]: IPandocMarkWriter } = {};
    this.marks().forEach((mark: IMark) => {
      writers[mark.name] = mark.pandoc.to;
    });
    return writers;
  }

  public pandocNodeWriters(): { [key: string]: PandocNodeWriterFn } {
    const writers: { [key: string]: PandocNodeWriterFn } = {};
    this.nodes().forEach((node: INode) => {
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

  public commands(schema: Schema, ui: IEditorUI): Command[] {
    return this.collect<Command>((extension: IExtension) => {
      if (extension.commands) {
        return extension.commands(schema, ui);
      } else {
        return undefined;
      }
    });
  }

  public plugins(schema: Schema, ui: IEditorUI): Plugin[] {
    return this.collect<Plugin>((extension: IExtension) => {
      if (extension.plugins) {
        return extension.plugins(schema, ui);
      } else {
        return undefined;
      }
    });
  }

  public inputRules(schema: Schema): InputRule[] {
    return this.collect<InputRule>((extension: IExtension) => {
      if (extension.inputRules) {
        return extension.inputRules(schema);
      } else {
        return undefined;
      }
    });
  }

  private collect<T>(collector: (extension: IExtension) => T[] | undefined) {
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
