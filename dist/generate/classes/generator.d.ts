/**
 *
 * Generator class module
 *
 * @packageDocumentation
 *
 */
import * as types from '../types.js';
import { Project } from './project.js';
export declare class Generator {
    projects: Map<string, Project>;
    constructor();
    get_project(tsconfig_path: string): Project;
    generate(params: types.GenerateParams): types.TypeSchema;
}
