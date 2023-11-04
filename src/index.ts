/**
 *
 * Index module
 *
 */

import * as plutonio from './main.js';
export default plutonio;

const scanned = plutonio.scanner();
console.log(JSON.stringify(scanned, null, 2));
