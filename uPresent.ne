# uPresent grammar
# written in nearley
# see test.up for an example of what this parses

main -> config _ presentation {% function(d) {
	return [d[0], d[2]];
} %}

config -> pphrase |
	  pphrase _  configOption:+ [\s]

configOption ->   "+" pphrase "\n" {% function(d) { return [d[1], true] } %}
		        | "-" pphrase "\n" {% function(d) { return [d[1], false] } %}
                | pphrase ": " pphrase "\n" {% function(d) { return [d[0], d[2]] } %}

presentation -> slide:+ {% function(d) { return [].concat.apply([], d) } %}

slide -> "-":+ "\n" content _ {% function(d) { return d[2] } %}

content -> line:+ {% function(d) { return d[0].join(""); } %}

line -> marker "\n" {% function(d) { return d[0] } %} |
	lphrase "\n" {% function(d) { return "<p>" + d[0] + "</p>" } %} |
	listnode:+ "\n" {% function(d) { return "<ul>"+(d[0].join(""))+"</ul>" } %} |
    "\n" {% function(d) { return ""; } %}

italics -> "_" lphrase "_" {% function(d) { return "<em>" + d[1] + "</em>" } %}
bold -> "**" lphrase "**" {% function(d) { return "<strong>" + d[1] + "</strong>" } %}
image -> "![" pphrase "](" path ")" {% function(d) { return '<img alt="' + d[1] + '" src="' + d[3] + '" />' } %}

linkprotocol -> "http" | "https"
domain -> [A-Za-z\.]:+ {% function(d) { return d[0].join(""); } %}
rawlink -> linkprotocol "://" domain "/" [^ \n\t]:* {% function(d) {
			return "<a href='" + d[0] + d[1] + d[2] + d[3] + d[4].join("") + "'>" + d[0] + d[1] + d[2] + d[3] + d[4].join("") + "</a>";
		} %}

namelink -> "[" pphrase "](" path ")" {% function(d) { return '<a href="' + d[3] + '">' + d[1] + "</a>"; } %}

ln -> nophrase linecharacter:+ {% 
			function(d, blah, fail) {
				d[1] = d[1].join("");
			       	if(d[1].indexOf("http://") > -1 || d[1].indexOf("https://") > -1) { 
					return fail;
			       	}
			       	return d[0]+d[1]
		       	}
		   %}
		
lphrase -> ln {% id %}
	|  nphrase {% id %}

nophrase -> nphrase {% id %} | _ {% function() { return "" } %}

nphrase -> lphrase [#] {% function(d) { return d[0]+d[1] } %}
		| lphrase italics {% function(d) { return d[0]+d[1] } %}
		| lphrase bold {% function(d) { return d[0]+d[1] } %}
		| lphrase image {% function(d) { return d[0]+d[1] } %}
		| lphrase [\-] {% function(d) { return d[0]+d[1] } %}
		| lphrase [!] [^\[] {% function(d) { return d[0]+d[1]+d[2] } %}
		| bphrase rawlink [\s] {% function(d) { return d[0]+d[1] } %}
		| bphrase namelink {% function(d) { return d[0]+d[1] } %}
		| lphrase "[" {% function(d) { return d[0]+d[1] } %}

bphrase -> lphrase {% id %}
	| _ {% function() { return "" } %}

pphrase -> [ A-Za-z0-9!@#$%^&*()_+\-\=}{\[\]"':;?/>.<,i]:+ {% function(d) { return d[0].join("") } %}

linecharacter -> [A-Za-z0-9 @$%^&()+=.,<>/?'";:\|\]\{\}\(\)]
marker -> "# " lphrase "\n" {% function(d) {
		return "<h1>" +
			d[1] +
			"</h1>";
		} %}
	| image bphrase {% function(d) {
		return "<p>" + d[0] + d[1] + "</p>";
	} %}
	| "[hanging] " lphrase {% function(d) {
		return "<div class='hanging'>" + d[1] + "</div>";
	} %}
	| "[linebreak]" {% function(d) {
		return "<br/>";
	} %}

path -> [A-Za-z0-9:\/!@#$%^&*()_+=\-\'\.\(\)]:+ {% function(d) { return d[0].join("") } %}

listnode -> "~ " lphrase "\n" {% function(d) {
		return "<li>" + d[1] + "</li>";
	} %}
	| _ "~~ " lphrase "\n" {% function(d) {
		return "<li class='alt'>" + d[2] + "</li>"
	} %}

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
