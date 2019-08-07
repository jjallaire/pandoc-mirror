import { IPandocReader, IPandocToken } from '../extensions/api';
import { ExtensionManager } from '../extensions/manager';

export function pandocReaders(extensions: ExtensionManager): IPandocReader[] {
  // start with built in readers
  const readers: IPandocReader[] = [
    { token: 'Str', text: true, getText: (tok: IPandocToken) => tok.c },
    { token: 'Space', text: true, getText: (tok: IPandocToken) => ' ' },
    { token: 'SoftBreak', text: true, getText: (tok: IPandocToken) => ' '}
  ];

  // add readers from extensions
  return readers.concat(extensions.pandocReaders());
}
