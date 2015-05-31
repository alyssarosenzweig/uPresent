/*
 * browser-version of the publisher
 * this bit is meant to be compiled to browserify
 */

var backend = require("../publish_core.js");

var editor;

// calls the backend to perform the actual publishing
function publish_presentation(input_markdown) {
    return backend(input_markdown, false, false); // TODO: enable minification and other goodies with filesystem
}

// renders the published presentation to an iframe for previewing the HTML
function render_presentation(input) {
    var iframe = document.getElementById("presentation").contentWindow.document;

    var output = publish_presentation(input);

    // don't update if there are errors

    if(output) {
        iframe.open();
        iframe.write(publish_presentation(input));
        iframe.close();
    }
}

// fetches the input markdown from the textarea
function get_input() {
    return editor.getValue() + "\n\n"; // newlines are appended to prevent stupid errors
}

// meat of the actual editor

window.render = function() {
    console.log(get_input());
    render_presentation(get_input());
};

window.addEventListener("load", function() {
    editor = CodeMirror.fromTextArea(document.getElementById("text"), {
        mode: "markdown"
    });

    editor.on("change", render);
});
