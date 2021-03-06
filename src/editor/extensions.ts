import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

import { EditorUI } from 'editor/api/ui';
import { Command } from 'editor/api/command';
import { PandocMark } from 'editor/api/mark';
import { PandocNode } from 'editor/api/node';
import { Extension } from 'editor/api/extension';
import { PandocTokenReader, PandocMarkWriter, PandocNodeWriter } from 'editor/api/pandoc';

import { EditorConfig } from 'editor/editor';

import behaviorBasekeys from './behaviors/basekeys';
import behaviorSelectAll from './behaviors/select_all';
import behaviorCursor from './behaviors/cursor';
import behaviorHistory from './behaviors/history';
import behaviorSmarty from './behaviors/smarty';
import behaviorAttrEdit from './behaviors/attr_edit';
import behaviorTrailingP from './behaviors/trailing_p';
import markCode from './marks/code';
import markEm from './marks/em';
import markLink from './marks/link';
import markStrong from './marks/strong';
import markStrikeout from './marks/strikeout';
import markSuperscript from './marks/superscript';
import markSubscript from './marks/subscript';
import markSmallcaps from './marks/smallcaps';
import markQuoted from './marks/quoted';
import nodeBlockquote from './nodes/blockquote';
import nodeFootnote from './nodes/footnote/footnote';
import nodeCodeBlock from './nodes/code_block';
import nodeHardBreak from './nodes/hard_break';
import nodeSoftBreak from './nodes/soft_break';
import nodeHeading from './nodes/heading';
import nodeHorizontalRule from './nodes/horizontal_rule';
import nodeImage from './nodes/image/image';
import nodeLists from './nodes/list/list';
import nodeParagraph from './nodes/paragraph';
import nodeText from './nodes/text';

import codemirror from './optional/codemirror/codemirror';

export function initExtensions(config: EditorConfig): ExtensionManager {
  // create extension manager
  const manager = new ExtensionManager();

  // register built-in extensions
  manager.register([
    // behaviors
    behaviorBasekeys,
    behaviorSelectAll,
    behaviorCursor,
    behaviorSmarty,
    behaviorHistory,
    behaviorAttrEdit,
    behaviorTrailingP,

    // marks
    markEm,
    markStrong,
    markCode,
    markLink,
    markStrikeout,
    markSuperscript,
    markSubscript,
    markSmallcaps,
    markQuoted,

    // nodes
    nodeText,
    nodeParagraph,
    nodeHeading,
    nodeBlockquote,
    nodeFootnote,
    nodeHorizontalRule,
    nodeCodeBlock,
    nodeLists,
    nodeHardBreak,
    nodeSoftBreak,
    nodeImage,
  ]);

  // optional codemirror embedded editor
  if (config.options.codemirror) {
    manager.register([codemirror]);
  }

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

  public register(extensions: readonly Extension[]): void {
    this.extensions.push(...extensions);
  }

  public pandocMarks(): readonly PandocMark[] {
    return this.collect<PandocMark>((extension: Extension) => extension.marks);
  }

  public pandocNodes(): readonly PandocNode[] {
    return this.collect<PandocNode>((extension: Extension) => extension.nodes);
  }

  public pandocReaders(): readonly PandocTokenReader[] {
    const readers: PandocTokenReader[] = [];
    this.pandocMarks().forEach((mark: PandocMark) => {
      readers.push(...mark.pandoc.readers);
    });
    this.pandocNodes().forEach((node: PandocNode) => {
      if (node.pandoc.readers) {
        readers.push(...node.pandoc.readers);
      }
    });
    return readers;
  }

  public pandocMarkWriters(): readonly PandocMarkWriter[] {
    return this.pandocMarks().map((mark: PandocMark) => {
      return {
        name: mark.name,
        ...mark.pandoc.writer,
      };
    });
  }

  public pandocNodeWriters(): readonly PandocNodeWriter[] {
    return this.pandocNodes().map((node: PandocNode) => {
      return {
        name: node.name,
        write: node.pandoc.writer,
      };
    });
  }

  public commands(schema: Schema, ui: EditorUI, mac: boolean): readonly Command[] {
    return this.collect<Command>((extension: Extension) => {
      if (extension.commands) {
        return extension.commands(schema, ui, mac);
      } else {
        return undefined;
      }
    });
  }

  public plugins(schema: Schema, ui: EditorUI, mac: boolean): readonly Plugin[] {
    return this.collect<Plugin>((extension: Extension) => {
      if (extension.plugins) {
        return extension.plugins(schema, ui, mac);
      } else {
        return undefined;
      }
    });
  }

  // NOTE: return value not readonly b/c it will be fed directly to a
  // Prosemirror interface that doesn't take readonly
  public inputRules(schema: Schema): InputRule[] {
    return this.collect<InputRule>((extension: Extension) => {
      if (extension.inputRules) {
        return extension.inputRules(schema);
      } else {
        return undefined;
      }
    });
  }

  private collect<T>(collector: (extension: Extension) => readonly T[] | undefined) {
    let items: T[] = [];
    this.extensions.forEach(extension => {
      const collected: readonly T[] | undefined = collector(extension);
      if (collected !== undefined) {
        items = items.concat(collected);
      }
    });
    return items;
  }
}
