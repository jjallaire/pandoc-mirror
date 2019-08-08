import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import 'prosemirror-gapcursor/style/gapcursor.css';
import { IExtension } from 'api/extension';

const extension: IExtension = {
  plugins: () => {
    return [gapCursor(), dropCursor()];
  },
};

export default extension;
