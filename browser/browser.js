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
    return editor.getValue() + "\n"; // newlines are appended to prevent stupid errors
}

// meat of the actual editor

window.render = function() {
    render_presentation(get_input());

    document.body.className = "render";
};

window.edit = function() {
    document.body.className = "editor";
}

window.save = function() {
    var source = publish_presentation(get_input());
    
    var dataURI = "data:application/force-download, " + encodeURIComponent(source);

    window.open(dataURI, "_blank", "menubar=0,toolbar=0,location=0,personalbar=0,status=0").focus();
}

window.addEventListener("load", function() {
    editor = CodeMirror.fromTextArea(document.getElementById("text"), {
        mode: "markdown"
    });
});
