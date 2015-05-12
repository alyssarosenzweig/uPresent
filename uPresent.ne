# uPresent grammar
# written in nearley
# see test.up for an example of what this parses

main -> presentation _ {% id %}

presentation -> slide |
		slide presentation {% function(d) {
			return d[0] + d[1];
		} %}

slide -> slidemarker "\n" content {%
	function(d) {
		return "<div class='slide'>"
			+ d[2]
			+ "</div>"
	} %}

slidemarker -> "-" {% function() { return null } %}
		| slidemarker "-" {% function() { return null } %}

content -> line | 
	   content line {% function(d) { return d[0] + d[1] } %}

line -> _ marker "\n" {% function(d) { return d[1] + "<br/>" } %} |
	_ lphrase "\n" {% function(d) { return d[1] + "<br/>" } %}

italics -> "_" lphrase "_" {% function(d) { return "<i>" + d[1] + "</i>" } %}
bold -> "**" lphrase "**" {% function(d) { return "<b>" + d[1] + "</b>" } %}

lphrase -> linecharacter {% id %}
		| lphrase linecharacter {% function(d) { return d[0]+d[1] } %}
		| lphrase [#] {% function(d) { return d[0]+d[1] } %}
		| lphrase italics {% function(d) { return d[0]+d[1] } %}
		| lphrase bold {% function(d) { return d[0]+d[1] } %}

linecharacter -> [A-Za-z0-9 !@$%^&()+\-=.,<>/?'";:\|\]\[\{\}]
marker -> "~~" lphrase {% function(d) {
		return "&#8227; " + d[1];
	} %}
	
	| "~" lphrase {% function(d) {
	       return "&bull; " + d[1];
	} %}

	| "#" lphrase {% function(d) {
		return "<h1>" +
			d[1] +
			"</h1>";
		} %}

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
