import { IExtension } from '../api';

import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';

import 'prosemirror-gapcursor/style/gapcursor.css';

const extension: IExtension = {
  plugins: () => {
    return [
      gapCursor(), 
      dropCursor()
    ];
  },
};

export default extension;
