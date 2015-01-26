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

operator (>>=) 14 left {$l, $r} => #{$l.chain(λ[$r(#)])}
operator (>=>) 14 left {$l, $r} => #{λ[$l(#) >>= $r]}
operator (=>>) 14 left {$l, $r} => #{λ[$l(#) >> $r]}
operator (>>)  14 left {$l, $r} => #{$l >>= λ[$r]}

macro do {
	rule {
		{ $a:ident <- $m:expr ; $rest ... } 
	} => {
		$m >>= do {
			$rest ...
		}
	}

	rule {
		{ <- $m:expr ; $rest ... }
	} => {
		$m >> do {
			$rest ...
		}
	}

	rule {
		{ var $a:ident = $b:expr; $rest ... }
	} => {
		(function($a) {
			return do {
				$rest ...
			}
		}($b))
	}

	rule {
		{ return $a:expr }
	} => {
		this.constructor.of($a)
	}

	rule {
		{ $a ; }
	} => {
		do { $a }
	}

	rule {
		{ $a:expr }
	} => { $a }

	rule {} => {}
}

operator (@) 16 right {$l, $r} => #{ λ a -> $l($r(a)) }

Array.of = λ[[#]];
Array.empty = λ[[]];
var streamBody = State.of @ σ;
var body  = streamBody @ Array.of;
var empty = streamBody @ Array.empty;
var notFound = λ s -> status(404) >> body(s);
var redirect = λ code url -> status(code) >> header('location')(url) >> empty();

var http = require('http');
http.createServer(handle(
	do {
		<- status(418);
		<- header('x-powered-by')('caffeine');
		body('i\'m a teapot')
	}
)).listen(8080);
