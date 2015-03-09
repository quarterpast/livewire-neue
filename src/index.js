/* jshint ignore: start */

var μ = require('immutable');
var σ = require('highland');
var State = require('fantasy-states');
var Tuple2 = require('fantasy-tuples').Tuple2;
var from = require('from');
var curry = require('curry');
var extend = require('util')._extend;

var set = curry((kk, k, v) => State.modify(state => state.setIn([kk].concat(k), v)));
var get = curry((kk, k) => State.get.map(a => a.getIn([kk].concat(k))));

var setResponse = set('res');
var getResponse = get('res');
var setRequest  = set('req');
var getRequest  = get('req');

var status = setResponse('statusCode');
var header = k => setResponse(['headers', k]);

var responseToMap = res => μ.fromJS({
	statusCode: res.statusCode,
	headers: {}
});

var LivewireState = μ.Record({
	req: μ.Map(),
	res: μ.Map()
});

var initState = (req, res) => new LivewireState({
	res: responseToMap(res),
	req: req
});

function extendResponse(httpRes, stateRes) {
	stateRes.get('headers').forEach((v, k) => httpRes.setHeader(k, v));
	return extend(httpRes, stateRes.toJS());
}

var handle = handler => (req, res) => {
	var state = typeof handler === 'function' ? handler() : handler;
	var result = state.run(initState(req, res));

	result._1.pipe(extendResponse(res, result._2.res));
};

var compose = (l, r) => function() {
	return l(r.apply(this, arguments));
};

Array.of = (a) => [a];
Array.empty = () => [];
var body  = compose(σ, Array.of);
var empty = compose(σ, Array.empty);
var notFound = s => status(404).chain(() => body(s));
var redirect = curry((code, url) => status(code).chain(() => header('location')(url)).chain(() => empty()));

