/* jshint ignore: start */

var μ = require('immutable');
var σ = require('highland');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');
var extend = require('util')._extend;

var set = λ kk k v -> State.modify(λ state -> state.setIn([kk].concat(k), v));
var get = λ kk k -> State.get.map(λ[#.getIn([kk].concat(k))]);

var setResponse = set('res');
var getResponse = get('res');
var setRequest  = set('req');
var getRequest  = get('req');

var status = setResponse('statusCode');
var header = λ k -> setResponse(['headers', k]);

var responseToMap = λ res -> μ.fromJS({
	statusCode: res.statusCode,
	headers: {}
});

var LivewireState = μ.Record({
	req: μ.Map(),
	res: μ.Map()
});

var initState = λ(req, res) -> new LivewireState({
	res: responseToMap(res),
	req: req
});

function extendResponse(httpRes, stateRes) {
	stateRes.get('headers').forEach(λ(v, k) -> httpRes.setHeader(k, v));
	return extend(httpRes, stateRes.toJS());
}

var handle = λ handler (req, res) -> {
	var state = typeof handler === 'function' ? handler() : handler;
	var result = state.run(initState(req, res));

	result._1.pipe(extendResponse(res, result._2.res));
};

macro $ {
	rule { $r:expr } => { λ[$r] }
}
operator (>>=) 14 left {$l, $r} => #{$l.chain(λ[$r(#)])}
operator (>=>) 14 left {$l, $r} => #{λ[$l(#) >>= $r]}
operator (=>>) 14 left {$l, $r} => #{λ[$l(#) >> $r]}
operator (>>)  14 left {$l, $r} => #{$l >>= $ $r}

macro GET {
	rule { $path:lit $hand:expr } => { [$path, method.get($ $hand)] }
}

operator (#) 16 right {$l, $r} => #{ λ a -> $l($r(a)) }

Array.of = λ[[#]];
var body = State.of # σ # Array.of;
var notFound = λ s -> status(404) >> body(s);

var http = require('http');
http.createServer(handle(
	notFound('i\'m a teapot')
)).listen(8080);

/*
do {
	<- status(418);
	<- header('x-powered-by', 'caffeine');
	body('i\'m a teapot');
}
*/
