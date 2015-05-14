/*
 * frontend to the nearley grammar powering uPresent
 * depends on nearley from npm, obviously
 */

var fs = require("fs");
var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
var beautify_html = require("js-beautify").html;

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

parser.feed(input);

var output = beautify_html(parser.results[0], {
			
		});

if (opts.output) {
    fs.createWriteStream(opts.output).write(output);
} else {
    process.stdout.write(output);
}
