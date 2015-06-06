/*
 * source code of the browser-based uPresent Target
 * used with browserify
 * target is a tiny uPresent frontend
 * unlike the IDE, there is no editor here
 * instead, you write presentations in your favorite offline editor,
 * and simply use target for previewing and exporting
 * target is useful for Windows users,
 * as well as people who don't want to use node/npm for whatever reason
 */

var uPresent = require("../uPresent.browser.js");

var source = "";

window.render = function() {
    uPresent.render_presentation(source);

    document.body.className = "render";
}

window.reset = function() {
    document.body.className = "upload";
}

window.save = function() {
    uPresent.save();
}

function readFile(file) {
    var reader = new FileReader();
    
    reader.onload = (function(myFile) {
        return function(e) {
            source = e.target.result;
            window.render();
        };
    })(file);

    reader.readAsText(file);
}

// setup drag and drop

function onDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    
    var file = e.dataTransfer.files[0];
    
    readFile(file);
}

function onDragover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

window.addEventListener("load", function() {
   var uploader = document.querySelector("div.upload");

   uploader.addEventListener("dragover", onDragover, false);
   uploader.addEventListener("drop", onDrop, false);
});
