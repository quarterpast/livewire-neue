/* jshint ignore: start */

var μ = require('immutable');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');
var extend = require('util')._extend;

var set = λ kk k v -> State.modify(λ state -> state.set(kk, state[kk].set(k, v)));
var get = λ kk k -> State.get.map(λ[#.get(kk).get(k)]);

var setResponse = set('res');
var getResponse = get('res');
var setRequest  = set('req');
var getRequest  = get('req');

var status = setResponse('statusCode');
var body = λ s _ -> State.of(s);

var responseToMap = λ res -> μ.Map({
	statusCode: res.statusCode
});

var LivewireState = μ.Record({
	req: μ.Map(),
	res: μ.Map()
});

var initState = λ(req, res) -> new LivewireState({
	res: responseToMap(res),
	req: req
});

var handle = λ handler (req, res) -> {
	var state = typeof handler === 'function' ? handler() : handler;
	var result = state.run(initState(req, res));
	result._1.pipe(extend(res, result._2.res.toJS()));
};

macro $ {
	rule { $r:expr } => { λ _ -> $r }
}
operator (>>=) 14 left {$l, $r} => #{$l.chain(λ[$r(#)])}
operator (>>)  14 left {$l, $r} => #{$l >>= $ $r}

macro GET {
	rule { $path:lit $hand:expr } => { [$path, method.get($ $hand)] }
}

var http = require('http');
http.createServer(handle(route([
	GET '/' status(418) >> State.of(from(['i\'m a teapot']))
]))).listen(8080);

/*
do {
	<- status(418);
	<- header('x-powered-by', 'caffeine');
	body('i\'m a teapot');
}
*/
