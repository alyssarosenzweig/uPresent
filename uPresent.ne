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

line -> _ marker bareline "\n" |
	_ bareline "\n"

bareline -> linecharacter {% id %}
		| bareline linecharacter {% function(d) { return d[0]+d[1] } %}
		| bareline [*#] {% function(d) { return [d0]+d[1] } %}

linecharacter -> [A-Za-z0-9 !@$%^&()_+\-=.,<>/?'";:\|\]\[\{\}]
marker -> "**" | "*" | "#"

_ -> null {% function(){ return null } %}
	| [\s] _ {% function() { return null } %}
