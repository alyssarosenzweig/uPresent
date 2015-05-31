/*
 * browser-version of the publisher
 * this bit is meant to be compiled to browserify
 */

var backend = require("../publish_core.js");

// calls the backend to perform the actual publishing
function publish_presentation(input_markdown) {
    return backend(input_markdown, false, false); // TODO: enable minification and other goodies with filesystem
}

// renders the published presentation to an iframe for previewing the HTML
function render_presentation(input) {
    var iframe = document.getElementById("presentation").contentWindow.document;

    iframe.open();
    iframe.write(publish_presentation(input));
    iframe.close();
}

window.uPresent = render_presentation; 
