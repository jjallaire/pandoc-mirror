

import { Schema } from 'prosemirror-model'

import { InputRule } from 'prosemirror-inputrules'

import { IExtension, IMark, INode, Command, IPandocReader, IEditorUI } from './api'

import markEm from './marks/em'
import markStrong from './marks/strong'
import markCode from './marks/code'
import markLink from './marks/link'

import nodeHeading from './nodes/heading'
import nodeBlockquote from './nodes/blockquote'
import nodeCodeBlock from './nodes/code_block'
import nodeHorizontalRule from './nodes/horizontal_rule'
import nodeLists from './nodes/lists'
import nodeHardBreak from './nodes/hard_break'

import { CommandFn } from 'src/utils/command';

export class ExtensionManager {

  public static create() : ExtensionManager {
    const manager = new ExtensionManager()
    manager.register([
      markEm, 
      markStrong,
      markCode,
      markLink,
      nodeHeading,
      nodeBlockquote,
      nodeHorizontalRule,
      nodeCodeBlock,
      nodeLists,
      nodeHardBreak
    ]);
    return manager
  }

  private extensions: IExtension[];

  private constructor() {
    this.extensions = []
  }

  public register(extensions: IExtension[]) : void {
    this.extensions.push(...extensions)
  }

  public marks() : IMark[] {
    return this.collect<IMark>((extension: IExtension) => extension.marks)
  }

  public nodes() : INode[] {
    return this.collect<INode>((extension: IExtension) => extension.nodes)  
  }

  public pandocReaders(): IPandocReader[] {
    const readers : IPandocReader[] = [];
    this.marks().forEach((mark: IMark) => {
      if (mark.pandoc) {
        readers.push(mark.pandoc.from)
      }
    })
    this.nodes().forEach((node: INode) => {
      if (node.pandoc) {
        readers.push(node.pandoc.from)
      }
    })

    return readers;
  }

  public keymap(schema: Schema, mac: boolean): { [key: string]: CommandFn } {
    let keys : { [key: string] : CommandFn } = {}
    this.extensions.forEach(extension => {
      if (extension.keymap) {
        keys = { ...keys, ...extension.keymap(schema, mac) }
      }
    })
    return keys;
  }

  public commands(schema: Schema, ui: IEditorUI): Command[] {
    return this.collect<Command>((extension: IExtension) => {
      if (extension.commands) {
        return extension.commands(schema, ui)
      } else {
        return undefined
      }
    })
  }

  public inputRules(schema: Schema) : InputRule[] {
    return this.collect<InputRule>((extension: IExtension) => {
      if (extension.inputRules) {
        return extension.inputRules(schema)
      } else {
        return undefined
      }
    })
  }


  private collect<T>(collector: (extension: IExtension) => T[] | undefined) {
    let items : T[] = []
    this.extensions.forEach(extension => {
      const collected : T[] | undefined = collector(extension)
      if (collected !== undefined) {
        items = items.concat(collected)
      }
    });
    return items
  }
}