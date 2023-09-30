/**
 *
 * Index module
 *
 */
import * as plutonio from './main.js';
export default plutonio;
const options = {
    tsconfig_path: '/home/x71c9/repos/plutonio/builder/tsconfig.json'
};
const project_schema = plutonio.generate(options);
console.log(project_schema);
// plutonio.read();
//# sourceMappingURL=index.js.map