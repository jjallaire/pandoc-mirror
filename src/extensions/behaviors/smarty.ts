import { IExtension } from '../api/extension';
import { smartQuotes, ellipsis, emDash } from 'prosemirror-inputrules';

const extension: IExtension = {
  inputRules: () => {
    return [...smartQuotes, ellipsis, emDash];
  },
};

export default extension;
