import { Node as ProsemirrorNode } from 'prosemirror-model';

import { PandocOutput, PandocToken } from 'api/pandoc';

import { fragmentWithCheck } from './list-checked';

const LIST_ATTRIBS = 0;
const LIST_CHILDREN = 1;

const LIST_ATTRIB_ORDER = 0;
const LIST_ATTRIB_NUMBER_STYLE = 1;
const LIST_ATTRIB_NUMBER_DELIM = 2;

export const pandocOrderedListReader = {
  token: 'OrderedList',
  list: 'ordered_list',
  getAttrs: (tok: PandocToken) => {
    const attribs = tok.c[LIST_ATTRIBS];
    return {
      order: attribs[LIST_ATTRIB_ORDER],
      number_style: attribs[LIST_ATTRIB_NUMBER_STYLE].t,
      number_delim: attribs[LIST_ATTRIB_NUMBER_DELIM].t,
    };
  },
  getChildren: (tok: PandocToken) => tok.c[LIST_CHILDREN],
};

export function pandocWriteOrderedList(output: PandocOutput, node: ProsemirrorNode) {
  output.writeToken('OrderedList', () => {
    output.writeList(() => {
      output.write(node.attrs.order);
      output.writeToken(node.attrs.number_style);
      output.writeToken(node.attrs.number_delim);
    });
    output.writeList(() => {
      output.writeBlocks(node);
    });
  });
}

export function pandocWriteBulletList(output: PandocOutput, node: ProsemirrorNode) {
  output.writeToken('BulletList', () => {
    output.writeBlocks(node);
  });
}

export function pandocWriteListItem(output: PandocOutput, node: ProsemirrorNode) {
  const paraItemBlockType = node.attrs.tight ? 'Plain' : 'Para';
  const checked = node.attrs.checked;

  output.writeList(() => {
    node.forEach((itemNode: ProsemirrorNode, _offset, index) => {
      if (itemNode.type === node.type.schema.nodes.paragraph) {
        output.writeToken(paraItemBlockType, () => {
          // for first item block, prepend check mark if we have one
          if (checked !== null && index === 0) {
            output.writeInlines(fragmentWithCheck(node.type.schema, itemNode.content, checked));
          } else {
            output.writeInlines(itemNode.content);
          }
        });
      } else {
        output.writeBlock(itemNode);
      }
    });
  });
}
