
import { Schema } from 'prosemirror-model'
import { IEditorExtension, markExtension, MarkCommand } from '../../extension'

const extension : IEditorExtension = markExtension({
  name: "strong",
  spec: {
    parseDOM: [
      {tag: "b"}, 
      {tag: "strong"},
      {style: "font-weight", 
       getAttrs: (value: string | Node) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null
      }
    ],
    toDOM() { return ["strong"] }
  },
  pandoc: {
    from: {
      token: "Strong",
      mark: "strong",
    },
    to: {}
  },
  command: (schema: Schema) => new MarkCommand("strong", ["Mod-b", "Mod-B"], schema.marks.strong)
});

export default extension;