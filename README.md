# Pandoc Mirror

### TODO

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

pre-processing and post-processing for Rmd fenced code attributes (don't conform)

definition lists

trailing node: https://github.com/scrumpy/tiptap/blob/master/packages/tiptap-extensions/src/extensions/TrailingNode.js



support for ListNumberStyle.Example (@ syntax)
support for ListDelimStyle (currently HTML output from pandoc doesn't respect this)

handle meta fields

todo list: https://tiptap.scrumpy.io/todo-list

handle duplicate ids when block elements are split (required once we support ids on divs)

embedeed codemirror editor

inline math with MathQuill/MathJax: 
   https://pboysen.github.io/
   https://discuss.prosemirror.net/t/odd-behavior-with-nodeview-and-atom-node/1521

support for editing metadata using codemirror

support for footnotes
https://discuss.prosemirror.net/t/how-to-insert-linebreaks-and-formatting-in-footnotes/1828
https://discuss.prosemirror.net/t/nested-inline-nodes/935/3
https://discuss.prosemirror.net/t/getting-a-feel-for-nodeview/972/13

add outline notifications / navigation

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text. figures will
be an additional node type with a custom node view (or something like that)

allow overriding of editor keys (need to use EditorState.reconfigure for this)

find/replace (e.g. https://github.com/mattberkowitz/prosemirror-find-replace)

crit markup

