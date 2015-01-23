SJS_OPTS = -r

all: index.js

%.js: %.sjs
	node_modules/.bin/sjs $(SJS_OPTS) -o $@ $<