import { IExtension } from '../api/extension';

import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';

import 'prosemirror-gapcursor/style/gapcursor.css';

const extension: IExtension = {
  plugins: () => {
    return [gapCursor(), dropCursor()];
  },
};

export default extension;
