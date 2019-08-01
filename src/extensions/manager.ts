

import { Schema } from 'prosemirror-model'

import { InputRule } from 'prosemirror-inputrules'

import { IExtension, IMark, INode, Command, IPandocReader } from './api'

import markEm from './marks/em'
import markStrong from './marks/strong'
import markCode from './marks/code'

import nodeHeading from './nodes/heading'
import nodeBlockquote from './nodes/blockquote'

export class ExtensionManager {

  public static create() : ExtensionManager {
    const manager = new ExtensionManager()
    manager.register(markEm)
    manager.register(markStrong)
    manager.register(markCode)
    manager.register(nodeHeading)
    manager.register(nodeBlockquote)
    return manager
  }

  private extensions: IExtension[];

  private constructor() {
    this.extensions = []
  }

  public register(extension: IExtension) : void {
    this.extensions.push(extension)
  }

  public marks() : IMark[] {
    return this.collect<IMark>((extension: IExtension) => extension.marks)
  }

  public nodes() : INode[] {
    return this.collect<INode>((extension: IExtension) => extension.nodes)  
  }

  public pandocReaders(): IPandocReader[] {
    const readers : IPandocReader[] = [];
    return readers.concat(
      this.marks().map((mark: IMark) => mark.pandoc.from),
      this.nodes().map((node: INode) => node.pandoc.from)
    )
  }

  public commands(schema: Schema): Command[] {
    return this.collect<Command>((extension: IExtension) => {
      if (extension.commands) {
        return extension.commands(schema)
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