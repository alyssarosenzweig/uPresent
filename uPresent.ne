# uPresent grammar
# written in nearley
# see test.up for an example of what this parses

main -> config _ presentation _ {% function(d) {
	return [d[0], d[2]];
} %}

config -> pphrase |
	  pphrase _  configOption:+ [\s]

configOption -> "+" pphrase "\n" {% function(d) { return [d[0], true] } %}
		| "-" pphrase "\n" {% function(d) { return [d[0], false] } %}
		| pphrase ": " pphrase "\n" {% function(d) { return [d[0], d[2]] } %}

presentation -> slide |
		presentation slide {% function(d) {
			return d[0].concat([d[1]]);
		} %}

slide -> slidemarker "\n" content _ {%
	function(d) {
		return d[2]
	} %}

slidemarker -> "-" {% function() { return null } %}
		| slidemarker "-" {% function() { return null } %}

content -> line | 
	   content line {% function(d) { return d[0] + d[1] } %}

line -> _ marker "\n" {% function(d) { return d[1] } %} |
	_ lphrase "\n" {% function(d) { return "<p>" + d[1] + "</p>" } %} |
	_ list "\n" {% function(d) { return "<ul>"+d[1]+"</ul>" } %}

italics -> "_" lphrase "_" {% function(d) { return "<em>" + d[1] + "</em>" } %}
bold -> "**" lphrase "**" {% function(d) { return "<strong>" + d[1] + "</strong>" } %}
image -> "![" pphrase "](" path ")" {% function(d) { return '<img alt="' + d[1] + '" src="' + d[3] + '" />' } %}

linkprotocol -> "http" | "https"
domain -> [A-Za-z\.]:+ {% function(d) { return d[0].join(""); } %}
rawlink -> linkprotocol "://" domain {% function(d) {
			return "<a href='" + d[0] + d[1] + d[2] + "'>" + d[0] + d[1] + d[2] + "</a>";
		} %}
	| linkprotocol "://" domain "/" [^ \n]:+ {% function(d) {
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
		| bphrase rawlink {% function(d) { return d[0]+d[1] } %}
		| bphrase namelink {% function(d) { return d[0]+d[1] } %}
		| lphrase "[" {% function(d) { return d[0]+d[1] } %}

bphrase -> lphrase {% id %}
	| _ {% function() { return "" } %}

pphrase -> pcharacter {% id %}
	| pphrase pcharacter {% function(d) { return d[0]+d[1] } %}
 
pcharacter -> [ A-Za-z0-9!@#$%^&*()_+\-\=}{\[\]"':;?/>.<,]

linecharacter -> [A-Za-z0-9 @$%^&()+=.,<>/?'";:\|\]\{\}]
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

pathchar -> [A-Za-z0-9:\/!@#$%^&*()_+=\-\'\.] {% id %}
path ->   pathchar {% id %}
	| path pathchar {% function(d) { return d[0]+d[1] } %}

listnode -> "~ " lphrase "\n" {% function(d) {
		return "<li>" + d[1] + "</li>";
	} %}
	| _ "~~ " lphrase "\n" {% function(d) {
		return "<li class='alt'>" + d[2] + "</li>"
	} %}

list -> listnode {% id %} |
	list listnode {% function(d) { return d[0]+d[1] } %}

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
