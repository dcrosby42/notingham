import VueEditor from "./vendor/toastui-editor-vue/VueEditor.js"

// MyEditor2
export default {
    props: {
        note: Object,
        height: { type: String, default: "100%", required: false },
        darkMode: { type: Boolean, default: true, required: false },
        toolbarVisible: { type: Boolean, default: true, required: false },
        editorMode: { type: String, default: "wysiwyg", required: false },
    },
    data() {
        return {
            toolbarVisibleState: this.toolbarVisible,
            editorModeState: this.editorMode,
            darkModeState: this.darkMode,
        }

    },
    updated() {
        if (this.editor.getMarkdown() != this.note.content) {
            this.editor.setMarkdown(this.note.content, false)
        }
    },
    watch: {
        editorModeState(mode, _oldMode) {
            this.editor.changeMode(mode, true)
            this.$nextTick(() => this.editor.focus())
        }
    },
    methods: {
        handleChange(editorMode) {
            // this.$emit("update:modelValue", this.editor.getMarkdown())
            const newContent = this.editor.getMarkdown()
            if (this.note.content != newContent) {
                this.note.content = newContent
                this.$emit("contentChanged", newContent)
            }
        },
        // Dirty tricksie.  Couldn't find an "a-priori" means to invoke the addLink UI functionality.  (The addLink command works ok, but it doesn't include the link editor popup)
        startAddLink() {
            const toolbarUrlButton = document.getElementsByClassName("link toastui-editor-toolbar-icons")
            if (_.size(toolbarUrlButton) >= 1) {
                toolbarUrlButton[0].click()
                this.$nextTick(() => {
                    document.getElementById('toastuiLinkUrlInput').focus()
                })
            }
        },
        toggleLink() {
            const fn = _.get(this.editor, "wwEditor.commands.toggleLink")
            if (fn) { fn() }
        },
        toggleTask() {
            const fn = _.get(this.editor, "wwEditor.commands.taskList")
            if (fn) { fn() }
        },
    },
    computed: {
        options() {
            const opts = {}
            if (this.darkMode) {
                opts.theme = "dark"
                opts.autofocus = false
            }
            return opts
        },
        editor() {
            return this.$refs.editor.editor
        }
    },
    template: `
      <div>
          <VueEditor 
            ref="editor" 
            previewStyle="tab" 
            :initialEditType="editorMode" 
            :initialValue="note.content" 
            @change="handleChange"
            @focus="$emit('focus')"
            @blur="$emit('blur')"
            @load="editor => $emit('editor-loaded',editor)"
            :height="height"
            :toolbarVisible="toolbarVisibleState"
            :options="options" />
      </div>
    `,
    components: {
        VueEditor
    }
};
