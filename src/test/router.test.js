const test = require('tape');
const Router = require('../middleware/router');

test("should allow to instantiate new instance", (t) => {
	const router = new Router();
	t.end();
});

test('router.route should allow to add new route middlewares', (t) => {
	const router = new Router();
	router.route('getservers', async (ctx, next) => { });
	t.isEqual(router.size(), 1, "adds new route");
	t.end();
});

test('router.routes should return single middleware to run all matching routes', (t) => {
	const router = new Router();
	router.route('getservers', async (ctx, next) => { });
	router.route('getservers', async (ctx, next) => { });
	const middleware = router.routes();
	t.isEqual(typeof middleware, "function", "returns middleware");
	t.end();
});

test('should only run matching the route middlewares', async (t) => {
	const router = new Router();
	const ctxMock = { request: { method: 'getservers' } };
	let aHasRun = false, bHasRun = false, cHasRun = false;
	router.route("getservers", async (ctx, next) => {
		aHasRun = true;
		await next();
	});
	router.route("notgetservers", async (ctx, next) => {
		bHasRun = true;
		await next();
	});
	router.route("getservers", async (ctx, next) => {
		cHasRun = true;
		await next();
	})
	const middleware = router.routes();
	await middleware(ctxMock, () => { });
	t.isEqual(aHasRun, true, "route A has run");
	t.isEqual(bHasRun, false, "route B has not run");
	t.isEqual(cHasRun, true, "route C has run");
	t.end();
});

test('should allow to set default route', (t) => {
	const router = new Router();
	router.route((ctx, next) => { });
	t.end();
});

test('should run default route when no specific matches', async (t) => {
	const router = new Router();
	const ctxMock = { request: { method: 'getservers' } };
	let aHasRun = false, bHasRun = false, cHasRun = false;
	router.route(async (ctx, next) => { 
		aHasRun = true;
		await next();
	});
	router.route('heartbeat', async (ctx, next) => {
		bHasRun = true;
		await next();
	});
	router.route(async (ctx, next) => { 
		cHasRun = true;
		await next();
	});
	const middleware = router.routes();
	await middleware(ctxMock, () => { });
	t.isEqual(aHasRun, true, "A runs");
	t.isEqual(bHasRun, false, "B runs");
	t.isEqual(cHasRun, true, "C runs");
	t.end();
});

test('should not run default route when has specific match', async (t) => {
	const router = new Router();
	const ctxMock = { request: { method: 'getservers' } };
	let aHasRun = false, bHasRun = false;
	router.route('getservers', async (ctx, next) => {
		aHasRun = true;
		await next();
	});
	router.route(async (ctx, next) => {
		bHasRun = true;
		await next();
	});
	const middleware = router.routes();
	await middleware(ctxMock, () => { });
	t.isEqual(aHasRun, true, "A runs");
	t.isEqual(bHasRun, false, "B runs");
	t.end();
});