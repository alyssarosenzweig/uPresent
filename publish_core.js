/*
 * backend for the uPresent publisher
 * interfaces to the nearley grammar and provides a few other niceties
 * the main publish.js calls this internally
 */

var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
var beautify_html = require("js-beautify").html;
var minify = require("html-minifier").minify;

var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);

function publish(input, shouldMinify, cssContents, jsContents) {
	var cssFile = "style.css",
		jsFile = "scripts.js";
	
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

			// only similar options are needed to match
			// eg, transition bullet, transitionbullets, and bullet_transition all match here

			if(key.indexOf("transition") > -1) {
				if(key.indexOf("bullet") > -1) {
					transitionBullets = value;
				}
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

	if(shouldMinify) {
		code += "<style>" + cssContents + "</style>" +
			"<script>" + jsContents + "</script>";
	} else {
		code +=  '<link rel="stylesheet" href="' + cssFile + '" type="text/css">' +
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
