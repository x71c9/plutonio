/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import ts from 'typescript';
import * as tjs from 'typescript-json-schema';
import * as types from '../types/index.js';
import * as utils from '../utils/index.js';

type GenerateOptions = {
  tsconfig_path: string;
};

export function generate(
  options?: Partial<GenerateOptions>
): types.ProjectSchema {
  const program = _create_ts_program(options);
  const project_schema = _generate_project_schema(program);
  return project_schema;
}

function _generate_project_schema(program: ts.Program): types.ProjectSchema {
  const project_schema: types.ProjectSchema = {};
  const source_files = program.getSourceFiles();
  for (const source_file of source_files) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    project_schema[source_file.fileName] = _resolve_file_schema(
      program,
      source_file
    );
  }
  return project_schema;
}

function _resolve_file_schema(
  program: ts.Program,
  source_file: ts.SourceFile
): types.FileSchema {
  const file_schema: types.FileSchema = {
    imports: _resolve_imports(source_file),
    interfaces: _resolve_interfaces(program, source_file),
    types: _resolve_types(program, source_file),
  };
  return utils.no_undefined(file_schema);
}

function _resolve_imports(
  source_file: ts.SourceFile
): types.Import[] | undefined {
  const imports: types.Import[] = [];
  const import_declarations: ts.ImportDeclaration[] = _get_nested_of_type(
    source_file,
    ts.SyntaxKind.ImportDeclaration
  );
  for (const import_declaration of import_declarations) {
    const import_parts = _generate_import_schema(import_declaration);
    imports.push(import_parts);
  }
  if (imports.length === 0) {
    return undefined;
  }
  return imports;
}

