const dgram = require('dgram');
const EventEmitter = require('events');
/**
 * Simple wrapper over UDP that provides a facility to create server which can be extended with the help of middlewares.
 * @example
 * const server = new Server();
 * server.use((ctx, next) => {}); // register middleware
 * server.on('error', (err) => console.error(err)); // listen for all async errors
 * server.listen(27960); // starts server on port 27960
 */
class Server extends EventEmitter {
	constructor() {
		super();
		this._socket = new dgram.Socket('udp4');
		this._socket.on('error', (error) => this._onError(error));
		this._socket.on('message', (message, rinfo) => this._onMessage(message, rinfo));
		this._middlewares = [];
	}
	_onError(error) {
		this.emit('error', error);
	}
	_onMessage(message, rinfo) {
		this._runMiddleware(message, rinfo);
	}
	async _runMiddleware(message, rinfo) {
		const ctx = {};
		Object.defineProperty(ctx, "request", {
			value: { data: message, info: rinfo },
			frozen: true
		});
		Object.defineProperty(ctx, "response", { value: [], frozen: true });
		
		try {
			await this._prepareNext(ctx, 0)();

			for (let buffer of ctx.response) {
				if (!Array.isArray(buffer)) {
					throw new Error('response only accepts array of buffers');
				}
				await this._sendBuffer(rinfo, buffer);
			}
		}
		catch (error) {
			this.emit('error', error);
		}
	}
	_prepareNext(ctx, nextIndex) {
		if (nextIndex == this._middlewares.length) {
			return function () {}
		}
		return () => {
			const current = this._middlewares[nextIndex];
			const next = this._prepareNext(ctx, ++nextIndex);
			return current(ctx, next);
		}
	}
	_sendBuffer(to, buffer) {
		return new Promise((resolve, reject) => {
			this._socket.send(buffer, to.port, to.address, (error) => {
				if (error)
					reject(error);
				else
					resolve();
			});
		});
	}
	/**
	 * Starts listen server.
	 * @param {Number} port
	 */
	listen(port = 0) {
		return new Promise((resolve, reject) => {
			this._socket.bind(port, resolve);
		});
	}
	/**
	 * @returns Server address.
	 */
	getAddress() {
		return this._socket.address();
	}
	/**
	 * Closes active connection.
	 */
	close() {
		return new Promise((resolve, reject) => {
			this._socket.close(resolve);
		});
	}
	/**
	 * Registers middleware to handle requests.
	 * @param {Function} middleware middleware to use when new request appears
	 * @example
	 * app.use(async (ctx, next) => { 
	 * 		console.log("before");
	 * 		await next();  // pass control to the next middleware
	 * 		console.log("after");
	 * });
	 */
	use(middleware) {
		if (typeof middleware !== "function") {
			throw new Error('Only function type is accepted as middleware!');
		}
		this._middlewares.push(middleware);
	}
}

module.exports = Server;