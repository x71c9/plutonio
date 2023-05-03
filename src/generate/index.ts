/**
 *
 * Generate module
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

export type AtomSchemaAttributeType = 'string' | 'number' | 'boolean';

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
  log.trace('Generating...');
  const {program, checker} = _create_ts_program(options);
  const plutonio_source_files_map = _select_plutonio_source_files(program);
  const atom_schemas = _generate_atom_schemas(
    checker,
    plutonio_source_files_map
  );
  return atom_schemas;
}

function _generate_atom_schemas(
  checker: ts.TypeChecker,
  source_file_map: Map<ts.SourceFile, string>
): AtomSchemas {
  log.trace(`Generating atom schemas from plutonio source files...`);
  const interfaces_map = _select_inherited_atom_interfaces(source_file_map);
  const atom_schemas = _generate_atom_schemas_from_interface_nodes(
    checker,
    interfaces_map
  );
  return atom_schemas;
}

function _generate_atom_schemas_from_interface_nodes(
  checker: ts.TypeChecker,
  interfaces_map: Map<ts.InterfaceDeclaration, string>
): AtomSchemas {
  const atom_schemas: AtomSchemas = {};
  for (const [interf, plutonio_name] of interfaces_map) {
    const {atom_name, atom_schema} = _generate_atom_schema(
      checker,
      interf,
      plutonio_name
    );
    atom_schemas[atom_name] = atom_schema;
  }
  return atom_schemas;
}

function _select_inherited_atom_interfaces(
  source_file_map: Map<ts.SourceFile, string>
): Map<ts.InterfaceDeclaration, string> {
  log.trace(`Selecting inherited atom interfaces...`);
  const interfaces_map = new Map<ts.InterfaceDeclaration, string>();
  for (const [source_file, plutonio_name] of source_file_map) {
    log.trace(source_file.fileName);
    ts.forEachChild(source_file, _visit_node);
    function _visit_node(node: ts.Node) {
      if (_is_inherited_atom_interface_node(node)) {
        log.debug(`Added node: ${node.name.getText()}`);
        interfaces_map.set(node, plutonio_name);
      }
      ts.forEachChild(node, _visit_node);
    }
  }
  return interfaces_map;
}

function _select_plutonio_source_files(
  program: ts.Program
): Map<ts.SourceFile, string> {
  log.trace('Selecting SourceFile with imported Plutonio...');
  const plutonio_source_files_map: Map<ts.SourceFile, string> = new Map();
  for (const source_file of program.getSourceFiles()) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    log.trace(source_file.fileName);
    ts.forEachChild(source_file, _visit_node);
  }
  function _visit_node(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const module_specifier = node.moduleSpecifier
        .getText()
        .replaceAll("'", '')
        .replaceAll('"', '');
      if (module_specifier === c.plutonio_package_name) {
        const source_file = node.getSourceFile();
        const import_clause = node.importClause?.getText();
        if (typeof import_clause === 'string' && import_clause !== '') {
          const splitted_import = import_clause.split(' ');
          const plutonio_name = splitted_import[splitted_import.length - 1];
          plutonio_source_files_map.set(source_file, plutonio_name);
        }
      }
    }
    ts.forEachChild(node, _visit_node);
  }
  return plutonio_source_files_map;
}

function _generate_atom_schema(
  checker: ts.TypeChecker,
  interf: ts.InterfaceDeclaration,
  plutonio_name: string
) {
  const name = interf.name.getText();
  const atom_name = _transform_atom_name(name);

  /**
   * Type is needed so that it gets also
   * all the inherited properties
   */
  const type = checker.getTypeAtLocation(interf);
  const properties = type.getProperties();

  const atom_schema: AtomSchema = {};
  for (const property of properties) {
    const attribute_name = property.getName();
    if (c.inherited_atom_properties.includes(attribute_name)) {
      continue;
    }
    atom_schema[attribute_name] = _generate_atom_schema_attribute(
      checker,
      interf,
      property,
      plutonio_name
    );
  }
  return {atom_name, atom_schema};
}

function _generate_atom_schema_attribute(
  checker: ts.TypeChecker,
  interf: ts.InterfaceDeclaration,
  property: ts.Symbol,
  plutonio_name: string
): AtomSchemaAttribute {
  const property_type = checker.getTypeOfSymbolAtLocation(property, interf);
  const mapped_type = _map_type(checker, property_type);
  const atom_schema_attribute: AtomSchemaAttribute = {
    type: mapped_type,
  };
  if (_has_undefined(property_type)) {
    atom_schema_attribute.optional = true;
  }
  if (_atom_schema_attribute_is_unique(checker, property, plutonio_name)) {
    atom_schema_attribute.unique = true;
  }
  return atom_schema_attribute;
}

function _map_type(
  checker: ts.TypeChecker,
  type: ts.Type
): AtomSchemaAttributeType {
  const type_string = checker.typeToString(type);
  const removed_undefined = type_string.replaceAll(' | undefined', '');
  switch (removed_undefined) {
    case 'string': {
      return 'string';
    }
    case 'number': {
      return 'number';
    }
    case 'boolean': {
      return 'boolean';
    }
  }
  if (type.isStringLiteral()) {
    // attribute: "OK"
    return 'string';
  } else if (type.isNumberLiteral()) {
    // attribute: 11
    return 'number';
  } else if (type.isUnion()) {
    const types = type.types.map((t) => _map_type(checker, t));
    if (types.every((t) => c.primitive_types.includes(t))) {
      return types.includes('string') ? 'string' : 'number';
    }
    // } else if (c.primitive_types.includes(type.flags.toString())) {
    //   return type.flags.toString();
  }
  throw new Error(`Invalid Plutonio attribute type '${removed_undefined}'`);
}

function _has_undefined(type: ts.Type): boolean {
  if (type.isUnion() && type.types.some(_has_undefined)) {
    return true;
  } else if ((type as any).intrinsicName === 'undefined') {
    // TODO Better implementation
    return true;
  }
  return false;
}

function _atom_schema_attribute_is_unique(
  _checker: ts.TypeChecker,
  prop: ts.Symbol,
  plutonio_name: string
): boolean {
  const declaration_text = prop.valueDeclaration?.getText();
  if (declaration_text?.includes(`${plutonio_name}.${c.unique_type_name}`)) {
    return true;
  }
  return false;
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
