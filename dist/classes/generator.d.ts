/**
 *
 * Generator class module
 *
 * @packageDocumentation
 *
 */
import { Project } from './project.js';
import { GenerateParams } from '../generate/index.js';
export declare class Generator {
    projects: Map<string, Project>;
    constructor();
    get_project(tsconfig_path: string): Project;
    generate(params: GenerateParams): any;
}
