/**
 *
 * Index module
 *
 */
import * as plutonio from './main.js';
export default plutonio;
const schema = plutonio.generate({
    tsconfig_path: `/Users/x71c9/repos/plutonio/builder/tsconfig.json`,
    source_file_path: `/Users/x71c9/repos/plutonio/builder/src/index.ts`,
    type_name: `C`,
});
console.log(JSON.stringify(schema, null, 2));
//# sourceMappingURL=index.js.map