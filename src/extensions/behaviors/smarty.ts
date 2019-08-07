import { IExtension } from '../api';
import { smartQuotes, ellipsis, emDash } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';

const extension: IExtension = {
  inputRules: (schema: Schema) => {
    return [...smartQuotes, ellipsis, emDash];
  },
};

export default extension;
