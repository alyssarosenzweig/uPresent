/*
 * frontend to the nearley grammar powering uPresent
 * depends on nearley from npm, obviously
 */

var fs = require("fs");
var grammar = require("./uPresent.ne.js");
var nearley = require("nearley");
var parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);

parser.feed(fs.readFileSync(process.argv[2]).toString());

console.log(parser.results[0]);
