#!/usr/bin/env node

/*
 * frontend to the nearley grammar powering uPresent
 * depends on nearley from npm, obviously
 */

var fs = require("fs");
var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
var beautify_html = require("js-beautify").html;
var minify = require("html-minifier").minify;

var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);

var opts = require("nomnom")
    .script("up")
    .option("input", {
        "position": 0,
        "required": true,
        "help": "An input Markdown file"
    })
    .option("output", {
        "abbr": "o",
        "help": "An output html file (if not provided, write to stdout)"
    })
    .option("minify", {
	"abbr": "m",
	"help": "Embeds CSS and JS into the output file and minifies the output for optimal performace",
	"flag": true 
    })
    .option('version', {
        abbr: 'v',
        flag: true,
        help: "Print version and exit",
        callback: function() {
            return require('../package.json').version;
        }
    })
    .parse();

var cssFile = "style.css",
    jsFile = "scripts.js";

var input = fs.readFileSync(opts.input).toString();

parser.feed(input);

var res = parser.results[0];
var code = "";
var title = res[0][0];
var transitionBullets = false;

if(res[0][2]) {
	// parse options
	
	res[0][2].forEach(function(option) {
		var key = option[1];
		var value = option[0] == "+";

		console.log(key+","+value);

		// only similar options are needed to match
		// eg, transition bullet, transitionbullets, and bullet_transition all match here

		if(key.indexOf("transition") > -1) {
			if(key.indexOf("bullet") > -1) {
				transitionBullets = value;
			}
		}
	});
	console.log(res[0][2]);
}

res[1].forEach(function(slide, n) {
		slideClass = "slide";
		
		if(transitionBullets) slideClass += " transbullets";

		code += '<div class="' + slideClass + '" id="slide' + n + '">' + slide + '</div>';
			});

var body = code;

code = "<!DOCTYPE html><html><head>" +
	"<title>" + title + "</title>";

if(opts.minify) {
	code += "<style>" + fs.readFileSync(cssFile) + "</style>" +
		"<script>" + fs.readFileSync(jsFile) + "</script>";
} else {
	code +=  '<link rel="stylesheet" href="' + cssFile + '" type="text/css">' +
		 '<script src="' + jsFile + '" type="text/javascript"></script>';
}

code += "</head><body>" +
	body +
	"</body></html>";
	


// depending on the user options, either minify (production) or beautify (development)

if(opts.minify) {
	var output = minify(code, {
		minifyJS: true,
		minifyCSS: true
	});
} else {
	var output = beautify_html(code, {});
}

// write it out to a file / stdout

if (opts.output) {
    fs.createWriteStream(opts.output).write(output);
} else {
    process.stdout.write(output);
}
