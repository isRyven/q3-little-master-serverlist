const { createStore } = require('redux');
const { serverlist, getServers } = require('./reducers/serverlist.reducer');

const utils = require('./utils');
const Server = require('./server');
const SeverListPackager = require('./server-list-packager');
// middlewares
const logger = require('./middleware/logger');
const prefixer = require('./middleware/prefixer');
const parser = require('./middleware/parser');
const Router = require('./middleware/router');
const Filter = require('./middleware/filter');

const MESSAGE_CHANNEL = 0xffffffff | 0;
const MAX_SERVERLIST = 100;
const PORT = Number(process.env.PORT) || 27950;
const PROTOCOL = Number(process.env.PROTOCOL) || 68;

const store = createStore(serverlist);
const server = new Server();
const packager = new SeverListPackager();
const router = new Router();
const filter = new Filter();
const log = utils.createLogger();

router.route('getservers', async (ctx, next) => {
	const [protocol] = ctx.request.body.arguments;
	if (parseInt(protocol) !== PROTOCOL) {
		log(`protocol ${protocol} is not supported, ignoring`);
		ctx.response.push(["print\n", `protocol ${protocol} is not supported`]);
		return;
	}

	const fragments = utils.fragmentize(getServers(store.getState(), 'active'), MAX_SERVERLIST);

	for (let fragment of fragments) {
		ctx.response.push(["getserversResponse ", packager.package(fragment)]);
	}

	await next();
});

function isHeartbeat(argument) {
	switch (argument) {
		case 'QuakeArena-1': return PROTOCOL == 68;
		case 'Wolfenstein-1': return PROTOCOL == 60;
		case 'EnemyTerritory-1': return PROTOCOL == 84;
		default: return false;
	}
}
function isFlatline(argument) {
	switch (argument) {
		// Q3 does not send flatline
		case 'WolfFlatline-1': return PROTOCOL == 60;
		case 'ETFlatline-1': return PROTOCOL == 84;
		default: return false;
	}
}

router.route('heartbeat', async (ctx, next) => {
	const [type] = ctx.request.body.arguments;
	const areSimilar = (s1, s2) => s1.addresses === s2.addresses && s1.port === s2.port;
	if (isHeartbeat(type)) {
		if (store.getState().find((server) => areSimilar(server, ctx.request.info))) {
			store.dispatch({ type: 'UPDATE_SERVER', ...ctx.request.info, heartbeatTime: Date.now() });
		}
		else {
			store.dispatch({ type: 'ADD_SERVER', ...ctx.request.info });
		}
		store.dispatch({ type: 'PRUNE_SERVERS' });
	}
	else if (isFlatline(type)) {
		store.dispatch({ type: 'UPDATE_SERVER', ...ctx.request.info, shutdownTime: Date.now() });
	}
	else {
		log(`unknown heartbeat type/game ${type}, ignoring`);
	}
	await next();
});

// 404
router.route(async (ctx, next) => {
	log(`unknown command type ${ctx.request.method}, ignoring`);
	ctx.response.push(["print\n", `unsupported command request ${ctx.request.method}`]);
	await next();
});

filter.add((ctx) => ctx.request.channel === MESSAGE_CHANNEL);
filter.add((ctx) => ctx.request.method !== "");

// middleware usage
server.use(prefixer(MESSAGE_CHANNEL));
server.use(parser());
server.use(filter.filters());
server.use(logger(log));
server.use(router.routes());

server.on('error', (error) => console.error(error));

function greeting() {
	if (process.env.NO_GREETING) return;
	console.log('');
	console.log('+-------------------------------------------+');
	console.log('|                                           |');
	console.log("|        little q3 master serverlist        |");
	console.log('|                                           |');
	console.log('+-------------------------------------------+');
	console.log('');
}

server.listen(PORT);
greeting();
console.log(`[${utils.getDate()} ${utils.getTime()}] started listen server on port ${PORT} to serve protocol ${PROTOCOL}`);