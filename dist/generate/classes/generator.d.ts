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
    private get_project;
    generate(params: types.GenerateParams): types.TypeSchema;
}
