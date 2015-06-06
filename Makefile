all: uPresent_ne.js

uPresent_ne.js: uPresent.ne
	nearleyc uPresent.ne -o uPresent_ne.js

ide: 
	make -C browser/ 
