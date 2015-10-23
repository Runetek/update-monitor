import * as fs from 'fs';
import * as _ from 'lodash';

const CONFIG_DIR = './config/';

class ConfigLoader {
  constructor(path = 'sample.json') {
    this.path = path;
    this.config = this.loadFile();
  }

  all() {
    return this.config;
  }

  get(jsonPath, _default = null) {
    return _.get(this.config, jsonPath) || _default;
  }

  loadFile() {
    return JSON.parse(fs.readFileSync(CONFIG_DIR + this.path), 'utf-8');
  }
}

export default {
  Config: new ConfigLoader
};
