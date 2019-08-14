

import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { EditorUI } from 'api/ui';
import { CommandFn, Command } from 'api/command';
import { PandocMark } from 'api/mark';
import { PandocNode } from 'api/node';
import { Extension } from 'api/extension';
import { PandocAstReader, PandocMarkWriter, PandocNodeWriterFn } from 'api/pandoc';

import { EditorConfig } from 'editor';

import behaviorBasekeys from './behaviors/basekeys';
import behaviorCursor from './behaviors/cursor';
import behaviorHistory from './behaviors/history';
import behaviorSmarty from './behaviors/smarty';
import behaviorAttrEdit from './behaviors/attr_edit';
import markCode from './marks/code';
import markEm from './marks/em';
import markLink from './marks/link';
import markStrong from './marks/strong';
import markStrikeout from './marks/strikeout';
import markSuperscript from './marks/superscript';
import markSubscript from './marks/subscript';
import nodeBlockquote from './nodes/blockquote';
import nodeCodeBlock from './nodes/code_block';
import nodeHardBreak from './nodes/hard_break';
import nodeSoftBreak from './nodes/soft_break';
import nodeHeading from './nodes/heading';
import nodeHorizontalRule from './nodes/horizontal_rule';
import nodeImage from './nodes/image/index';
import nodeLists from './nodes/lists';
import nodeParagraph from './nodes/paragraph';
import nodeText from './nodes/text';

export function initExtensions(config: EditorConfig) : ExtensionManager {

  // create extension manager
  const manager = new ExtensionManager();

  // register built-in extensions
  manager.register([
    // behaviors
    behaviorBasekeys,
    behaviorCursor,
    behaviorSmarty,
    behaviorHistory,
    behaviorAttrEdit,

    // marks
    markEm,
    markStrong,
    markCode,
    markLink,
    markStrikeout,
    markSuperscript,
    markSubscript,

    // nodes
    nodeText,
    nodeParagraph,
    nodeHeading,
    nodeBlockquote,
    nodeHorizontalRule,
    nodeCodeBlock,
    nodeLists,
    nodeHardBreak,
    nodeSoftBreak,
    nodeImage,
  ]);

  // register external extensions
  if (config.extensions) {
    manager.register(config.extensions);
  }

  // return manager
  return manager;


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
      readers.push(...mark.pandoc.ast_reader);
    });
    this.pandocNodes().forEach((node: PandocNode) => {
      if (node.pandoc.ast_reader) {
        readers.push(...node.pandoc.ast_reader);
      }
    });

    return readers;
  }

  public pandocMarkWriters(): { [key: string]: PandocMarkWriter } {
    const writers: { [key: string]: PandocMarkWriter } = {};
    this.pandocMarks().forEach((mark: PandocMark) => {
      writers[mark.name] = mark.pandoc.markdown_writer;
    });
    return writers;
  }

  public pandocNodeWriters(): { [key: string]: PandocNodeWriterFn } {
    const writers: { [key: string]: PandocNodeWriterFn } = {};
    this.pandocNodes().forEach((node: PandocNode) => {
      writers[node.name] = node.pandoc.markdown_writer;
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

