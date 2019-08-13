import { PandocAstToken } from './pandoc';

const PANDOC_ATTR_ID = 0;
const PANDOC_ATTR_CLASSES = 1;
const PANDOC_ATTR_KEYVAULE = 2;

export const pandocAttrSpec = {
  id: { default: null },
  classes: { default: [] },
  keyvalue: { default: [] },
};

export function pandocAttrAvailable(attrs: any) {
  return attrs.id || (attrs.classes && attrs.classes.length > 0) || (attrs.keyvalue && attrs.keyvalue.length > 0);
}

export function pandocAttrReadAST(tok: PandocAstToken, index: number) {
  const pandocAttr = tok.c[index];
  return {
    id: pandocAttr[PANDOC_ATTR_ID] || undefined,
    classes: pandocAttr[PANDOC_ATTR_CLASSES],
    keyvalue: pandocAttr[PANDOC_ATTR_KEYVAULE],
  };
}

export function pandocAttrToDomAttr(attrs: any) {
  
  // id and class 
  const domAttr: any = {
    id: attrs.id,
    class: attrs.classes ? attrs.classes.join(' ') : null,
  };

  // keyvalue pairs
  attrs.keyvalue.forEach((keyvalue: [string,string]) => {
    domAttr[keyvalue[0]] = keyvalue[1];
  });

  // return domAttr
  return domAttr;
}

export function pandocAttrParseDom(el: Element, attrs: { [key: string]: string | null }) {
  const existingNames = Object.keys(attrs);
  const attr: any = {};
  attr.classes = [];
  attr.keyvalue = [];
  el.getAttributeNames().forEach(name => {
    const value: string = el.getAttribute(name) as string;
    // exclude attributes already parsed and prosemirror internal attributes
    if (existingNames.indexOf(name) === -1 && !name.startsWith('data-pm')) {
      if (name === 'id') {
        attr.id = value;
      } else if (name === 'class') {
        attr.classes = value.split(/\s+/);
      } else {
        attr.keyvalue.push([name,value]);
      }
    }
  });
  return attr;
}

export function pandocAttrToMarkdown(attrs: any) {
  let md = '';
  if (pandocAttrAvailable(attrs)) {
    md = md.concat('{');
    if (attrs.id) {
      md = md.concat('#' + attrs.id);
      if (attrs.classes.length > 0) {
        md = md.concat(' ');
      }
    }
    if (attrs.classes) {
      const classes = attrs.classes.map((clz: string) => '.' + clz);
      md = md.concat(classes.join(' '));
    }
    if (attrs.keyvalue && attrs.keyvalue.length > 1) {
      md = md.concat(' ');
      md = md.concat(
        attrs.keyvalue
          .map((keyvalue: [string, string]) => `${keyvalue[0]}=${maybeQuote(keyvalue[1])}`)
          .join(' ')
      );
    }
    md = md.concat('}');
  }
  return md;
}


// TODO: more robust implementation that encompsses nested quotes
function maybeQuote(value: string) {
  if (value.indexOf(' ') !== -1) {
    return `'${value}'`;
  } else {
    return value;
  }
}