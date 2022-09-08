
# References

## Vue3 Compositon API

https://vuejs.org/guide/extras/composition-api-faq.html


## Panzoom

https://timmywil.com/panzoom/demo/

## Toast UI Editor Docs / links

API and Examples: https://nhn.github.io/tui.editor/latest/

Brief instructions for CDN use found here: https://www.npmjs.com/package/@toast-ui/editor

github https://github.com/nhn/tui.editor/

## Key binding stuff

Add Keyboard Shortcuts to your Vue App -- https://focusedlabs.io/blog/add-keyboard-shortcuts-to-your-vue-app

### toast editor Commands

App.editor.commandManager.mdCommands
App.editor.commandManager.wwCommands

Markdown commands
  indent
  outdent
  heading
  blockQuote
  codeBlock
  addTable
  hr
  bulletList
  orderedList
  taskList
  bold
  strike
  italic
  code
  addImage
  addLink
  deleteSelection
  selectAll
  undo
  redo
  toggleScrollSync

WYSIWYG commands
  heading
  codeBlock
  bulletList
  taskList
  orderedList
  blockQuote
  addTable
  removeTable
  addColumnToLeft
  addColumnToRight
  removeColumn
  addRowToUp
  addRowToDown
  removeRow
  alignColumn
  addImage
  hr
  bold
  italic
  strike
  addLink
  toggleLink
  code
  frontMatter
  deleteSelection
  selectAll
  undo
  redo
  indent
  outdent



## Geting vue-editor working

## What worked


### (second atempt) vue-editor CDN (this does NOT work in straight js... it needs other stuff bundled and common-js'd i think. maybe.)
https://www.jsdelivr.com/package/npm/@toast-ui/vue-editor

```
<script src="https://cdn.jsdelivr.net/npm/@toast-ui/vue-editor@3.1.2/dist/toastui-vue-editor.min.js"></script>
```

### (first attempt) vue-editor wrapper

(at first) Couldn't find vue-editor cdn link or instructions.
So I installed node and endeavored to build it locally:

```
gh repo clone nhn/tui.editor
cd tui.editor/apps/vue-editor
npm install ts-loader
npm install tslib
npm install rollup
npm install @rollup/plugin-commonjs
npm install --save-dev @rollup/plugin-commonjs
npm install --save-dev @rollup/plugin-node-resolve
npm install --save-dev rollup-plugin-vue
npm install --save-dev rollup-plugin-banner

tree dist
dist
├── esm
│   └── index.js
├── toastui-vue-editor.js
└── toastui-vue-editor.js.LICENSE.txt

```
*(didn't use --save-dev on these guys, forgot, didn't go back and correct, unsure if it matters just now)


# go-assets

https://pkg.go.dev/github.com/jessevdk/go-assets

go get -u github.com/jessevdk/go-assets-builder

# Attributions


```
favicon
https://www.iconfinder.com/icons/1291754/notes_todo_notepad_notebook_icon
https://favicon.io/favicon-converter/
```
