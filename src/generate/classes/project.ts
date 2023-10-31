/**
 *
 * Project class module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import ts from 'typescript';
import {ion} from '../../log/index.js';
import {SourceFile} from './source_file.js';

export class Project {
  public source_files = new Map<string, SourceFile>();
  public program: ts.Program;
  constructor(public tsconfig_path: string) {
    ion.trace(`Creating Project ${tsconfig_path} ...`);
    const config_file = ts.readConfigFile(this.tsconfig_path, ts.sys.readFile);
    const config_object = config_file.config;
    const parse_result = ts.parseJsonConfigFileContent(
      config_object,
      ts.sys,
      path.dirname(this.tsconfig_path)
    );
    const compilerOptions = parse_result.options;
    const rootNames = parse_result.fileNames;
    const create_program_options = {
      rootNames: rootNames,
      options: compilerOptions,
    };
    this.program = ts.createProgram(create_program_options);
    // .getTypeChcker needs to be called otherwise
    // when searching nested nodes, the nodes have no
    // SourceFile attached to and the system fails
    this.program.getTypeChecker();
  }
  public get_source_file(source_file_path: string): SourceFile {
    ion.trace(`Getting a SourceFile...`);
    if (this.source_files.has(source_file_path)) {
      return this.source_files.get(source_file_path) as SourceFile;
    }
    const source_file = new SourceFile(source_file_path, this);
    this.source_files.set(source_file_path, source_file);
    return source_file;
  }
}
