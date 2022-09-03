#!/bin/bash
pushd `dirname ${BASH_SOURCE[0]}` > /dev/null; HERE=`pwd`; popd > /dev/null

cd $HERE

wget https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js
wget https://uicdn.toast.com/editor-plugin-uml/latest/toastui-editor-plugin-uml.min.js

wget https://uicdn.toast.com/editor/latest/toastui-editor.min.css
wget https://uicdn.toast.com/editor/latest/theme/toastui-editor-dark.min.css
