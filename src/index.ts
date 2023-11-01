/**
 *
 * Index module
 *
 */

import * as plutonio from './main.js';
export default plutonio;

plutonio.scanner();

// const schema = plutonio.generate({
//   tsconfig_path: `/Users/x71c9/repos/plutonio/builder/tsconfig.json`,
//   source_file_path: `/Users/x71c9/repos/plutonio/builder/src/second.ts`,
//   type_name: `BB`,
// });
// console.log(JSON.stringify(schema, null, 2));
