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
            if (newValue != oldValue) {
                this.updateToolbarVisibility()
            }
        }
    },
    mounted() {
        const options = {
            ...this.computedOptions,
            el: this.getRootElement(),
            hooks: {
                addImageBlobHook(file, callback, _ui) {
                    console.log("HOOK! addImageBlobHook", file, callback, _ui)
                    callback("https://t4.ftcdn.net/jpg/02/16/34/73/360_F_216347359_bsr0Oc29y5iOTCbeeaPU2uDZF0jJRsLs.jpg", "my ship")
                }
            }
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
