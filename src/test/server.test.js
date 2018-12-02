const test = require('tape');
const Server = require('../server');

test('Should be able to create new Server instance', (t) => {
	const server = new Server();
	t.end();
});

test('Should be able to start and stop listen server on a specified port', async (t) => {
	const server = new Server();
	await server.listen(27950);
	const address = server.getAddress();
	await server.close();
	t.equal(address.port, 27950);
	t.end();
});

test('Should accept middleware function', (t) => {
	const server = new Server();
	server.use(function(ctx, next) { });
	try {
		server.use(12);
	}
	catch (err) {
		t.assert(true, "cannot set other type as middleware");
	}
	server.use(async function (ctx, next) { });
	t.assert(true, "should accept async functions as a middleware");
	t.end();
});

test('should run middleware chain', (t) => {
	const TestServer = class extends Server {
		constructor() {
			super();
			this._socket = { send() {} };
		}
		test() {
			this._onMessage({});
		}
	}
	const server = new TestServer();
	let calls = 0;
	const counter = (ctx, next) => (calls++, next());
	server.use(counter);
	server.use(counter);
	server.test();
	t.equals(calls, 2);
	t.end();
});

test('should run async middleware chain', async (t) => {
	const TestServer = class extends Server {
		constructor() {
			super();
			this._socket = { send() {} };
		}
		test() {
			this._onMessage({});
		}
	}
	const server = new TestServer();
	let a = 0;
	let b = 0;
	server.use(async (ctx, next) => {
		t.assert(a === 0 && b == 0, 'first middleware is called first');
		await next();
		a += 1;
		t.assert(b === 1, 'second part of first middleware is called after the second middleware');
	});
	server.use(async (ctx, next) => {
		t.assert(a == 0, "second middleware is called before first middleware is finished");
		await next();
		b += 1;
		t.assert(a == 0, "second part of the second middleware is called before first middleware is finished");
	});
	server.test();
	t.end();
});

test('middleware should accept context object, which contains request key with data', (t) => {
	const TestServer = class extends Server {
		constructor() {
			super();
			this._socket = { send() {} };
		}
		test() {
			this._onMessage(Buffer.from("hello world"), { port: 8080, address: 'localhost' });
		}
	}
	const server = new TestServer();
	server.use((ctx, next) => {
		t.assert(ctx.request !== undefined, "contains request object");
		const newRequest = {};
		ctx.request = newRequest;
		t.assert(ctx.request !== newRequest, "request object is frozen");
		t.assert(ctx.request.data !== undefined, "request has data field");
		t.assert(ctx.request.data instanceof Buffer, "data field is instance of Buffer");
		const message = ctx.request.data.toString("ascii");
		t.equals(message, "hello world", "data has correct value");

		t.equals(typeof ctx.request.info, "object", "request has info field of type object");
		t.equals(ctx.request.info.port, 8080, 'info has a port field');
		t.equals(ctx.request.info.address, "localhost", "info has an address field");
	});
	server.test();
	t.end();
});

test("middleware should be able to push response buffers", (t) => {
	const TestServer = class extends Server {
		constructor() {
			super();
			this._socket = { send() {} };
		}
		test() {
			this._onMessage(Buffer.from("hello world"), { port: 8080, address: 'localhost' });
		}
	}
	const server = new TestServer();
	server.use((ctx, next) => {
		t.assert(Array.isArray(ctx.response), "contains response field");
		const newResponse = [];
		ctx.response = newResponse;
		t.assert(ctx.response !== newResponse, "response field is frozen");
	});
	server.test();
	t.end();	
});

test("server should send buffers once middlewares have run", (t) => {
	let responses = [];
	const TestServer = class extends Server {
		constructor() {
			super();
			this._socket = {
				send(buffer, port, address, callback) {
					responses.push(buffer);
					callback();
				}
			}
		}
		test() {
			this._onMessage(null, { port: 8080, address: 'localhost' });
		}
	}
	const server = new TestServer();
	server.use((ctx, next) => {
		ctx.response.push([Buffer.from("hello world")]);
	});
	server.test();
	setTimeout(() => {
		t.assert(Array.isArray(responses[0]), "response accepts array");
		t.assert(responses[0][0] instanceof Buffer, "response accepts array of buffers");
		t.equals(responses[0][0].toString('ascii'), "hello world", "contains right response message");
		t.end();
	}, 8);
});

// TODO: force specific reponse format:
// Array<Buffer> 