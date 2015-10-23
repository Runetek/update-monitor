import * as bluebird from 'bluebird';

import { Config } from '../util/config';
import * as RedisUtil from '../util/redis';
import { RevisionAPI } from '../api/revisions';
import { RSUpdateChecker } from '../rt/RSUpdateChecker';

let redis = RedisUtil.createClient();

const INITIAL_REVISION = +process.argv[2];

function versionFinder(updateChecker, revisionToCheck) {
  return new Promise((resolve, reject) => {
    updateChecker
      .checkRevision(revisionToCheck)
      .then((upToDate) => {
        if (upToDate) {
          console.log(revisionToCheck + ' is the current revision!');
          return RevisionAPI
            .setRevision(revisionToCheck)
            .then(spawnBackgroundUpdater(updateChecker, revisionToCheck));
        } else {
          let revisionDiff = (revisionToCheck - INITIAL_REVISION);

          if (revisionDiff >= 200) {
            console.log('Wow, over 200 revisions checked and still no revision match found... exiting.');
            process.exit();
          }

          console.log('uh-oh, ' + revisionToCheck + ' was no good. proceeding to check next revision.');
          versionFinder(updateChecker, revisionToCheck + 1);
        }
      });
  });
}

function spawnBackgroundUpdater(updateChecker, currentRevision) {
  const WORKER_SLEEP = Config.get('checker.sleep', 5000);

  return new Promise((resolve) => {
    let cycle = () => {
      return updateChecker.checkRevision(currentRevision + 1)
        .then((upToDate) => {
          if (upToDate) {
            currentRevision = currentRevision + 1;
            console.log('new revision:', currentRevision);
          } else {
            return RevisionAPI.touchRevision();
          }
        });
    }

    let loop = () => {
      let cycleStart = Date.now();
      cycle()
        .then(() => {
          let cycleEnd = Date.now();
          let cycleDuration = cycleEnd - cycleStart;
          let sleepTime = WORKER_SLEEP - cycleDuration;

          console.log('[worker]:', 'cycle took', cycleDuration + 'ms | sleeping for', sleepTime + 'ms');

          setTimeout(loop, sleepTime);
        });
    }
    loop();
    resolve('Background revision checker spawned!');
  });
}

export function work() {
  return RevisionAPI
    .subscribe((message) => {
      console.log('[PUBSUB]:', JSON.stringify(message, null, 2));
    })
    .then(RevisionAPI.getRevision)
    .then(versionFinder(new RSUpdateChecker, INITIAL_REVISION));
}

work();
