# Pandoc Mirror

### TODO

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

pre-processing and post-processing for Rmd fenced code attributes (don't conform)

definition lists

support for ListNumberStyle.Example (@ syntax)
support for ListDelimStyle (currently HTML output from pandoc doesn't respect this)

handle meta fields

handle duplicate ids when block elements are split (required once we support ids on divs)

embedeed codemirror editor

support for editing metadata using codemirror

support for footnotes

add outline notifications / navigation

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text. figures will
be an additional node type with a custom node view (or something like that)

allow overriding of editor keys (need to use EditorState.reconfigure for this)

find/replace (e.g. https://github.com/mattberkowitz/prosemirror-find-replace)

crit markup

