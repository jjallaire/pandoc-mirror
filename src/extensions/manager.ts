

import { Schema } from 'prosemirror-model'


import { IExtension, IMark, INode, Command } from './api'

import markStrong from './marks/strong'

export class ExtensionManager {

  public static create() : ExtensionManager {
    const manager = new ExtensionManager();
    manager.register(markStrong);
    return manager;
  }

  private extensions: IExtension[];

  private constructor() {
    this.extensions = [];
  }

  public register(extension: IExtension) : void {
    this.extensions.push(extension);
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
        return undefined;
      }
    })
  }


  private collect<T>(collector: (extension: IExtension) => T[] | undefined) {
    let items : T[] = [];
    this.extensions.forEach(extension => {
      const collected : T[] | undefined = collector(extension)
      if (collected !== undefined) {
        items = items.concat(collected);
      }
    });
    return items; 
  }
}