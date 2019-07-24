
import { NodeSpec, MarkSpec } from "prosemirror-model"

interface IEditorExtension {

  marks?: MarkSpec | MarkSpec[],

  nodes?: NodeSpec | NodeSpec[],



}