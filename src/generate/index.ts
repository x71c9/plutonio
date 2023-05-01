/**
 *
 * Generate module
 *
 */

import ts from 'typescript';
import path from 'path';

import * as log from '../log/index';

export const atom_heritage_clause = 'plutonio.atom';

export type GenerateOptions = {
  tsconfig_path?: string;
};
export type AtomSchemaAttributeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object';
export type AtomSchemaAttribute = {
  type: AtomSchemaAttributeType;
  optional?: boolean;
  unique?: boolean;
};
export type AtomSchema = {
  [k: string]: AtomSchemaAttribute;
};
export type AtomSchemas = {
  [k: string]: AtomSchema;
};

export function generate(options?: GenerateOptions) {
  const {program, checker} = _create_ts_program(options);
  const nodes = _get_all_inherited_atom_interface_nodes(program);
  const atom_schemas = _generate_atom_schemas(nodes, checker);
  return atom_schemas;
}

function _get_all_inherited_atom_interface_nodes(
  program: ts.Program
): ts.InterfaceDeclaration[] {
  const interfaces = new Set<ts.InterfaceDeclaration>();
  for (const source_file of program.getSourceFiles()) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    log.trace(source_file.fileName);
    ts.forEachChild(source_file, _visit_node);
  }
  function _visit_node(node: ts.Node) {
    if (_is_inherited_atom_interface_node(node)) {
      log.debug(`Added node: ${node.name.getText()}`);
      interfaces.add(node);
    }
    ts.forEachChild(node, _visit_node);
  }
  return Array.from(interfaces);
}

function _generate_atom_schemas(
  nodes: ts.InterfaceDeclaration[],
  checker: ts.TypeChecker
): AtomSchemas {
  const atom_schemas: AtomSchemas = {};
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const {atom_name, atom_schema} = _generate_atom_schema(node, checker);
    atom_schemas[atom_name] = atom_schema;
  }
  return atom_schemas;
}

function _generate_atom_schema(
  node: ts.InterfaceDeclaration,
  checker: ts.TypeChecker
) {
  const node_type = checker.getTypeAtLocation(node.name);
  // console.log(node_type.getBaseTypes()?.[0]?.aliasSymbol);
  const symbol = node_type.getSymbol();
  if (!symbol) {
    throw new Error('cannot find symbol');
  }
  const name = symbol.getName();
  const atom_name = _transform_atom_name(name);

  // const members_text = node.members.map(m => m.getText());

  const properties = node_type.getProperties();
  const atom_schema: AtomSchema = {};

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    const property_type = checker.getTypeOfSymbolAtLocation(prop, node);
    const symbol_string = checker.symbolToString(prop);
    // TODO better check real attribute
    if (symbol_string === '_id') {
      continue;
    }
    atom_schema[symbol_string] = _generate_atom_schema_attribute(
      property_type,
      checker
    );
  }
  return {atom_name, atom_schema};
}

function _generate_atom_schema_attribute(
  property_type: ts.Type,
  checker: ts.TypeChecker
): AtomSchemaAttribute {
  const property_type_string = checker.typeToString(
    property_type,
    undefined,
    ts.TypeFormatFlags.InTypeAlias
  );
  const atom_schema_attribute: AtomSchemaAttribute = {
    type: _get_atom_schema_attribute_type(property_type_string),
  };
  if (_atom_schema_attribute_is_optional(property_type_string)) {
    atom_schema_attribute.optional = true;
  }
  if (_atom_schema_attribute_is_unique(property_type_string)) {
    atom_schema_attribute.unique = true;
  }
  return atom_schema_attribute;
}

function _atom_schema_attribute_is_unique(_p: any): boolean {
  // TODO implement with real type
  return false;
}

function _atom_schema_attribute_is_optional(
  property_type_string: string
): boolean {
  if (property_type_string.includes('undefined')) {
    return true;
  }
  return false;
}

function _get_atom_schema_attribute_type(
  property_type_string: string
): AtomSchemaAttributeType {
  // TODO: Better implementation
  // What about:
  // 0 | 1 | 2
  // 'a' | 'b'
  // true
  // other types?
  if (property_type_string.includes('string')) {
    return 'string';
  }
  if (property_type_string.includes('number')) {
    return 'number';
  }
  if (property_type_string.includes('boolean')) {
    return 'boolean';
  }
  if (property_type_string.includes('{')) {
    return 'object';
  }
  throw new Error(`Invalid property type: ${property_type_string}`);
}

function _transform_atom_name(name: string): string {
  return name.toLowerCase();
}

function _is_inherited_atom_interface_node(
  node: ts.Node
): node is ts.InterfaceDeclaration {
  if (!ts.isInterfaceDeclaration(node)) {
    return false;
  }
  const heritage_clause = node.heritageClauses?.[0];
  if (!heritage_clause) {
    return false;
  }
  const heritage_children = heritage_clause.getChildren();
  const heritage_first_child = heritage_children?.[0];
  if (!heritage_first_child) {
    return false;
  }
  const heritage_text = heritage_clause.getText();
  if (heritage_text.includes(atom_heritage_clause)) {
    return true;
  }
  return false;
}

function _create_ts_program(options?: GenerateOptions) {
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
