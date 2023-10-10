/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as types from '../types/index.js';
type GenerateOptions = {
    tsconfig_path: string;
};
export declare function generate(options?: Partial<GenerateOptions>): types.ProjectSchema;
export declare function _generate_project_schema(program: ts.Program, tsconfig_path: string): types.ProjectSchema;
export declare function _create_ts_program(tsconfig_path: string): ts.Program;
export {};
