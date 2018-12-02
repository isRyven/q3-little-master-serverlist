const test = require('tape');
const parser = require('../middleware/parser.js');

test('parser should return valid middleware function', (t) => {
	const middleware = parser();
	t.equals(typeof middleware, 'function', 'should return function');
	t.end();
});

test('parser should parse the raw request data and extract the channel id', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetservers", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(typeof ctxMock.request.channel, "number", "creates channel field of type number");
	t.equals(ctxMock.request.channel, -1, "parses correct channel id");
	t.end();
});

test('parser should throw an error in case it can\'t read the channel id', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff", 'binary') } };
	let itThrows = false;
	try {
		await middleware(ctxMock, () => { });
	}
	catch (err) {
		itThrows = true;
	}
	t.equals(itThrows, true, "throws an error");
	t.end();
});


test('parser should parse the raw request data and extract the method name', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetservers", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(typeof ctxMock.request.method, "string", "creates method field of type string");
	t.equals(ctxMock.request.method, "getservers", "parses correct method name");
	t.end();
});

test('parser should cut the method names to 32 chars if needed', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetserversandsomemorestuffthatisstored", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(ctxMock.request.method, "getserversandsomemorestuffthatis", "cuts very long method names");
	t.end();
});

test('parser should cut the method name once it encounters whitespace', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetservers 84", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(ctxMock.request.method, "getservers", "parses correct method name");
	t.end();
});

test('parser should cut the method name once it encounters newline', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetservers\n84", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(ctxMock.request.method, "getservers", "parses correct method name");
	t.end();
});

test('parser should cut the method name once it encounters null char', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from("\xff\xff\xff\xffgetservers\084", 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(ctxMock.request.method, "getservers", "parses correct method name");
	t.end();
});


test('parser should parse the request data and extract the body', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from('\xff\xff\xff\xffgetservers 84', 'binary') } };
	await middleware(ctxMock, () => { });
	t.equals(typeof ctxMock.request.body, "object", "adds the body field of type Object");
	t.assert(ctxMock.request.body.raw instanceof Buffer, "adds raw field into the body field of type Buffer");
	t.equals(ctxMock.request.body.raw.toString('ascii'), "84", "contains correct data");
	t.end();
});

test('parser should parse the request data, extract the body and provide a tokenized version of raw body', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from('\xff\xff\xff\xffgetservers 84 test "another test"', 'binary') } };
	await middleware(ctxMock, () => { });
	t.assert(Array.isArray(ctxMock.request.body.arguments), "should provide arguments fields");
	t.equals(ctxMock.request.body.arguments.length, 3, "should contain correct number of arguments");
	t.equals(ctxMock.request.body.arguments[0], "84", "first argument should match");
	t.equals(ctxMock.request.body.arguments[1], "test", "second argument should match");
	t.equals(ctxMock.request.body.arguments[2], "another test", "third argument should match");
	t.end();
});

test('parser should be able to parse serialized body', async (t) => {
	const middleware = parser();
	const ctxMock = { request: { data: Buffer.from('\xff\xff\xff\xffgetservers \\protocol\\84\\max_servers\\100', 'binary') } };
	await middleware(ctxMock, () => { });
	t.assert(Array.isArray(ctxMock.request.body.arguments), "should provide arguments fields");
	t.equals(ctxMock.request.body.arguments.length, 1, "should contain correct number of arguments");
	t.equals(typeof ctxMock.request.body.arguments[0], "object", "should be of correct type",);
	t.isEquivalent(Object.keys(ctxMock.request.body.arguments[0]), ["protocol", "max_servers"], "should contain correct keys");
	t.equals(ctxMock.request.body.arguments[0].protocol, "84", "should contains right value in protocol field");
	t.equals(ctxMock.request.body.arguments[0].max_servers, "100", "should contains right value in max_servers field");
	t.end();
});