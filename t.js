var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');

var res = μ.fromJS({
	status: 200,
	headers: {}
});

var set = curry(function set_(k, v) {
	return State.modify(function(state) {
		return state.set(k, v);
	});
});

var status = set('status');

function body(s) {
	return function() {
		return State.of(s);
	}
}

function handler(req) {
	return status(404).chain(body(from(['hello world'])));
}

var out = handler().run(res);
console.log(out._2);
out._1.pipe(process.stdout);