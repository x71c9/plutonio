/**
 *
 * Index module
 *
 */

import * as plutonio from './main.js';
export default plutonio;

const options = {
  tsconfig_path: '/Users/x71c9/repos/plutonio/builder/tsconfig.json',
};

const project_schema = plutonio.generate(options);
console.log(JSON.stringify(project_schema, null, 2));
