/**
 * parser middlerware
 * @module parser
 */
const { deserialize } = require('../utils');

/**
 * Tokenizes string into argument chunks, also can convert serialized map into an object.
 * @param {String} str input string
 * @returns arrays of arguments
 * @example
 * tokenize('getservers 84'); // -> ["getserver", "84"]
 * tokenize('test "multiline string"'); // -> ["test", "mutiline string"]
 * tokenize('getservers \\protocol\\84\\max_servers\\100'); // -> ["getservers", { protocol: 84, max_servers: 100 }]
 */
function tokenize(str) {
	const seqs = (`${str}`).split(/(\"[^"]*\")/).filter(seq => seq !== "").map(seq => seq.trim());
	const args = [];
	for (let seq of seqs) {
		if (seq.startsWith('"')) {
			args.push(seq.replace(/"/g, ''));
		}
		else if (seq.startsWith('\\')) {
			args.push(deserialize(seq));
			break;
		}
		else {
			args.push(...seq.split(/\s+/));
		}
	}
	return args;
}

const NULL = 0;
const WHITESPACE = 32;
const NEWLINE = 10;

/**
 * Returns parser middleware, which parses the request data. Extracts channel, method name
 * and body. Body can be accessed as tokenized array or as a raw buffer. Basically
 * it creates additional fields in the ctx.request object, that can be used further:
 * <pre>
 * {
 *   channel: Number, // first four bytes are considered to be channel id
 *   method: String, // first word in the buffer
 *   // the rest after the first word
 *   body: {
 *      arguments: Array<String>,
 *      raw: Buffer
 * 	 }
 * } 
 * </pre>
 * Body tokenization is lazy.
 */
function parser() {
	return async function (ctx, next) {
		const { data } = ctx.request;
		let channel = 0;
		let method = "";
		let cachedArgs = null;
		let body = {
			get arguments() {
				if (Array.isArray(cachedArgs)) return cachedArgs;
				cachedArgs = tokenize(this.raw.toString('ascii'));
				return cachedArgs;
			},
			raw: Buffer.from("")
		};
		
		// parse channel
		if (data.length < 4) throw new Error('not enough bytes to parse channel');
		channel = data.readInt32LE();

		// parse method
		if (data.length >= 4) {
			let end = 4;
			let len = Math.min(data.length, 32 + 4); // don't allow long method names
			loop: for (; end < len; end++) {
				switch (data[end]) {
					case NULL:
					case NEWLINE:
					case WHITESPACE:
						break loop;
				}
			}
			method = data.slice(4, end).toString('ascii');
			if (end < data.length) {
				body.raw = data.slice(end + 1);
			}
		}

		// define new fields 
		Object.defineProperties(ctx.request, {
			channel: { value: channel, frozen: true },
			method: { value: method, frozen: true },
			body: { value: body, frozen: true }
		});
		
		await next();
	}
}

module.exports = parser;