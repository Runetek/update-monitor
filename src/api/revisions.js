import {
  REDIS_PUBSUB_REVISION_UPDATES_CHANNEL,
  REDIS_KEY_CURRENT_REVISION
} from '../util/constants';
import * as _ from 'lodash';

import * as RedisUtil from '../util/redis';

// const debug = require('debug')('revisions:info');

const redis = RedisUtil.createClient();

class RevisionAPI {

  static subscribe(handler) {
    let client = RedisUtil.createClient();

    return new Promise((resolve, reject) => {
      client.on('subscribe', (channel, count) => {
        console.log('subbed to:', channel);
      });

      client.on('message', (channel, message) => {
        handler(JSON.parse(message));
      });

       client.subscribeAsync(REDIS_PUBSUB_REVISION_UPDATES_CHANNEL)
        .then(() => console.log('sub complete'))
        .then(() => resolve());
    }).catch((err) => {
      if ( ! _.contains('Redis connection', err.message)) {
        throw err;
      }
    });
  }

  static publishMessage(data) {
    let payload = JSON.stringify(data);
    return redis.publishAsync(REDIS_PUBSUB_REVISION_UPDATES_CHANNEL, payload);
  }

  static matches(revisionInfo, revision) {
    return revision === revisionInfo.revision;
  }

  static getRevision() {
    return redis
      .getAsync(REDIS_KEY_CURRENT_REVISION)
      .then((payload) => JSON.parse(payload));
  }

  static setRevision(revision) {
    let startTime = Date.now();

    return RevisionAPI
      .getRevision()
      .then((old) => {
        let checked_at = startTime;
        let discovered_at = startTime;

        if (old && RevisionAPI.matches(old, revision)) {
          discovered_at = old.discovered_at;
        }

        let revisionInfo = { revision, discovered_at, checked_at };
        return redis
          .setAsync(REDIS_KEY_CURRENT_REVISION, JSON.stringify(revisionInfo))
          .then(RevisionAPI.publishMessage(revisionInfo));
      });
  }

  static touchRevision() {
    return RevisionAPI
      .getRevision()
      .then((revisionInfo) => {
        revisionInfo.checked_at = Date.now();
        redis.setAsync(REDIS_KEY_CURRENT_REVISION, JSON.stringify(revisionInfo));
      });
  }
}

export default { RevisionAPI };
