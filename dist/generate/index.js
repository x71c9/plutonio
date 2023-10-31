/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import { ion } from '../log/index.js';
import { Generator } from './classes/generator.js';
export function generate(params) {
    ion.trace(`Generating...`);
    const generator = new Generator();
    return generator.generate(params);
}
//# sourceMappingURL=index.js.map