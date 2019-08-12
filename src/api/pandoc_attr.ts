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

export function pandocAttrParseDOM(el: Element) {
  const clz = el.getAttribute('class');
  return {
    id: el.getAttribute('id') || null,
    classes: clz ? clz.split(/\s+/) : [],
  };
}

export function pandocAttrToDOM(node: Node) {
  return {
    id: node.attrs.id,
    class: node.attrs.classes ? node.attrs.classes.join(' ') : null
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

export function pandocAttrWriteMarkdown(state: MarkdownSerializerState, node: Node) {
  if (node.attrs.id || node.attrs.classes) {
    state.write('{');
    if (node.attrs.id) {
      state.write('#' + state.esc(node.attrs.id));
      if (node.attrs.classes.length > 0) {
        state.write(' ');
      }
    }
    if (node.attrs.classes) {
      const classes = node.attrs.classes.map((clz: string) => '.' + clz);
      state.write(state.esc(classes.join(' ')));
    }
    state.write('}');
  }
}
