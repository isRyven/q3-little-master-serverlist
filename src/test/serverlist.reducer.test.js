const test = require('tape');
const { serverlist: reducer } = require('../reducers/serverlist.reducer');

test('should allow to add new server into the list', (t) => {
	const oldList = [];
	const newList = reducer(oldList, { type: 'ADD_SERVER', address: 'localhost', port: 27960 });
	t.isEqual(newList.length, 1, "adds new server into the list");
	t.assert(newList !== oldList, 'creates new array');
	t.end();
});

test('should allow to remove server from the list', (t) => {
	const oldList = [{ address: 'localhost', port: 27960 }, { address: 'localhost', port: 27965 }];
	const newList = reducer(oldList, { type: 'REMOVE_SERVER', address: 'localhost', port: 27960 });
	t.isEqual(newList.length, 1, "removes the server from the list");
	t.isEqual(newList[0].port, 27965, "remove the right server from the list");
	t.end();
});

test('should allow to update the server information', (t) => {
	const now = 5000;
	const oldList = [{
			address: 'localhost',
			port: 27960,
			heartbeatTime: 5000 - 1000
		},
		{
			address: 'localhost',
			port: 27965,
			heartbeatTime: 5000 - 2000
		}
	];
	const expectedList = [
		{
			address: 'localhost',
			port: 27960,
			heartbeatTime: 5000 - 1000
		},
		{
			address: 'localhost',
			port: 27965,
			heartbeatTime: 5000
		}
	];
	const resultedList = reducer(oldList, {
		type: 'UPDATE_SERVER',
		address: 'localhost',
		port: 27965,
		heartbeatTime: 5000
	});

	t.deepLooseEqual(resultedList, expectedList, "server information is updated");
	t.end();
});

test('should clear the list from the outdated servers', (t) => {
	const now = Date.now();
	const oldList = [{
		address: 'localhost',
		port: 27960,
		heartbeatTime: now - 60000 * 6,
		shutdownTime: now - 60000 * 6
	},
	{
		address: 'localhost',
		port: 27965,
		heartbeatTime: now - 60000 * 3,
		shutdownTime: now - 60000 * 3
	},
	{
		address: 'localhost',
		port: 27970,
		heartbeatTime: now
	}];
	const expectedList = [{
		address: 'localhost',
		port: 27965,
		heartbeatTime: now - 60000 * 3,
		shutdownTime: now - 60000 * 3
	},
	{
		address: 'localhost',
		port: 27970,
		heartbeatTime: now
	}];
	const resultedList = reducer(oldList, { type: 'PRUNE_SERVERS' });
	t.isEqual(resultedList.length, 2, 'resulted list contains correct number of servers');
	t.deepLooseEqual(resultedList, expectedList, "it clears list from dead servers");
	t.end();
});