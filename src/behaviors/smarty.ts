import { ellipsis, emDash } from 'prosemirror-inputrules';

import { Extension } from 'api/extension';

const extension: Extension = {
  inputRules: () => {
    return [ellipsis, emDash];
  },
};

export default extension;
