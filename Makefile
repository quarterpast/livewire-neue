all: lib/index.js

lib/%.js: src/%.js
	node_modules/.bin/babel $(BABEL_OPTS) -o $@ $<