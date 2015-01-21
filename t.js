var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');

var res = μ.fromJS({
	status: 200,
	headers: {}
});

function handler(req) {
	return State.of(from(['hello world'])).chain(function(st) {
		return State(function(res) {
			return Tuple2(st, res.set('status', 404));
		});
	})
}

var out = handler().run(res);
console.log(out._2);
out._1.pipe(process.stdout);