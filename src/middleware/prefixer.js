/**
 * prefixer middlerware
 * @module prefixer
 */

const MESSAGE_CHANNEL = 0xffffffff | 0; // default connectionless channel, which equals in decimals to -1

/**
 * Assigns the channel id to all response messages.
 * @param {Number} channel sets custom channel id
 */
function prefix(channel = MESSAGE_CHANNEL) {
	return async function (ctx, next) {
		await next();
		// assign channel message to responses
		let buffer = Buffer.alloc(4);
		buffer.writeInt32LE(channel);
		for (let chunk of ctx.response) {
			chunk.unshift(buffer);
		}
	}
}

module.exports = prefix;