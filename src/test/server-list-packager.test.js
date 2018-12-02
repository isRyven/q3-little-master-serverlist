const test = require('tape');
const ServerListPackager = require('../server-list-packager');

test('should allow to initialize the ServerListPackager', (t) => {
	const packager = new ServerListPackager();
	t.end();
});

test('should package the server list object into a buffer', (t) => {
	const packager = new ServerListPackager();
	const serverlist = [{ address: '127.0.0.1', port: 27960 }];
	const buffer = packager.package(serverlist);
	t.assert(buffer instanceof Buffer, 'returns Buffer');
	t.isEqual(buffer.length, 11, 'has correct size of buffer');
	t.end();
});

test('should CORRECTLY package the server list object into a buffer', (t) => {
	const packager = new ServerListPackager();
	const serverlist = [{ address: '127.0.0.1', port: 27960 }];
	const buffer = packager.package(serverlist);
	const expectedBuffer = Buffer.from([92, 127, 0, 0, 1, 109, 56, 92, 69, 79, 84]);
	t.looseEquals(buffer, expectedBuffer, "returns correctly packaged buffer");
	t.end();
});

test('should memoize previously passed serverlist', (t) => {
	const packager = new ServerListPackager();
	const serverlist = [{ address: '127.0.0.1', port: 27960 }];
	const buffer = packager.package(serverlist);
	const buffer2 = packager.package(serverlist);
	t.isEqual(buffer, buffer2);
	t.end();
});