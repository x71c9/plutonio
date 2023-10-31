/**
 *
 * Generator class module
 *
 * @packageDocumentation
 *
 */

import {ion} from '../../log/index.js';
import * as types from '../types.js';
import {Project} from './project.js';

export class Generator {
  public projects = new Map<string, Project>();
  constructor() {
    ion.trace(`Creating a Generator...`);
  }
  private get_project(tsconfig_path: string) {
    ion.trace(`Getting a Project...`);
    if (this.projects.has(tsconfig_path)) {
      return this.projects.get(tsconfig_path) as Project;
    }
    const project = new Project(tsconfig_path);
    this.projects.set(tsconfig_path, project);
    return project;
  }
  public generate(params: types.GenerateParams) {
    const project = this.get_project(params.tsconfig_path);
    const source_file = project.get_source_file(params.source_file_path);
    const type = source_file.get_type(params.type_name);
    const schema = type.generate_schema();
    return schema;
  }
}
