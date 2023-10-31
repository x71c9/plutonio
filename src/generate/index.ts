/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */

import {ion} from '../log/index.js';
import * as types from './types.js';
import {Generator} from './classes/generator.js';

export function generate(params: types.GenerateParams): types.TypeSchema {
  ion.trace(`Generating...`);
  const generator = new Generator();
  return generator.generate(params);
}
