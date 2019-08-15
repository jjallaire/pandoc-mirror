# Pandoc Mirror

### TODO

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

focus/scroll issues after dialogs

error handling for pandoc engine (or perhaps the component should just take the AST and not know
anything at all about markdown)

consider emiting pandoc ast\
superscript and subscript don't get spaces escaped (solved by emitting ast)

handle duplicate ids when block elements are split (required once we support ids on divs)

support pandoc {} syntax for fenced code regions\
embedeed codemirror editor

support for footnotes

add outline notifications / navigation

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text

toggleMark from prosemirror shows commands enabled even when marks: false

allow overriding of editor keys (need to use EditorState.reconfigure for this)

find/replace (e.g. https://github.com/mattberkowitz/prosemirror-find-replace)

