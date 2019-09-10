# Pandoc Mirror

### TODO

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

pandoc scholar: https://pandoc-scholar.github.io/
pandoc jats:    https://github.com/mfenner/pandoc-jats

pre-processing and post-processing for Rmd fenced code attributes (don't conform)

tight for all lists types
consider tab/shift-tab for lists: https://github.com/scrumpy/tiptap/blob/master/packages/tiptap-extensions/src/nodes/TodoItem.js#L67-L73

definition lists

support for ListNumberStyle.Example (@ syntax)
support for ListDelimStyle (currently HTML output from pandoc doesn't respect this)

handle meta fields (edit w/ codemirror + special handling for title/author/date/abstract?)

handle duplicate ids when block elements are split (required once we support ids on divs)

embedeed codemirror editor

inline math with MathQuill/MathJax: 
   https://pboysen.github.io/
   https://discuss.prosemirror.net/t/odd-behavior-with-nodeview-and-atom-node/1521



add outline notifications / navigation

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text. figures will
be an additional node type with a custom node view (or something like that). Notes on making the caption editable
are here: https://discuss.prosemirror.net/t/getting-a-feel-for-nodeview/972

allow overriding of editor keys (need to use EditorState.reconfigure for this)

find/replace
  https://tiptap.scrumpy.io/search-and-replace 
  https://github.com/mattberkowitz/prosemirror-find-replace

critic markup: http://criticmarkup.com/

