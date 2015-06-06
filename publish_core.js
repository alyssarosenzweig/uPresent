/*
 * backend for the uPresent publisher
 * interfaces to the nearley grammar and provides a few other niceties
 * the main publish.js calls this internally
 */

var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
var beautify_html = require("js-beautify").html;
var minify = require("html-minifier").minify;
var path = require("path");


function publish(input, shouldMinify, useFS, filePrefix) {
    var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    
    if(!filePrefix) filePrefix = "";

    var cssFile = filePrefix + "common.css";
    var themeFile = filePrefix + "themes/modern.dark.css";
    var jsFile = filePrefix + "scripts.js";

    if(useFS) {
        fs = require("fs"); // intentional lack of var keyword
    }

    parser.current = 0;
    parser.feed(input);

    var res = parser.results[0];
    var code = "";
    
    if(!res) {
        return undefined;
    }

    var title = res[0][0];
    var transitionBullets = false;

    if(res[0][2]) {
        // parse options
        
        res[0][2].forEach(function(option) {
            var key = option[0];
            var value = option[1];

            // only similar options are needed to match
            // eg, transition bullet, transitionbullets, and bullet_transition all match here
            if(key.indexOf("transition") > -1) {
                if(key.indexOf("bullet") > -1) {
                    transitionBullets = value;
                }
            } else if(key == "theme") {
                themeFile = filePrefix + "themes/" + value.toLowerCase().trim().split(" ").join(".") + ".css";
            }
        });
    }

    res[1].forEach(function(slide, n) {
            slideClass = "slide";
            
            if(transitionBullets) slideClass += " transbullets";

            code += '<div class="' + slideClass + '" id="slide' + n + '">' + slide + '</div>';
                });

    var body = code;

    code = "<!DOCTYPE html><html><head>" +
        "<title>" + title + "</title>";

    if(shouldMinify && useFS) {
        var theme = "";

        // to find the theme file, we look through the theme 'paths'
        // that is, uPresent's theme folder and the current directory
        // if the theme exists locally, use that instead

        try {
            theme = fs.readFileSync("./" + themeFile).toString().split("\n");
        } catch(e) {
            // else load the packaged theme

            try {
                theme = fs.readFileSync(path.join(__dirname,themeFile)).toString().split("\n");
            } catch(e) {
                console.error("Theme "+themeFile+" not found. Please check your spelling. If you are designing a theme, please check your path. Else, file an issue on the tracker");
                process.exit(0);
            }
        }

        var outtheme = [];
        var imports = [];

        theme.forEach(function(line) {
            if(line.slice(0, "@import".length) == "@import") {
                imports.push(line);
            } else {
                outtheme.push(line);
            }
        }); 
        
        
        code += "<style>" + (imports.join("\n")) + 
                    fs.readFileSync(path.join(__dirname, cssFile)) + "\n\n" +
                    (outtheme.join("\n")) + "</style>" +
            "<script>" + fs.readFileSync(path.join(__dirname, jsFile)) + "</script>";
    } else {
        if(shouldMinify) console.warn("Cannot embed CSS and JS due to nodelessness");
        code +=  '<link rel="stylesheet" href="' + cssFile + '" type="text/css">' +
            '<link rel="stylesheet" href="' + themeFile + '" type="text/css">' +    
                '<script src="' + jsFile + '" type="text/javascript"></script>';
    }

    code += "</head><body>" +
        body +
        "</body></html>";
        


    // depending on the user options, either minify (production) or beautify (development)

    if(shouldMinify) {
        var output = minify(code, {
            minifyJS: true,
            minifyCSS: true
        });
    } else {
        var output = beautify_html(code, {});
    }

    return output;
}

module.exports = publish;