function _generate_import_schema(
  import_node: ts.ImportDeclaration
): types.Import {
  const text = import_node.getText();
  const module = import_node.moduleSpecifier
    .getText()
    .replaceAll("'", '')
    .replaceAll('"', '');
  // import * as plutonio from 'plutonio'
  const namespace_imports = _get_nested_of_type(
    import_node,
    ts.SyntaxKind.NamespaceImport
  ) as ts.NamespaceImport[];
  if (namespace_imports.length > 0 && namespace_imports[0]) {
    const namespace_import = namespace_imports[0];
    const identifiers = _get_nested_of_type(
      namespace_import,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier[];
    const identifier = identifiers[0];
    if (!identifier) {
      throw new Error(`Missing identifier in namespace import`);
    }
    const clause = identifier.getText();
    return {
      text,
      module,
      clause,
      specifiers: [],
    };
  }
  // import {atom} from 'plutonio'
  const import_specifiers = _get_nested_of_type(
    import_node,
    ts.SyntaxKind.ImportSpecifier
  ) as ts.ImportSpecifier[];
  if (import_specifiers.length > 0) {
    const specifiers = import_specifiers.map((is) => is.getText());
    return {
      text,
      module,
      clause: '',
      specifiers,
    };
  }
  // import plutonio from 'plutonio'
  const import_clauses = _get_nested_of_type(
    import_node,
    ts.SyntaxKind.ImportClause
  ) as ts.ImportClause[];
  const import_clause = import_clauses[0];
  if (!import_clause) {
    throw new Error(`Missing import clause`);
  }
  const clause = import_clause.getText();
  return {
    text,
    module,
    clause,
    specifiers: [],
  };
}

function _resolve_interfaces(
  program: ts.Program,
  source_file: ts.SourceFile
): types.Interfaces | undefined {
  const interfaces: types.Interfaces = {};
  const interface_nodes = _get_nested_of_type<ts.InterfaceDeclaration>(
    source_file,
    ts.SyntaxKind.InterfaceDeclaration
  );
  if (interface_nodes.length === 0) {
    return undefined;
  }
  for (const interface_node of interface_nodes) {
    const name = interface_node.name.getText();
    interfaces[name] = _generate_interface_schema(
      program,
      name,
      interface_node
    );
  }
  return interfaces;
}

function _generate_interface_schema(
  program: ts.Program,
  name: string,
  interface_node: ts.InterfaceDeclaration
): types.Interface {
  const full_text = interface_node.getFullText();
  const tjs_schema = _tjs_schema(program, name);
  if (!tjs_schema) {
    throw new Error(`Cannot generate schema for interface '${name}'`);
  }
  let properties = _resolve_properties(tjs_schema);
  if (properties) {
    properties = _update_properties(properties, interface_node);
  }
  const interface_schema = {
    extends: _resolve_extends(interface_node),
    full_text,
    properties,
    type: _resolve_type(tjs_schema, name),
  };
  return utils.no_undefined(interface_schema);
}

function _generate_type_schema(
  program: ts.Program,
  name: string,
  type_node: ts.TypeAliasDeclaration
): types.Type {
  const full_text = type_node.getFullText();
  const tjs_schema = _tjs_schema(program, name);
  if (!tjs_schema) {
    throw new Error(`Cannot generate schema for type '${name}'`);
  }
  let properties = _resolve_properties(tjs_schema);
  if (properties) {
    properties = _update_properties(properties, type_node);
  }
  const type_schema = {
    full_text,
    properties,
    type: _resolve_type(tjs_schema, name),
  };
  return utils.no_undefined(type_schema);
}

function _resolve_extends(interface_node: ts.InterfaceDeclaration): string[] {
  const heritage_clauses = _get_nested_of_type(
    interface_node,
    ts.SyntaxKind.HeritageClause
  ) as ts.HeritageClause[];
  let expressions: ts.ExpressionWithTypeArguments[] = [];
  for (const heritage_clause of heritage_clauses) {
    const expression_with_typed_arguments = _get_nested_of_type(
      heritage_clause,
      ts.SyntaxKind.ExpressionWithTypeArguments
    ) as ts.ExpressionWithTypeArguments[];
    expressions = expressions.concat(expression_with_typed_arguments);
  }
  return expressions.map((e) => e.getText());
}

function _update_properties(
  properties: types.Properties,
  node: ts.Node
): types.Properties {
  const property_signatures = _get_nested_of_type(
    node,
    ts.SyntaxKind.PropertySignature
  ) as ts.PropertySignature[];
  const prop_signature_map = new Map<string, ts.PropertySignature>();
  for (const prop_sign of property_signatures) {
    const identifiers = _get_nested_of_type(
      prop_sign,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier[];
    const identifier = identifiers[0];
    if (!identifier) {
      throw new Error('Missing identifier for property signature');
    }
    const prop_name = identifier.getText();
    prop_signature_map.set(prop_name, prop_sign);
  }
  for (const [prop_name, prop_def] of Object.entries(properties)) {
    const prop_signature = prop_signature_map.get(prop_name);
    if (!prop_signature) {
      continue;
    }
    const type_operators = _get_nested_of_type(
      prop_signature,
      ts.SyntaxKind.TypeOperator
    );
    if (type_operators.length > 0 && type_operators[0]) {
      const type_op = type_operators[0];
      // TODO: FIX
      (prop_def as any).original = type_op.getText();
      return properties;
    }
    const type_references = _get_nested_of_type(
      prop_signature,
      ts.SyntaxKind.TypeReference
    );
    if (type_references.length === 0 || !type_references[0]) {
      continue;
    }
    const type_ref = type_references[0];
    // TODO: FIX
    (prop_def as any).original = type_ref.getText();
  }
  return properties;
}

function _resolve_type(
  tjs_schema: tjs.Definition,
  name: string
): types.Primitive {
  const type = tjs_schema?.type;
  if (!type) {
    throw new Error(`Cannot resolve 'type' for '${name}'`);
  }
  switch (type) {
    case 'string': {
      return 'string';
    }
    case 'number': {
      return 'number';
    }
    case 'boolean': {
      return 'boolean';
    }
    case 'object': {
      return 'object';
    }
    case 'integer': {
      return 'number';
    }
    case 'null': {
      return 'null';
    }
    case 'array': {
      return 'array';
    }
  }
  return 'undefined';
}

function _resolve_properties(
  tjs_schema: tjs.Definition
): types.Properties | undefined {
  const tjs_properties = tjs_schema.properties;
  if (!tjs_properties) {
    return undefined;
  }
  const properties: types.Properties = {};
  for (const [key, value] of Object.entries(tjs_properties)) {
    if (typeof value === 'boolean') {
      continue;
    }
    const property: types.Property = {
      enum: _resolve_enum(value.enum),
      type: _resolve_type(value, key),
      properties: _resolve_properties(value),
    };
    properties[key] = utils.no_undefined(property);
  }
  if (Object.keys(properties).length === 0) {
    return undefined;
  }
  return properties;
}

function _resolve_enum(tjs_enum?: unknown[]): types.Primitive[] | undefined {
  if (!tjs_enum) {
    return undefined;
  }
  // TODO Check all possibilities
  return tjs_enum as types.Primitive[];
}

function _resolve_types(
  program: ts.Program,
  source_file: ts.SourceFile
): types.Types | undefined {
  const types: types.Types = {};
  const type_nodes = _get_nested_of_type<ts.TypeAliasDeclaration>(
    source_file,
    ts.SyntaxKind.TypeAliasDeclaration
  );
  if (type_nodes.length === 0) {
    return undefined;
  }
  for (const type_node of type_nodes) {
    const name = type_node.name.getText();
    types[name] = _generate_type_schema(program, name, type_node);
  }
  return types;
}

function _create_ts_program(options?: Partial<GenerateOptions>) {
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
  return program;
}

function _get_default_tsconfig_path() {
  return './tsconfig.json';
}

function _get_nested_of_type<T extends ts.Node>(
  node: ts.Node,
  kind: ts.SyntaxKind
): T[] {
  const children = node.getChildren();
  let nodes: T[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) {
      continue;
    }
    if (child.kind === kind) {
      // let any_child = child as any;
      // let name = any_child.name
      //   ? any_child.name.getText()
      //   : any_child.getText();
      nodes.push(child as T);
    }
    // Do not check types and interfaces inside namespaces.
    // typescript-json-schema won't work with them
    if (child.kind === ts.SyntaxKind.ModuleDeclaration) {
      continue;
    }
    const nested_nodes = _get_nested_of_type(child, kind);
    nodes = nodes.concat(nested_nodes as T[]);
  }
  return nodes;
}

function _tjs_schema(program: ts.Program, name: string) {
  const partial_args = {
    ref: false,
  };
  const tjs_schema = tjs.generateSchema(program, name, partial_args);
  delete tjs_schema?.$schema;
  return tjs_schema;
}
