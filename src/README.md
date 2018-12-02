Little nodejs master serverlist broadcaster that supports several protocols: 
* 68 (Q3)
* 60 (RTCW)
* 84 (W:ET)
* can be extended to support more

At that moment, handles single protocol at a time, but could be extended to handle multiple protocols per instance.

#### Usage
* install Nodejs 11+
* clone the repo
* install deps: `npm install`
* run server: `npm start`

By default it runs on port `27950` and serves the procol `68` (Q3). You can change the protocol by setting `PROTOCOL` environment variable.   
`PROTOCOL=84 npm start`

You can change the listen port by setting the `PORT` environment variable.  
`PORT=8484 npm start` 

#### Extension
The inner architecture uses the middleware approach to extend the server functionality. It's rather simple to extend the server to support additional request commands and their properties. Check the `src/main.js` file to grasp the idea.

#### Misc
* Run tests: `npm test`
* Check covarage: `npm run coverage`, generates lcov report
* Generate JSDoc: `npm doc`

MIT license