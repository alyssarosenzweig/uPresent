# uPresent grammar
# written in nearley
# see test.up for an example of what this parses

@{% var slideCount = 0; %}

main -> lphrase _ presentation _ {% function(d) {
       		return "<!DOCTYPE html><html><head>" +
			"<title>" + d[0] + "</title>" +
			'<link rel="stylesheet" href="style.css" type="text/css">' +
			'<script src="scripts.js" type="text/javascript"></script>' +
			"</head><body onload='load()'>" +
			d[2] +
			"</body></html>";
	} %}

presentation -> slide {% id %} |
		presentation slide {% function(d) {
			return d[0] + d[1];
		} %}

slide -> slidemarker "\n" content _ {%
	function(d) {
		var slideNumber = slideCount++;	

		return "<div class='slide' id='slide" +
			
			slideNumber +

			"'>"
			+ d[2]
			+ "</div>"
	} %}

slidemarker -> "-" {% function() { return null } %}
		| slidemarker "-" {% function() { return null } %}

content -> line | 
	   content line {% function(d) { return d[0] + d[1] } %}

line -> _ marker "\n" {% function(d) { return d[1] } %} |
	_ lphrase "\n" {% function(d) { return "<p><ul>" + d[1] + "</ul></p>" } %}

italics -> "_" lphrase "_" {% function(d) { return "<em>" + d[1] + "</em>" } %}
bold -> "**" lphrase "**" {% function(d) { return "<strong>" + d[1] + "</strong>" } %}
image -> "![" pphrase "](" path ")" {% function(d) { return '<img alt="' + d[1] + '" src="' + d[3] + '" />' } %}

lphrase -> linecharacter {% id %}
		| lphrase linecharacter {% function(d) { return d[0]+d[1] } %}
		| lphrase [#] {% function(d) { return d[0]+d[1] } %}
		| lphrase italics {% function(d) { return d[0]+d[1] } %}
		| lphrase bold {% function(d) { return d[0]+d[1] } %}
		| lphrase image {% function(d) { return d[0]+d[1] } %}
		| lphrase [\-] {% function(d) { return d[0]+d[1] } %}
		| lphrase [!] [^\[] {% function(d) { return d[0]+d[1]+d[2] } %}

bphrase -> lphrase {% id %}
	| _ {% function() { return "" } %}

pphrase -> pcharacter {% id %}
	| pphrase pcharacter {% function(d) { return d[0]+d[1] } %}
 
pcharacter -> [ A-Za-z0-9!@#$%^&*()_+\-\=}{\[\]"':;?/>.<,]

linecharacter -> [A-Za-z0-9 @$%^&()+=.,<>/?'";:\|\]\[\{\}]
marker -> "~~ " lphrase {% function(d) {
		return "<li class='alt'>"  + d[1] + "</li>";
	} %}
	
	| "~ " lphrase {% function(d) {
	       return "<li>" + d[1] + "</li>";
	} %}

	| "#" lphrase {% function(d) {
		return "<h1>" +
			d[1] +
			"</h1>";
		} %}
	| image bphrase {% function(d) {
		return "<p><ul>" + d[0] + d[1] + "</ul></p>";
	} %}

pathchar -> [A-Za-z0-9:\/!@#$%^&*()_+=\-\'\.] {% id %}
path ->   pathchar {% id %}
	| path pathchar {% function(d) { return d[0]+d[1] } %}

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
