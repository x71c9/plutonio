/**
 *
 * Resolve module
 *
 */

import ts from 'typescript';
import path from 'path';

import * as log from '../log/index';
import * as c from '../config/index';

export const atom_heritage_clause = 'plutonio.atom';

export type GenerateOptions = {
  tsconfig_path?: string;
};

export type AtomSchemaAttributeType = keyof typeof c.primitive_types;

export type AtomSchemaAttribute = {
  type: AtomSchemaAttributeType;
  optional?: boolean;
  unique?: boolean;
  array?: boolean;
};

export type AtomSchema = {
  [k: string]: AtomSchemaAttribute;
};

export type AtomSchemas = {
  [k: string]: AtomSchema;
};

export function read(options?: GenerateOptions) {
  log.trace('Resolving...');
  const {program, checker} = _create_ts_program(options);
  console.log(program, checker);
}

function _create_ts_program(options?: GenerateOptions) {
  log.trace('Creating Typescript program...');
  let tsconfig_path = _get_default_tsconfig_path();
  if (
    typeof options?.tsconfig_path === 'string' &&
    options?.tsconfig_path !== ''
  ) {
    tsconfig_path = options.tsconfig_path;
  }
  const config_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile);
  const config_object = config_file.config;
  const parse_result = ts.parseJsonConfigFileContent(
    config_object,
    ts.sys,
    path.dirname(tsconfig_path)
  );
  const compilerOptions = parse_result.options;
  const rootNames = parse_result.fileNames;
  const create_program_options = {
    rootNames: rootNames,
    options: compilerOptions,
  };
  const program = ts.createProgram(create_program_options);
  const checker = program.getTypeChecker();
  return {program, checker};
}

function _get_default_tsconfig_path() {
  return './tsconfig.json';
}
