var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');
var extend = require('util')._extend;

var set = curry(function set_(kk, k, v) {
	return State.modify(function(state) {
		return state.set(kk, state[kk].set(k, v));
	});
});

var get = curry(function set_(kk, k) {
	return State.get.map(function(state) {
		return state.get(kk).get(k);
	});
});

var setResponse = set('res');
var getResponse = get('res');
var setRequest  = set('req');
var getRequest  = get('req');

var status = setResponse('statusCode');

function body(s) {
	return function() {
		return State.of(s);
	};
}

function responseToMap(res) {
	return μ.Map({
		statusCode: res.statusCode
	});
}

var LivewireState = μ.Record({
	req: μ.Map(),
	res: μ.Map()
});

function initState(req, res) {
	return new LivewireState({
		res: responseToMap(res),
		req: req
	});
}

var handle = curry(function handle_(handler, req, res) {
	var state = typeof handler === 'function' ? handler() : handler;
	var result = state.run(initState(req, res));
	result._1.pipe(extend(res, result._2.res.toJS()));
});

var http = require('http');
http.createServer(handle(
	status(418).chain(function() {
		return State.of(from(['i\'m a teapot']));
	})
)).listen(8080);

/*
do {
	<- status(418);
	<- header('x-powered-by', 'caffeine');
	body('i\'m a teapot');
}
*/