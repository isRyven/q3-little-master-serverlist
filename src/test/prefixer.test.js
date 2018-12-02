const test = require('tape');
const prefix = require('../middleware/prefixer');

test('prefix should return valid middleware function', (t) => {
	const middleware = prefix();
	t.equals(typeof middleware, 'function', 'should return function');
	t.end();
});

test('prefix should set valid header to response buffer', async (t) => {
	const middleware = prefix();
	const ctxMock = { response: [] };
	await middleware(ctxMock, () => { ctxMock.response.push([Buffer.from("output")]) });
	t.equals(ctxMock.response[0][0].slice(0, 4).readInt32LE(), 0xffffffff | 0, "should set the header for the output");
	t.end();
});

test('prefix should set valid header to response buffers', async (t) => {
	const middleware = prefix();
	const ctxMock = { response: [] };
	await middleware(ctxMock, () => {
		ctxMock.response.push([Buffer.from("output")]);
		ctxMock.response.push([Buffer.from("output")]);
		ctxMock.response.push([Buffer.from("output")]);
	});
	for (let i = 0; i < 3; i++) {
		t.equals(ctxMock.response[i][0].slice(0, 4).readInt32LE(), 0xffffffff | 0, `should set the header for the ${i + 1} response`);
	}
	t.end();
});

test('prefix should allow setting custom channel id', async (t) => {
	const middleware = prefix(0xffff);
	const ctxMock = { response: [] };
	await middleware(ctxMock, () => {
		ctxMock.response.push([Buffer.from('output')]);
	});
	t.equals(ctxMock.response[0][0].slice(0, 4).readInt32LE(), 0xffff, `should contain specified channel`);
	t.end();
});