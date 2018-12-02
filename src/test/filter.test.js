const test = require('tape');
const Filter = require('../middleware/filter');

test('should allow to create filter instance', (t) => {
	const filter = new Filter();
	t.end();
});

test('should allow to add new filter handlers', (t) => {
	const filter = new Filter();
	filter.add((ctx) => { });
	filter.add((ctx) => { });
	t.isEqual(filter.size(), 2, "adds filters");
	t.end();
});

test('should return middleware', (t) => {
	const filter = new Filter();
	filter.add((ctx) => { });
	const middleware = filter.filters();
	t.isEqual(typeof middleware, 'function', "returns middleware");
	t.end();
});

test('should run filters along with middleware', async (t) => {
	const filter = new Filter();
	let aHasRun = false, bHasRun = false;
	filter.add((ctx) => {
		aHasRun = true;
		return true;
	});
	filter.add((ctx) => {
		bHasRun = true;
		return true;
	});
	const middleware = filter.filters();
	await middleware({}, () => { });
	t.isEqual(aHasRun, true, "A has run");
	t.isEqual(bHasRun, true, "B has run");
	t.end();
});

test('middleware should run next middleware if filter return true', async (t) => {
	const filter = new Filter();
	let nextHasRun = false;
	filter.add(() => true);
	const middleware = filter.filters();
	await middleware({}, () => { nextHasRun = true });
	t.isEqual(nextHasRun, true, "next middleware has run");
	t.end();
});

test('middleware should NOT run next middleware if filter return false', async (t) => {
	const filter = new Filter();
	let nextHasRun = false;
	filter.add(() => false);
	const middleware = filter.filters();
	await middleware({}, () => { nextHasRun = true });
	t.isEqual(nextHasRun, false, "next middleware has NOT run");
	t.end();
});

test('middleware should run next middleware if filters are not set', async (t) => {
	const filter = new Filter();
	let nextHasRun = true;
	const middleware = filter.filters();
	await middleware({}, () => { nextHasRun = true });
	t.isEqual(nextHasRun, true, "next middleware has run");
	t.end();
});
