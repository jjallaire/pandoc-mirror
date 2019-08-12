import { Node } from 'prosemirror-model';
import { PandocAstToken } from './pandoc';
import { MarkdownSerializerState } from 'prosemirror-markdown';

const PANDOC_ATTR_ID = 0;
const PANDOC_ATTR_CLASSES = 1;
const PANDOC_ATTR_KEYVAULE = 2;

export const pandocAttrSpec = {
  id: { default: null },
  classes: { default: [] },
  keyvalue: { default: [] }
};

export function pandocAttrAvailable(attrs: any) {
  return attrs.id || attrs.classes || attrs.keyvalue;
}

export function pandocAttrParseDOM(el: Element) {
  const clz = el.getAttribute('class');
  return {
    id: el.getAttribute('id') || null,
    classes: clz ? clz.split(/\s+/) : [],
  };
}

export function pandocAttrToDOM(attrs: any) {
  return {
    id: attrs.id,
    class: attrs.classes ? attrs.classes.join(' ') : null
  };
}

export function pandocAttrReadAST(tok: PandocAstToken, index: number) {
  const pandocAttr = tok.c[index];
  return {
    id: pandocAttr[PANDOC_ATTR_ID] || undefined,
    classes: pandocAttr[PANDOC_ATTR_CLASSES],
    keyvalue: pandocAttr[PANDOC_ATTR_KEYVAULE]
  };
}

export function pandocAttrMarkdown(state: MarkdownSerializerState, attrs: any) {
  let md = '';
  if (pandocAttrAvailable(attrs)) {
    md = md.concat('{');
    if (attrs.id) {
      md = md.concat('#' + state.esc(attrs.id));
      if (attrs.classes.length > 0) {
        md = md.concat(' ');
      }
    }
    if (attrs.classes) {
      const classes = attrs.classes.map((clz: string) => '.' + clz);
      md = md.concat(state.esc(classes.join(' ')));
    }
    md = md.concat('}');
  }
  return md;
}
