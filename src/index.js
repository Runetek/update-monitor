// require hook for using ES6 via babel for forking and stuff.
if ( ! global._babelPolyfill) {
  require('babel/register')({
    ignore: false
  });
}

const error = require('debug')('http:error');

import { fork } from 'child_process';

import * as RedisUtil from './util/redis';
import { startHttpServer } from './http/server';

function spawnUpdateChecker() {
  const child = fork(__dirname + '/rt/updater', [process.argv[2]], {
    execPath: './node_modules/.bin/babel-node',
    execArgv: ['--harmony'],
    silent: true
  });
}

RedisUtil
  .waitForRedis()
  .catch((err) => {
    error(err);
    process.exit();
  })
  .then(Promise.all([
    startHttpServer(),
    spawnUpdateChecker()
  ]));
