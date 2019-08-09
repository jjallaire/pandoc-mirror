import { ellipsis, emDash, smartQuotes } from 'prosemirror-inputrules';
import { Extension } from 'api/extension';

const extension: Extension = {
  inputRules: () => {
    return [...smartQuotes, ellipsis, emDash];
  },
};

export default extension;
