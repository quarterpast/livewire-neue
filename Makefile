SJS_OPTS = -r -m lambda-chop/macros

all: index.js

%.js: %.sjs
	node_modules/.bin/sjs $(SJS_OPTS) -o $@ $<