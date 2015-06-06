/*
 * source code of the browser-based uPresent IDE
 * used with browserify
 * this controls the UI of the IDE, as well as a few IDE-specific features like CodeMirror.
 * however, actual uPresent features are from browser.js
 */

var uPresent = require("./browser.js");

var editor;

// fetches the input markdown from the textarea

function get_input() {
    return editor.getValue() + "\n"; // a newline is appended to prevent stupid errors
}

// meat of the actual editor

window.render = function() {
    uPresent.render_presentation(get_input());

    document.body.className = "render";
};

window.edit = function() {
    document.body.className = "editor";
}

window.save = function() {
    uPresent.save();
}

window.addEventListener("load", function() {
    editor = CodeMirror.fromTextArea(document.getElementById("text"), {
        mode: "markdown"
    });
});
