import * as Redis from 'redis';
import * as bluebird from 'bluebird';

import { REDIS_KEY_PREFIX } from './constants';

bluebird.promisifyAll(Redis.RedisClient.prototype);

export function waitForRedis(tries) {
  return new Promise((resolve, reject) => {
    let tries = 100;

    function attemptConnection() {
      return Promise.resolve(createClient())
        .then((redis) => redis.getAsync('random-key'));
    }

    let interval = setInterval(() => {
      if (tries <= 0) {
        clearInterval(interval);
        return reject('Unable to connect to redis after ~30s');
      }

      attemptConnection()
        .then(() => {
          clearInterval(interval);
          resolve();
        })
        .catch((err) => {
          console.log('could not connect to redis...', tries, 'remain.');
          tries--;
        });
    }, 300);
  });
}

export function createClient() {
  return Redis.createClient();
}

export function clearAppKeys(redis) {
  return new Promise((resolve, reject) => {
    return redis.keysAsync(REDIS_KEY_PREFIX + '*')
      .then((keys) => keys.map(key => redis.delAsync(key)))
      .then(bluebird.all)

      // .then((keys) => {
      //   let promises = keys.map(key => redis.delAsync(key));
      //   console.log('keys', keys);
      //   console.log(promises);
      //   return bluebird.all(promises);
      // });
  });
}
