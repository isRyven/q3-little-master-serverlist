/**
 * filter middlerware
 * @module filter
 */

/**
 * Filter allows to create filter middleware that can be used to filter out unwanted connections.
 */
class Filter {
	constructor() {
		this._filters = [];
	}
	/**
	 * Adds new filter to the collection.
	 * @param {Function} predicate
	 * @example
	 * filter.add((ctx) => ctx.request.method === "getservers"); // only "getservers" method is allowed 
	 */
	add(predicate) {
		this._filters.push(predicate);
	}
	/**
	 * Returns the middleware that should run filters to test the request.
	 * @returns middleware
	 */
	filters() {
		return async (ctx, next) => {
			for (let filter of this._filters) {
				if (!(await filter(ctx))) return;
			}
			await next();
		}
	}
	/**
	 * Returns the number of added filters.
	 * @returns length
	 */
	size() {
		return this._filters.length;
	}
}

module.exports = Filter;