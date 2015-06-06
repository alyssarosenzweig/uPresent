all:
	browserify IDE/ide.js -o IDE/browser.partial.js
	cat IDE/browser.partial.js IDE/CodeMirror/*.js > IDE/browser.output.js
	uglifyjs IDE/browser.output.js --mangle --compress --screw-ie8 -b beautify=false,ascii-only=true -o IDE/browser.publish.js
	browserify target/target.js -o target/browser.output.js
	uglifyjs target/browser.output.js --mangle --compress --screw-ie8 -o target/browser.publish.js
