/**
 *
 * Index module
 *
 */

import * as plutonio from './main';
export default plutonio;

const base_path = `./adiacenti/builder`;
const scanned = plutonio.scan(`${base_path}/tsconfig.json`);
// const imports = scanned[`${base_path}/src/index.ts`]?.imports;
// const type = scanned[`${base_path}/src/index.ts`]?.interfaces?.['Something'];

console.log(JSON.stringify(scanned, null, 2));
// console.log(JSON.stringify(imports, null, 2));
// console.log(JSON.stringify(type, null, 2));
