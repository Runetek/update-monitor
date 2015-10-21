const RSUpdateChecker = require('./RSUpdateChecker');

const REVISION = +process.argv[2];

function versionFinder(updateChecker, revision) {
  updateChecker.checkRevision(revision)
    .then((upToDate) => {
      if (upToDate) {
        console.log(revision + ' is the current revision!');
        process.exit();
      } else {
        console.log('uh-oh, ' + revision + ' was no good. proceeding to check next revision.');
        versionFinder(updateChecker, revision + 1);
      }
    });
}

versionFinder(new RSUpdateChecker(), REVISION);
