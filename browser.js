/*
 * browser-version of the publisher
 * this bit is meant to be compiled to browserify
 */

var backend = require("./publish_core.js");

function publish_presentation(input_markdown) {
    return backend(input_markdown, false, false); // TODO: enable minification and other goodies with filesystem
}

window.uPresent = publish_presentation; // this might work
