/**
 * Packs the serverlist into the raw buffer format, that other games can understand and unpack.
 * Memoizes the result.
 */
class ServerListPackager {
	constructor() {
		this._cache = new WeakMap();
	}
	/**
	 * Converts serverlist into an octet buffer.
	 * @param {Array<Object>} serverlist serverlist to convert into a buffer 
	 * @returns Octet buffer.
	 */
	package(serverlist) {
		if (this._cache.has(serverlist)) {
			return this._cache.get(serverlist); 
		}
		const buffer = this._pack(serverlist);
		this._cache.set(serverlist, buffer);
		return buffer;
	}
	_pack(list) {
		let buffer = [];
		for (let address of list) {
			let { address: host, port } = address;
			buffer.push('\\'.charCodeAt());
			for (let byte of host.split('.')) {
				buffer.push(Number(byte))
			}
			port = Number(port);
			buffer.push(port >> 8);
			buffer.push(port & 0x000000ff);
		}
		buffer.push('\\'.charCodeAt());
		buffer.push('E'.charCodeAt());
		buffer.push('O'.charCodeAt());
		buffer.push('T'.charCodeAt());
		return Buffer.from(buffer);
	}
}

module.exports = ServerListPackager;