

pandoc schema: <https://github.com/jgm/pandoc-types/blob/master/Text/Pandoc/Definition.hs#L94>

pandoc scholar: https://pandoc-scholar.github.io/
pandoc jats:    https://github.com/mfenner/pandoc-jats

for now, just do this:

pantograph
panharmonicon
panoptic

1) use create-react-app <foo> --typescript to get everything including hot-reloading dev server working

2) add a an express endpoint via "proxy" seting: 
   https://flaviocopes.com/how-to-serve-react-from-same-origin/
   https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/
   https://medium.com/@maison.moa/setting-up-an-express-backend-server-for-create-react-app-bc7620b20a61
   https://www.freecodecamp.org/news/how-to-make-create-react-app-work-with-a-node-backend-api-7c5c48acb1b0/

2a) Use 'concurrently' to run the 2 together:
   https://www.fullstackreact.com/articles/using-create-react-app-with-a-server/#concurrently

3) have the editor folder contain the pandoc-mirror code (and use baseUrl to ref e.g. 'editor/api/node/..')

4) don't allow the editor to take dependencies outside of it's directory

5) Use blueprint.js as the client framework (phosphorjs doesn't do enough + docs are non-existent)

may need to make use of project references (allows mutliple tsconfig.json files
that all reference eachother)
   https://www.typescriptlang.org/docs/handbook/project-references.html
will ultimately need something like lerna:
   https://blog.logrocket.com/setting-up-a-monorepo-with-lerna-for-a-typescript-project-b6a81fe8e4f8/

simple explanation:
   https://stackoverflow.com/questions/51631786/how-to-use-project-references-in-typescript-3-0
   https://gitlab.com/parzh/re-scaled/commit/ca47c1f6195b211ed5d61d2821864c8cecd86bad
   https://www.typescriptlang.org/docs/handbook/project-references.html#structuring-for-relative-modules


editing container based on phospher: 
   http://phosphorjs.github.io/phosphor/api/widgets/globals.html
   react in phospher widget:
     https://github.com/jupyterlab/jupyterlab/blob/master/packages/apputils/src/vdom.ts
     https://github.com/jupyterlab/jupyterlab/blob/master/packages/apputils/src/toolbar.tsx
     https://github.com/jupyterlab/jupyterlab/blob/master/packages/ui-components/src/blueprint.tsx
     https://blueprintjs.com/docs/
     https://blueprintjs.com/docs/#core/components/menu
     react tiling window manager that works with blueprint:
        https://github.com/nomcopter/react-mosaic



pre-processing and post-processing for Rmd fenced code attributes (don't conform)
handle meta fields (edit w/ codemirror + special handling for title/author/date/abstract?)

handle divs and raw spans
handle rawhtml, rawtex, and raw(other)
handle duplicate ids when block elements are split (required once we support ids on divs)

definition lists

tables

inline math with MathQuill/MathJax: 
   https://pboysen.github.io/
   https://discuss.prosemirror.net/t/odd-behavior-with-nodeview-and-atom-node/1521

add outline notifications / navigation

menus for dev project
  https://jqueryui.com/menu/

support for image figures (where alt text is displayed in a p below the image). note that alt text supports arbitrary markup so need a structured way to allow selection and editing of just the alt text. figures will
be an additional node type with a custom node view (or something like that). Notes on making the caption editable
are here: https://discuss.prosemirror.net/t/getting-a-feel-for-nodeview/972


find/replace
  https://tiptap.scrumpy.io/search-and-replace 
  https://github.com/mattberkowitz/prosemirror-find-replace

critic markup: http://criticmarkup.com/

