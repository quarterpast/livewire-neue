var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');
var extend = require('util')._extend;

var set = curry(function set_(k, v) {
	return State.modify(function(state) {
		console.log(k,v);
		return state.set(k, v);
	});
});

var status = set('statusCode');

function body(s) {
	return function() {
		return State.of(s);
	}
}

function responseToMap(res) {
	return μ.Map({
		statusCode: res.statusCode
	});
}

var handle = curry(function handle_(handler, req, res) {
	var result = handler(req).run(responseToMap(res));
	result._1.pipe(extend(res, result._2.toJS()));
});

var http = require('http');
http.createServer(handle(function(req) {
	return status(418).chain(body(from(['i\'m a teapot'])));
})).listen(8080);

/*
do {
	<- status(418);
	<- header('x-powered-by', 'caffeine');
	body('i\'m a teapot');
}
*/