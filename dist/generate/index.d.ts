/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import * as types from '../types/index.js';
type GenerateOptions = {
    tsconfig_path: string;
};
export declare function generate(options?: Partial<GenerateOptions>): types.ProjectSchema;
export {};
