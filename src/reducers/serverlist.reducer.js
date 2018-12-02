function createServerObject(object) {
	const now = Date.now();
	return Object.assign({ creationTime: now, shutdownTime: 0, heartbeatTime: now }, object);
}

const MAX_HEARTBEAT_DELAY = 60000 * 2; // 2 mins
const MAX_SHUTDOWN_DELAY = 60000 * 5; // 5 mins
const MAX_CREATION_DELAY = 60000 * 10; // 10 mins

const serverlist = (state = [], action) => {
	switch (action.type) {
		case 'ADD_SERVER':
			return [...state, createServerObject({
				address: action.address, port: action.port
			})];
		case 'REMOVE_SERVER':
			return state.filter((server) => {
				return server.address !== action.address || server.port !== action.port;
			});
		case 'UPDATE_SERVER':
			return state.map((server) => {
				if (server.port === action.port && server.address === action.address) {
					delete action.type;
					return Object.assign(server, action);
				}
				return server;
			});
		case 'PRUNE_SERVERS':
			const now = Date.now();
			return state.filter((server) => {
				// no heartbeat for more than MAX_HEARTBEAT_DELAY min...
				if (now - server.heartbeatTime > MAX_HEARTBEAT_DELAY) {
					// give it MAX_SHUTDOWN_DELAY mins to restart
					if (now - server.shutdownTime < MAX_SHUTDOWN_DELAY) {
						return true;
					}
					// no shutdown? must be crash, bad server. Or no restart was issued.
					return false;
				}
				return true;
			});
		default:
			return state;
	}
};

/**
 * Filters serverlist based on the passed in type.
 * @param {Array} state severlist
 * @param {String} filter filter type 
 * @return Filtered serverlist.
 */
const getServers = (state, filter) => {
	switch (filter) {
		case 'active': {
			const now = Date.now();
			return state.filter((server) => {
				if (now - server.heartbeatTime > MAX_HEARTBEAT_DELAY) {
					return false;
				}
				// don't show new servers immediately
				if (now - server.creationTime < MAX_CREATION_DELAY) {
					return false;
				}
				return true;
			});
		}
		default:
			return state;
	}
};

module.exports = {
	serverlist,
	getServers
};