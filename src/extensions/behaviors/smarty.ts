import { ellipsis, emDash, smartQuotes } from 'prosemirror-inputrules';
import { IExtension } from '../api/extension';

const extension: IExtension = {
  inputRules: () => {
    return [...smartQuotes, ellipsis, emDash];
  },
};

export default extension;
