import * as koa from 'koa';
import * as Router from 'koa-route';

import { RevisionAPI } from '../api/revisions';

const PORT = process.env.PORT || 8080;

let app = koa.default();

app.use(require('koa-response-time')());

let revisions = {
  current: function *() {
      yield RevisionAPI
        .getRevision()
        .then((revisionInfo) => {
          this.body = revisionInfo;
        });
  }
};

app.use(Router.get('/revisions/current', revisions.current));

app.use(Router.post('/report', function *() {
  this.body = {};
}));

app.use(Router.get('/', function *() {
  this.redirect('/revisions/current');
}));

export function startHttpServer() {
  return new Promise((resolve) => {
    app.listen(PORT);
    console.log(`now ready for requests! http://localhost:${PORT}`);
    resolve();
  });
};
