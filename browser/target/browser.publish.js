(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../publish_core.js":3}],2:[function(require,module,exports){
(function () {
function Rule(name, symbols, postprocess) {
    this.name = name;
    this.symbols = symbols;        // a list of literal | regex class | nonterminal
    this.postprocess = postprocess;
    return this;
}

Rule.prototype.toString = function(withCursorAt) {
    function stringifySymbolSequence (e) {
        return (e.literal) ? JSON.stringify(e.literal)
                           : e.toString();
    }
    var symbolSequence = (typeof withCursorAt === "undefined")
                         ? this.symbols.map(stringifySymbolSequence).join(' ')
                         : (   this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                             + " ● "
                             + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' ')     );
    return this.name + " → " + symbolSequence;
}


// a State is a rule at a position from a given starting point in the input stream (reference)
function State(rule, expect, reference) {
    this.rule = rule;
    this.expect = expect;
    this.reference = reference;
    this.data = [];
}

State.prototype.toString = function() {
    return "{" + this.rule.toString(this.expect) + "}, from: " + (this.reference || 0);
};

State.prototype.nextState = function(data) {
    var state = new State(this.rule, this.expect + 1, this.reference);
    state.data = this.data.slice(0);  // make a cheap copy of currentState's data
    state.data.push(data);            // append the passed data
    return state;
};

State.prototype.consumeTerminal = function(inp) {
    var val = false;
    if (this.rule.symbols[this.expect]) {                  // is there a symbol to test?
       if (this.rule.symbols[this.expect].test) {          // is the symbol a regex?
          if (this.rule.symbols[this.expect].test(inp)) {  // does the regex match
             val = this.nextState(inp);  // nextState on a successful regex match
          }
       } else {   // not a regex, must be a literal
          if (this.rule.symbols[this.expect].literal === inp) {
             val = this.nextState(inp);  // nextState on a successful literal match
          }
       }
    }
    return val;
};

State.prototype.consumeNonTerminal = function(inp) {
    if (this.rule.symbols[this.expect] === inp) {
        return this.nextState(inp);
    }
    return false;
};

State.prototype.process = function(location, table, rules, addedRules) {
    if (this.expect === this.rule.symbols.length) {
        // I have completed a rule
        if (this.rule.postprocess) {
            this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
        if (!(this.data === Parser.fail)) {
            var w = 0;
            // We need a while here because the empty rule will
            // modify table[reference]. (when location === reference)
            var s,x;
            while (w < table[this.reference].length) {
                s = table[this.reference][w];
                x = s.consumeNonTerminal(this.rule.name);
                if (x) {
                    x.data[x.data.length-1] = this.data;
                    table[location].push(x);
                }
                w++;
            }

            // --- The comment below is OUTDATED. It's left so that future
            // editors know not to try and do that.

            // Remove this rule from "addedRules" so that another one can be
            // added if some future added rule requires it.
            // Note: I can be optimized by someone clever and not-lazy. Somehow
            // queue rules so that everything that this completion "spawns" can
            // affect the rest of the rules yet-to-be-added-to-the-table.
            // Maybe.

            // I repeat, this is a *bad* idea.

            // var i = addedRules.indexOf(this.rule);
            // if (i !== -1) {
            //     addedRules.splice(i, 1);
            // }
        }
    } else {
        // In case I missed an older nullable's sweep, update yourself. See
        // above context for why this makes sense.

        var ind = table[location].indexOf(this);
        for (var i=0; i<ind; i++) {
            var state = table[location][i];
            if (state.rule.symbols.length === state.expect && state.reference === location) {
                var x = this.consumeNonTerminal(state.rule.name);
                if (x) {
                    x.data[x.data.length-1] = state.data;
                    table[location].push(x);
                }
            }
        }

        // I'm not done, but I can predict something
        var exp = this.rule.symbols[this.expect];

        // for each rule
        var me = this;
        rules.forEach(function(r) {
            // if I expect it, and it hasn't been added already
            if (r.name === exp && addedRules.indexOf(r) === -1) {
                // Make a note that you've added it already, and don't need to
                // add it again; otherwise left recursive rules are going to go
                // into an infinite loop by adding themselves over and over
                // again.

                // If it's the null rule, however, you don't do this because it
                // affects the current table row, so you might need it to be
                // called again later. Instead, I just insert a copy whose
                // state has been advanced one position (since that's all the
                // null rule means anyway)

                if (r.symbols.length > 0) {
                    addedRules.push(r);
                    table[location].push(new State(r, 0, location));
                } else {
                    // Empty rule
                    // This is special
                    var copy = me.consumeNonTerminal(r.name);
                    if (r.postprocess) {
                        copy.data[copy.data.length-1] = r.postprocess([], this.reference);
                    } else {
                        copy.data[copy.data.length-1] = [];
                    }
                    table[location].push(copy);
                }
            }
        });
    }
};



function Parser(rules, start) {
    var table = this.table = [];
    this.rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
    this.start = start = start || this.rules[0].name;
    // Setup a table
    var addedRules = [];
    this.table.push([]);
    // I could be expecting anything.
    this.rules.forEach(function (r) {
        if (r.name === start) {  // add all rules named start
            addedRules.push(r);
            table[0].push(new State(r, 0, 0));
        }});  // this should refer to this object, not each rule inside the forEach
    this.advanceTo(0, addedRules);
    this.current = 0;
}

// create a reserved token for indicating a parse fail
Parser.fail = {};

Parser.prototype.advanceTo = function(n, addedRules) {
    // Advance a table, take the closure of .process for location n in the input stream
    var w = 0;
    while (w < this.table[n].length) {
        (this.table[n][w]).process(n, this.table, this.rules, addedRules);
        w++;
    }
}

Parser.prototype.feed = function(chunk) {
    for (var chunkPos = 0; chunkPos < chunk.length; chunkPos++) {
        // We add new states to table[current+1]
        this.table.push([]);

        // Advance all tokens that expect the symbol
        // So for each state in the previous row,

        for (var w = 0; w < this.table[this.current + chunkPos].length; w++) {
            var s = this.table[this.current + chunkPos][w];
            var x = s.consumeTerminal(chunk[chunkPos]);      // Try to consume the token
            if (x) {
                // And then add it
                this.table[this.current + chunkPos + 1].push(x);
            }
        }

        // Next, for each of the rules, we either
        // (a) complete it, and try to see if the reference row expected that
        //     rule
        // (b) predict the next nonterminal it expects by adding that
        //     nonterminal's start state
        // To prevent duplication, we also keep track of rules we have already
        // added

        var addedRules = [];
        this.advanceTo(this.current + chunkPos + 1, addedRules);

        // If needed, throw an error:
        if (this.table[this.table.length-1].length === 0) {
            // No states at all! This is not good.
            var err = new Error(
                "nearley: No possible parsings (@" + (this.current + chunkPos)
                    + ": '" + chunk[chunkPos] + "')."
            );
            err.offset = this.current + chunkPos;
            throw err;
        }
    }

    this.current += chunkPos;
    // Incrementally keep track of results
    this.results = this.finish();

    // Allow chaining, for whatever it's worth
    return this;
};

Parser.prototype.finish = function() {
    // Return the possible parsings
    var considerations = [];
    var myself = this;
    this.table[this.table.length-1].forEach(function (t) {
        if (t.rule.name === myself.start
                && t.expect === t.rule.symbols.length
                && t.reference === 0
                && t.data !== Parser.fail) {
            considerations.push(t);
        }
    });
    return considerations.map(function(c) {return c.data; });
};

var nearley = {
    Parser: Parser,
    Rule: Rule
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
   module.exports = nearley;
} else {
   window.nearley = nearley;
}
})();

},{}],3:[function(require,module,exports){
(function (process,__dirname){
/*
 * backend for the uPresent publisher
 * interfaces to the nearley grammar and provides a few other niceties
 * the main publish.js calls this internally
 */

var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
//var beautify_html = require("js-beautify").html;
//var minify = require("html-minifier").minify;
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

/*    if(shouldMinify) {
        var output = minify(code, {
            minifyJS: true,
            minifyCSS: true
        });
    } else {
        var output = beautify_html(code, {});
    }*/

    output = code; // minfication / beautifucation disabled for now. TODO: fix

    return output;
}

module.exports = publish;

}).call(this,require('_process'),"/..")
},{"./uPresent.ne.js":4,"_process":7,"fs":5,"nearley":2,"path":6}],4:[function(require,module,exports){
// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }
var grammar = {
    ParserRules: [
    {"name": "main", "symbols": ["config", "_", "presentation"], "postprocess":  function(d) {
	return [d[0], d[2]];
} },
    {"name": "config", "symbols": ["pphrase"]},
    {"name": "config", "symbols": ["pphrase", "_", " ebnf$1", /[\s]/]},
    {"name": "configOption", "symbols": [{"literal":"+"}, "pphrase", {"literal":"\n"}], "postprocess":  function(d) { return [d[1], true] } },
    {"name": "configOption", "symbols": [{"literal":"-"}, "pphrase", {"literal":"\n"}], "postprocess":  function(d) { return [d[1], false] } },
    {"name": " string$2", "symbols": [{"literal":":"}, {"literal":" "}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "configOption", "symbols": ["pphrase", " string$2", "pphrase", {"literal":"\n"}], "postprocess":  function(d) { return [d[0], d[2]] } },
    {"name": "presentation", "symbols": [" ebnf$3"], "postprocess":  function(d) { return [].concat.apply([], d) } },
    {"name": "slide", "symbols": [" ebnf$4", {"literal":"\n"}, "content"], "postprocess":  function(d) { return d[2] } },
    {"name": "content", "symbols": [" ebnf$5"], "postprocess":  function(d) { return d[0].join(""); } },
    {"name": "line", "symbols": ["marker", {"literal":"\n"}], "postprocess":  function(d) { return d[0] } },
    {"name": "line", "symbols": ["lphrase", {"literal":"\n"}], "postprocess":  function(d) { return "<p>" + d[0] + "</p>" } },
    {"name": "line", "symbols": [" ebnf$6", {"literal":"\n"}], "postprocess":  function(d) { return "<ul>"+(d[0].join(""))+"</ul>" } },
    {"name": "line", "symbols": [{"literal":"\n"}], "postprocess":  function(d) { return ""; } },
    {"name": "italics", "symbols": [{"literal":"_"}, "lphrase", {"literal":"_"}], "postprocess":  function(d) { return "<em>" + d[1] + "</em>" } },
    {"name": " string$7", "symbols": [{"literal":"*"}, {"literal":"*"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": " string$8", "symbols": [{"literal":"*"}, {"literal":"*"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "bold", "symbols": [" string$7", "lphrase", " string$8"], "postprocess":  function(d) { return "<strong>" + d[1] + "</strong>" } },
    {"name": " string$9", "symbols": [{"literal":"!"}, {"literal":"["}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": " string$10", "symbols": [{"literal":"]"}, {"literal":"("}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "image", "symbols": [" string$9", "pphrase", " string$10", "path", {"literal":")"}], "postprocess":  function(d) { return '<img alt="' + d[1] + '" src="' + d[3] + '" />' } },
    {"name": " string$11", "symbols": [{"literal":"h"}, {"literal":"t"}, {"literal":"t"}, {"literal":"p"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "linkprotocol", "symbols": [" string$11"]},
    {"name": " string$12", "symbols": [{"literal":"h"}, {"literal":"t"}, {"literal":"t"}, {"literal":"p"}, {"literal":"s"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "linkprotocol", "symbols": [" string$12"]},
    {"name": "domain", "symbols": [" ebnf$13"], "postprocess":  function(d) { return d[0].join(""); } },
    {"name": " string$14", "symbols": [{"literal":":"}, {"literal":"/"}, {"literal":"/"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "rawlink", "symbols": ["linkprotocol", " string$14", "domain", {"literal":"/"}, " ebnf$15"], "postprocess":  function(d) {
			return "<a href='" + d[0] + d[1] + d[2] + d[3] + d[4].join("") + "'>" + d[0] + d[1] + d[2] + d[3] + d[4].join("") + "</a>";
		} },
    {"name": " string$16", "symbols": [{"literal":"]"}, {"literal":"("}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "namelink", "symbols": [{"literal":"["}, "pphrase", " string$16", "path", {"literal":")"}], "postprocess":  function(d) { return '<a href="' + d[3] + '">' + d[1] + "</a>"; } },
    {"name": "ln", "symbols": ["nophrase", " ebnf$17"], "postprocess":  
			function(d, blah, fail) {
				d[1] = d[1].join("");
			       	if(d[1].indexOf("http://") > -1 || d[1].indexOf("https://") > -1) { 
					return fail;
			       	}
			       	return d[0]+d[1]
		       	}
		   },
    {"name": "lphrase", "symbols": ["ln"], "postprocess":  id },
    {"name": "lphrase", "symbols": ["nphrase"], "postprocess":  id },
    {"name": "nophrase", "symbols": ["nphrase"], "postprocess":  id },
    {"name": "nophrase", "symbols": ["_"], "postprocess":  function() { return "" } },
    {"name": "nphrase", "symbols": ["lphrase", /[#]/], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", "italics"], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", "bold"], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", "image"], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", /[\-]/], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", /[!]/, /[^\[]/], "postprocess":  function(d) { return d[0]+d[1]+d[2] } },
    {"name": "nphrase", "symbols": ["bphrase", "rawlink", /[\s]/], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["bphrase", "namelink"], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "nphrase", "symbols": ["lphrase", {"literal":"["}], "postprocess":  function(d) { return d[0]+d[1] } },
    {"name": "bphrase", "symbols": ["lphrase"], "postprocess":  id },
    {"name": "bphrase", "symbols": ["_"], "postprocess":  function() { return "" } },
    {"name": "pphrase", "symbols": [" ebnf$18"], "postprocess":  function(d) { return d[0].join("") } },
    {"name": "linecharacter", "symbols": [/[A-Za-z0-9 @$%^&()+=.,<>/?'";:\|\]\{\}\(\)]/]},
    {"name": " string$19", "symbols": [{"literal":"#"}, {"literal":" "}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "marker", "symbols": [" string$19", "lphrase", {"literal":"\n"}], "postprocess":  function(d) {
		return "<h1>" +
			d[1] +
			"</h1>";
		} },
    {"name": "marker", "symbols": ["image", "bphrase"], "postprocess":  function(d) {
            return "<p>" + d[0] + d[1] + "</p>";
        } },
    {"name": " string$20", "symbols": [{"literal":"["}, {"literal":"l"}, {"literal":"i"}, {"literal":"n"}, {"literal":"e"}, {"literal":"b"}, {"literal":"r"}, {"literal":"e"}, {"literal":"a"}, {"literal":"k"}, {"literal":"]"}, {"literal":"\n"}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "marker", "symbols": [" string$20"], "postprocess":  function(d) { return "<br/>"; } },
    {"name": " string$21", "symbols": [{"literal":"]"}, {"literal":" "}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "marker", "symbols": [{"literal":"["}, "pphrase", " string$21", "lphrase", {"literal":"\n"}], "postprocess":  function(d) {
            return "<div class='" + d[1] + "'>" + d[3] + "</div>";
        } },
    {"name": "path", "symbols": [" ebnf$22"], "postprocess":  function(d) { return d[0].join("") } },
    {"name": " string$23", "symbols": [{"literal":"~"}, {"literal":" "}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "listnode", "symbols": [" string$23", "lphrase", {"literal":"\n"}], "postprocess":  function(d) {
		return "<li>" + d[1] + "</li>";
	} },
    {"name": " string$24", "symbols": [{"literal":"~"}, {"literal":"~"}, {"literal":" "}], "postprocess": function joiner(d) {
        return d.join('');
    }},
    {"name": "listnode", "symbols": ["_", " string$24", "lphrase", {"literal":"\n"}], "postprocess":  function(d) {
		return "<li class='alt'>" + d[2] + "</li>"
	} },
    {"name": "_", "symbols": [], "postprocess":  function(){ return null } },
    {"name": "_", "symbols": [/[\s]/, "_"], "postprocess":  function() { return null } },
    {"name": " ebnf$1", "symbols": ["configOption"]},
    {"name": " ebnf$1", "symbols": ["configOption", " ebnf$1"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$3", "symbols": ["slide"]},
    {"name": " ebnf$3", "symbols": ["slide", " ebnf$3"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$4", "symbols": [{"literal":"-"}]},
    {"name": " ebnf$4", "symbols": [{"literal":"-"}, " ebnf$4"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$5", "symbols": ["line"]},
    {"name": " ebnf$5", "symbols": ["line", " ebnf$5"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$6", "symbols": ["listnode"]},
    {"name": " ebnf$6", "symbols": ["listnode", " ebnf$6"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$13", "symbols": [/[A-Za-z\.]/]},
    {"name": " ebnf$13", "symbols": [/[A-Za-z\.]/, " ebnf$13"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$15", "symbols": []},
    {"name": " ebnf$15", "symbols": [/[^ \n\t]/, " ebnf$15"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$17", "symbols": ["linecharacter"]},
    {"name": " ebnf$17", "symbols": ["linecharacter", " ebnf$17"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$18", "symbols": [/[ A-Za-z0-9!@#$%^&*()_+\-\=}{\[\]"':;?/>.<,i]/]},
    {"name": " ebnf$18", "symbols": [/[ A-Za-z0-9!@#$%^&*()_+\-\=}{\[\]"':;?/>.<,i]/, " ebnf$18"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }},
    {"name": " ebnf$22", "symbols": [/[A-Za-z0-9:\/!@#$%^&*()_+=\-\'\.\(\)]/]},
    {"name": " ebnf$22", "symbols": [/[A-Za-z0-9:\/!@#$%^&*()_+=\-\'\.\(\)]/, " ebnf$22"], "postprocess": function (d) {
                    return [d[0]].concat(d[1]);
                }}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();

},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":7}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
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
    window.location.reload(false);
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

},{"../uPresent.browser.js":1}]},{},[8]);
