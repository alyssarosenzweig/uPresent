all: uPresent.ne.js

uPresent.ne.js: uPresent.ne
	nearleyc uPresent.ne -o uPresent.ne.js

ide: 
	make -C browser/ ide
