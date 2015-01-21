var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');

var res = μ.fromJS({
	status: 200,
	headers: {}
});

function withState(st, f) {
	return State.modify(f).chain(function() {
		return st;
	});
}

function handler(req) {
	return withState(State.of(from(['hello world'])), function(res) {
		return res.set('status', 404);
	});
}

var out = handler().run(res);
console.log(out._2);
out._1.pipe(process.stdout);