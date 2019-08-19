# Pandoc Mirror

### TODO

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

emit pandoc ast

error handling for pandoc engine:
   - Make alert part of editor UI interface

pre-processing and post-processing for Rmd fenced code attributes (don't conform)

editing support for additional ordered list attributes (delimiter, etc.)

handle meta fields

SoftBreak handling: We can call pandoc with --wrap=preserve however this won't work well if
significant text is added to the paragraph. May want to simply rely on the use of
--wrap=auto --columns=72 to automatically wrap 

Options for hard breaks (\ or double-space)

handle duplicate ids when block elements are split (required once we support ids on divs)

embedeed codemirror editor

support for footnotes

add outline notifications / navigation

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text. figures will
be an additional node type with a custom node view (or something like that)

toggleMark from prosemirror shows commands enabled even when marks: false

allow overriding of editor keys (need to use EditorState.reconfigure for this)

find/replace (e.g. https://github.com/mattberkowitz/prosemirror-find-replace)

