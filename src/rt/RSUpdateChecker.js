import * as _ from 'lodash';
import { Socket } from 'net';
import * as struct from 'bufferpack';

import { Config } from '../util/config';

const OP_OUTDATED = 6;

function createConnection(options) {
  return new Promise((resolve, reject) => {
    let sock = new Socket({ readable: true, writable: true });
    sock.connect(options, () => {
      // triggers chained `then` method to be called.
      resolve(sock);
    });
    
    // if the socket does not connect within 5 seconds, we reject this Promise
    // which triggers the chained `catch` method.
    setTimeout(() => reject(new Error('Connection to OSRS server timed out!')), 5000);
  });
}

class RSUpdateChecker {
  constructor(options = {}) {
    if ( ! options || _.isEmpty(options)) {
      options = {
        host: Config.get('osrs.host'),
        port: Config.get('osrs.port'),
      };
    }

    this.options = options;
  }

  checkRevision(revision) {
    return new Promise((resolve, reject) => {
      createConnection(this.options)
        .then((sock) => {
          // first we bind a listener to all incoming data
          sock.on('data', (buff) => {
            let versionPacket = buff.readInt8(0);
            resolve(versionPacket !== OP_OUTDATED)
            sock.destroy();
          });

          // then we send our data
          sock.write(struct.pack('>bi', [15, revision]));
        });
    });
  }
}

export default { RSUpdateChecker };
