const Editor = toastui.Editor; // import Editor from '@toast-ui/editor';
import { optionsMixin } from './optionsMixin.js';

export default {
    name: 'ToastuiEditor',
    template: `<div ref="toastuiEditor" :derp="options.theme=='dark'"></div>`,
    mixins: [optionsMixin],
    props: {
        previewStyle: {
            type: String,
        },
        height: {
            type: String,
        },
        initialEditType: {
            type: String,
        },
        initialValue: {
            type: String,
        },
        options: {
            type: Object,
        },
        toolbarVisible: {
            type: Boolean,
            default: true,
        }
    },
    watch: {
        previewStyle(newValue) {
            this.editor.changePreviewStyle(newValue);
        },
        height(newValue) {
            this.editor.height(newValue);
        },
        toolbarVisible(newValue, oldValue) {
            console.log("watch toolbarVisible", newValue, oldValue)
            if (newValue != oldValue) {
                this.updateToolbarVisibility()
            }
        }
    },
    mounted() {
        const options = {
            ...this.computedOptions,
            el: this.getRootElement(),
        };
        window.EditorEl = this.getRootElement() // deleteme debugging
        this.editor = Vue.shallowRef(new Editor(options));
        this.updateToolbarVisibility()
    },
    methods: {
        setMarkdown(txt) {
            this.editor.setMarkdown(txt)
        },
        getRootElement() {
            return this.$refs.toastuiEditor;
        },
        updateToolbarVisibility() {
            let els = this.getRootElement().getElementsByClassName("toastui-editor-toolbar")
            if (els.length > 0) {
                if (this.toolbarVisible) {
                    els[0].style.removeProperty("display")
                } else {
                    els[0].style.setProperty("display", "none")
                }
            }
            els = this.getRootElement().getElementsByClassName("toastui-editor-mode-switch")
            if (els.length > 0) {
                if (this.toolbarVisible) {
                    els[0].style.removeProperty("display")
                } else {
                    els[0].style.setProperty("display", "none")
                }
            }
        }
    },
};
