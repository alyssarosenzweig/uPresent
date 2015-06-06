/*
 * browser-version of the publisher
 * this bit is meant to be compiled to browserify
 */

var backend = require("../publish_core.js");

var editor;
var presentationTitle = "Untitled Presentation";

// calls the backend to perform the actual publishing
function publish_presentation(input_markdown) {
    presentationTitle = input_markdown.split("\n")[0];

    return backend(input_markdown, false, false, "../../"); // TODO: enable minification and other goodies with filesystem
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



// polyfill for a map for NodeList's
// to avoid conversion to an array with is ugly...

function mapNodelistAsync(obj, func, callback) {
    var arr = [];
    
    for(var i = 0; i < obj.length; ++i) {
        func(obj[i], function(response) {
            arr.push(response);
            
            if(arr.length == obj.length) {
                callback(arr);
            }
        });
    }
}

function fetchHTTPHref(hreffer, callback) {
    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if(request.readyState == 4) {
            callback(request.responseText);
        }
    };

    console.log(hreffer);

    request.open("GET", hreffer.href || hreffer.src, true);
    request.send();
}

function download(url) {
    var btn = document.createElement("a");
    btn.href = url;
    btn.download = presentationTitle.trim().toLowerCase().replace(/ /g, "_") + ".html";
    
    if(window.chrome) {
        // automatic downloading works in modern versions of chrome <3
     
        btn.click();
    } else {
       btn.innerHTML = "Download";

       document.querySelector("div.render > div.toolbar").appendChild(btn);
    } 
}

function save() {
    // to save, we'll already be in render mode
    // this is useful as this enables us to perform DOM manipulation <3
    
    var frame = document.getElementById("presentation").contentWindow.document;
    
    // get the stylesheet URLs
    
    var styles = frame.getElementsByTagName("link");
    var scripts = frame.getElementsByTagName("script");

    var stylesheets = [];
    var scriptcontents = [];

    mapNodelistAsync(styles, fetchHTTPHref, function(out) {
        stylesheets = out;

        if(scriptcontents.length) saveStage2();
    });

    mapNodelistAsync(scripts, fetchHTTPHref, function(out) {
        scriptcontents = out;

        if(stylesheets.length) saveStage2();
    });

    function saveStage2() {
        for(var i = 0; i < styles.length; ++i) {
            styles[i].parentNode.removeChild(styles[i]);
        }

        for(var i = 0; i < scripts.length; ++i) {
            scripts[i].parentNode.removeChild(scripts[i]);
        }

        stylesheets.forEach(function(sheet) {
            var sheetObject = document.createElement("style");
            sheetObject.innerHTML = sheet;

            frame.head.appendChild(sheetObject);
        });

        scriptcontents.forEach(function(code) {
            var scriptObject = document.createElement("script");
            scriptObject.innerHTML = code;

            frame.head.appendChild(scriptObject);
        });

        var source = frame.documentElement.outerHTML || frame.documentElement.innerHTML;

        if(window.exportedFile !== null) window.URL.revokeObjectURL(window.exportedFile);

        window.exportedFile = window.URL.createObjectURL(new Blob([source], { type: "text/html" } ));

        download(window.exportedFile);
    }
}

module.exports.save = save;
module.exports.render_presentation = render_presentation;
module.exports.publish_presentation = publish_presentation;
