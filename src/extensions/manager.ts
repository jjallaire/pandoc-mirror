

import { Schema } from 'prosemirror-model'


import { IExtension, IMark, INode, Command, IPandocReader } from './api'

import markEm from './marks/em'
import markStrong from './marks/strong'
import markCode from './marks/code'

import nodeHeading from './nodes/heading'

export class ExtensionManager {

  public static create() : ExtensionManager {
    const manager = new ExtensionManager()
    manager.register(markEm)
    manager.register(markStrong)
    manager.register(markCode)
    manager.register(nodeHeading)
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

  public commands(schema: Schema): Command[] {
    return this.collect<Command>((extension: IExtension) => {
      if (extension.commands) {
        return extension.commands(schema)
      } else {
        return undefined
      }
    })
  }

  public pandocReaders(): IPandocReader[] {
    const readers : IPandocReader[] = [];
    return readers.concat(
      this.marks().map((mark: IMark) => mark.pandoc.from),
      this.nodes().map((node: INode) => node.pandoc.from)
    )
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