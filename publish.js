#!/usr/bin/env node

/*
 * frontend to the nearley grammar powering uPresent
 * depends on nearley from npm, obviously
 */

var fs = require("fs");
var backend = require("./publish_core.js");

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

var input = fs.readFileSync(opts.input).toString();
var output = backend(input, opts.minify, true); // heavy lifting is performed by publish_core

// write it out to a file / stdout

if (opts.output) {
	fs.createWriteStream(opts.output).write(output);
} else {
	process.stdout.write(output);
}
