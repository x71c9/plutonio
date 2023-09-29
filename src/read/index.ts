/**
 *
 * Generate module
 *
 */

import ts from 'typescript';
import path from 'path';
import * as tjs from 'typescript-json-schema';
import * as log from '../log/index';

type ReadOption = {
  tsconfig_path?: string;
};

export function read(options?: ReadOption) {
  log.trace('Reading...');
  const {program} = _create_ts_program(options);
  const schemas = _read_all_files(program);
  console.log(schemas);
  return schemas;
}

type Schema = {
  [k: string]: any;
};

type Schemas = {
  [k: string]: Schema;
};

function _read_all_files(program: ts.Program) {
  const schemas_by_file: Map<string, Schemas> = new Map<string, Schemas>();
  for (const source_file of program.getSourceFiles()) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    log.debug(`Reading ${source_file.fileName}...`);
    const schemas = _resolve_schema_for(program, source_file);
    schemas_by_file.set(source_file.fileName, schemas);
  }
  return schemas_by_file;
}

function _resolve_schema_for(
  program: ts.Program,
  source_file: ts.SourceFile
): Schemas {
  const schemas: Schemas = {};
  const types = _get_types(source_file);
  const interfaces = _get_interfaces(source_file);
  for (const t of types) {
    const name = t.name.getText();
    console.log(`Generating schema for type ${name}...`);
    const type_schema = _generate_schema(program, name, 'type');
    schemas[name] = type_schema;
  }
  for (const i of interfaces) {
    const name = i.name.getText();
    console.log(`Generating schema for interface ${name}...`);
    const interface_schema = _generate_schema(program, name, 'interface');
    schemas[name] = interface_schema;
  }
  return schemas;
}

function _generate_schema(
  program: ts.Program,
  name: string,
  category: 'type' | 'interface'
): Schema {
  const partial_args = {
    ref: false,
  };
  const tjs_schema = tjs.generateSchema(program, name, partial_args);
  delete tjs_schema?.$schema;

  const schema: Schema = {
    category,
    ...tjs_schema,
  };
  return schema;
}

function _get_types(source_file: ts.Node) {
  return _get_syntax_kind(
    source_file,
    ts.SyntaxKind.TypeAliasDeclaration
  ) as ts.TypeAliasDeclaration[];
}

function _get_interfaces(source_file: ts.Node) {
  return _get_syntax_kind(
    source_file,
    ts.SyntaxKind.InterfaceDeclaration
  ) as ts.InterfaceDeclaration[];
}

function _get_syntax_kind(node: ts.Node, kind: ts.SyntaxKind) {
  const children = node.getChildren();
  let nodes: ts.Node[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.kind === kind) {
      log.trace(
        `Found ${ts.SyntaxKind[kind]}: ${(child as any).name.getText()}`
      );
      nodes.push(child);
    }
    // Do not check types and interfaces inside namespaces.
    // typescript-json-schema won't work with them
    if (child.kind === ts.SyntaxKind.ModuleDeclaration) {
      continue;
    }
    const nested_nodes = _get_syntax_kind(child, kind);
    nodes = nodes.concat(nested_nodes);
  }
  return nodes;
}

function _create_ts_program(options?: ReadOption) {
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
