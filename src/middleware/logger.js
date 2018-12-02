/**
 * logger middlerware
 * @module logger
 */

/**
 * Creates simple logger middleware, that prints all requests and responses.
 * @param {Function} log optional logger function to direct all prints into 
 */
function logger(log = console.log) {
	return async function (ctx, next) {
		const request = ctx.request.method || "NO_REQUEST";
		log(`${ctx.request.info.address}:${ctx.request.info.port} -> ${request}`);
		await next();
		if (ctx.response.length) {
			const [response] = ctx.response[0];
			log(`${ctx.request.info.address}:${ctx.request.info.port} <- ${response}`);
		}
	}
}

module.exports = logger;