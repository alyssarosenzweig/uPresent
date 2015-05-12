# uPresent grammar
# written in nearley
# see test.up for an example of what this parses

main -> content _ {% id %}

presentation -> slide |
		slide presentation {% function(d) {
			return [d[0]].concat(d[1]);
		} %}

slide -> slidemarker content

slidemarker -> "-" {% function() { return null } %}
		| slidemarker "-" {% function() { return null } %}

content -> line | 
	   content line {% function(d) { return d[0].concat([d[1]]) } %}

line -> _ marker lphrase "\n" |
	_ lphrase "\n"

italics -> "_" lphrase "_" {% function(d) { return "<i>" + d[1] + "</i>" } %}
bold -> "**" lphrase "**" {% function(d) { return "<b>" + d[1] + "</b>" } %}

lphrase -> linecharacter {% id %}
		| lphrase linecharacter {% function(d) { return d[0]+d[1] } %}
		| lphrase [#] {% function(d) { return d[0]+d[1] } %}
		| lphrase italics {% function(d) { return d[0]+d[1] } %}
		| lphrase bold {% function(d) { return d[0]+d[1] } %}

linecharacter -> [A-Za-z0-9 !@$%^&()+\-=.,<>/?'";:\|\]\[\{\}]
marker -> "~~" | "~" | "#"

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
