/**
 * router middlerware
 * @module router
 */

/**
 * Creates router middleware.
 * @example
 * const router = new Router();
 * router.route('getservers', (ctx, next) => { }); // define routed middleware for 'getservers' method
 * app.use(router.routes()); // generates middleware that will run through routes
 */
class Router {
	constructor() {
		this._routes = [];
	}
	/**
	 * Registers new middleware for specified route. If first argument is passed as a middleware,
	 * this will be used as a fallback in case no matching routes are found.
	 * @param {String | Function} name should match method name or be a middleware
	 * @param {Function} middleware middleware handler for this route, if name is set to middleware this argument is optional
	 * @example
	 * router.route('getsevers', (ctx, next) => {}); // handles getservers route
	 * router.route((ctx, next) => {}); // if no match, runs this
	 */
	route(name, middleware = null) {
		if (typeof name === "function") {
			this._routes.push({ name: '', middleware: name });
		}
		else {
			if (typeof middleware !== "function") {
				throw new Error('middleware should be a function');
			}
			this._routes.push({ name, middleware });
		}
	}
	/**
	 * Returns middleware, which runs matched routes on each request.
	 * @example
	 * const router = new Router();
	 * router.route('getservers', (ctx, next) => {});
	 * app.use(router.routes());
	 */
	routes() {
		return async (ctx, next) => {
			await this._getMiddleware(ctx)();
			await next();
		};
	}
	_getMiddleware(ctx, index = 0) {
		for (let i = index; i < this._routes.length; i++) {
			const route = this._routes[i];
			// we have match, run middleware, and search for the next one
			if (route.name === ctx.request.method) {
				return this._getNextMiddleware(ctx, i, route => route.name === ctx.request.method);
			}
			// we had no matches so far, check fallback routes
			if (i + 1 == this._routes.length) {
				return this._getNextMiddleware(ctx, 0, route => !route.name);
			}
		}
		return function () { };
	}
	_getNextMiddleware(ctx, index = 0, predicate) {
		for (let i = index; i < this._routes.length; i++) {
			const route = this._routes[i];
			if (predicate(route)) {
				return () => {
					const next = this._getNextMiddleware(ctx, ++i, predicate);
					return route.middleware(ctx, next);
				}
			}
		}
		return function () { };
	}
	/**
	 * @returns Number of registered routes.
	 */
	size() {
		return this._routes.length;
	}
}

module.exports = Router;