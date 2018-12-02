/**
 * Splits the array onto several splits defined by the maximum size.
 * @param {Array} list input array 
 * @param {Number} max the maximum length of each split 
 * @returns Array with splits.
 */
function fragmentize(list, max = 100) {
	let fragments = [];
	if (list.length > max) {
		let off = 0;
		do {
			fragments.push(list.slice(off, off + max));
			off += max;
		} while (list.length > off);
	} else {
		fragments.push(list);
	}
	return fragments;
}
/**
 * Serilizes the object into specific format: "{ key: value } -> \key\value".
 * @param {Object} obj 
 * @returns Serialized object.
 */
function serialize(obj) {
	let delim = '\\';
	let str = '';
	for (let key in obj) {
		str += delim + key + delim + obj[key];
	}
	return str;
}

/**
 * Parses string of specific format into the js object: "\key\value -> { key: value }".
 * @param {String} string serialized string
 * @returns JS object. 
 */
function deserialize(string) {
	// santize string a bit
	string = string.replace(/^"|"\n*$/, "");
	if (!string.startsWith('\\')) string = "\\" + string;
	let obj = {};
	let nextSequence = /(\\([^\\]+)){2}/g;
	while (sequence = nextSequence.exec(string)) {
		let [key, value] = sequence[0].slice(1).split('\\');
		obj[key] = value;
	}
	return obj;
}

function getDate() {
	let d = new Date();
	return d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear()
}

function getTime() {
	let d = new Date();
	let h = d.getHours();
	let m = d.getMinutes();
	let s = d.getSeconds();
	if (h < 10) h = '0' + h;
	if (m < 10) m = '0' + m;
	if (s < 10) s = '0' + s;
	return `${h}:${m}:${s}`;
}

/**
 * Creates a logger that can print messages into specific output stream, in a specific format.
 * @param {Object} props configuration object 
 * @returns Logger function that can be used to print messages.
 */
function createLogger(props = { timestamp: true, output: process.stdout }) {
	return function log(msg) {
		const formatted = props.timestamp ? `[${getDate()} ${getTime()}] ${msg}` : msg;
		props.output.write(formatted + "\n");
	}
}

module.exports = {
	fragmentize,
	serialize,
	deserialize,
	getDate,
	getTime,
	createLogger
};