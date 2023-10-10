/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import ts from 'typescript';
import {ion} from '../log/index.js';
import * as tjsg from 'ts-json-schema-generator';
import * as types from '../types/index.js';
import * as utils from '../utils/index.js';

type GenerateOptions = {
  tsconfig_path: string;
};

export function generate(
  options?: Partial<GenerateOptions>
): types.ProjectSchema {
  const tsconfig_path = _resolve_tsconfig_path(options?.tsconfig_path);
  const program = _create_ts_program(tsconfig_path);
  const project_schema = _generate_project_schema(program, tsconfig_path);
  return project_schema;
}

function _generate_project_schema(
  program: ts.Program,
  tsconfig_path: string
): types.ProjectSchema {
  const project_schema: types.ProjectSchema = {};
  const source_files = program.getSourceFiles();
  for (const source_file of source_files) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    const file_name = source_file.fileName;
    ion.trace(`Parsing: ${file_name}`);
    project_schema[source_file.fileName] = _resolve_file_schema(
      tsconfig_path,
      source_file
    );
  }
  return project_schema;
}

function _resolve_file_schema(
  tsconfig_path: string,
  source_file: ts.SourceFile
): types.FileSchema {
  const file_schema: types.FileSchema = {
    imports: _resolve_imports(source_file),
    interfaces: _resolve_interfaces(tsconfig_path, source_file),
    types: _resolve_types(tsconfig_path, source_file),
  };
  return utils.no_undefined(file_schema);
}

function _resolve_imports(
  source_file: ts.SourceFile
): types.Import[] | undefined {
  ion.trace(`Resolving imports...`);
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
  tsconfig_path: string,
  source_file: ts.SourceFile
): types.Interfaces | undefined {
  ion.trace(`Resolving interfaces...`);
  const interfaces: types.Interfaces = {};
  const interface_nodes = _get_nested_of_type<ts.InterfaceDeclaration>(
    source_file,
    ts.SyntaxKind.InterfaceDeclaration
  );
  if (interface_nodes.length === 0) {
    return undefined;
  }
  const file_path = source_file.fileName;
  for (const interface_node of interface_nodes) {
    const name = interface_node.name.getText();
    ion.trace(`Resolving interface for '${name}'...`);
    const generated_schema = _generate_interface_schema(
      tsconfig_path,
      file_path,
      name,
      interface_node
    );
    if (generated_schema) {
      interfaces[name] = generated_schema;
    }
  }
  return interfaces;
}

function _generate_interface_schema(
  tsconfig_path: string,
  file_path: string,
  name: string,
  interface_node: ts.InterfaceDeclaration
): types.Interface | undefined {
  const full_text = interface_node.getFullText();
  const tjsg_schema = _tjsg_schema(tsconfig_path, file_path, name);
  if (!tjsg_schema) {
    throw new Error(`Cannot generate schema for interface '${name}'`);
  }
  const definition = _get_definition(tjsg_schema, name);
  let properties = _resolve_properties(name, definition);
  if (properties) {
    properties = _update_properties(properties, interface_node);
  }
  const interface_schema = {
    extends: _resolve_extends(interface_node),
    full_text,
    properties,
    type: _resolve_type(definition, name),
    items: _resolve_items(definition),
  };
  return utils.no_undefined(interface_schema);
}

function _generate_type_schema(
  tsconfig_path: string,
  file_path: string,
  name: string,
  type_node: ts.TypeAliasDeclaration
): types.Type | undefined {
  const full_text = type_node.getFullText();
  const tjsg_schema = _tjsg_schema(tsconfig_path, file_path, name);
  // console.log(`NAME: ${name}`);
  // console.log(`TJS: `, tjsg_schema);
  if (!tjsg_schema) {
    throw new Error(`Cannot generate schema for type '${name}'`);
  }
  const definition = _get_definition(tjsg_schema, name);
  let properties = _resolve_properties(name, definition);
  if (properties) {
    properties = _update_properties(properties, type_node);
  }
  const type_schema = {
    full_text,
    properties,
    type: _resolve_type(definition, name),
    items: _resolve_items(definition),
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

function _get_definition(
  tjsg_schema: tjsg.Schema,
  name: string
): tjsg.Definition {
  const definition = tjsg_schema.definitions?.[name];
  if (!definition || typeof definition === 'boolean') {
    throw new Error(`Cannot resolve definition for '${name}'`);
  }
  return definition;
}

function _resolve_type(
  definition: tjsg.Schema,
  name: string
): types.Primitive | undefined {
  const type = definition.type;
  // console.log(definition);
  if (!type) {
    ion.warn(`Cannot resolve 'type' for '${name}'`);
    return undefined;
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

function _resolve_items(definition: tjsg.Schema): types.Items | undefined {
  const items = definition?.items;
  if (!items || typeof items === 'boolean') {
    return undefined;
  }
  return items as any;
}

function _resolve_properties(
  name: string,
  definition?: tjsg.Schema
): types.Properties | undefined {
  const tjs_properties = definition?.properties;
  if (!tjs_properties) {
    return undefined;
  }
  const properties: types.Properties = {};
  for (const [key, value] of Object.entries(tjs_properties)) {
    if (typeof value === 'boolean') {
      continue;
    }
    const type = _resolve_type(value, `${name}.${key}`);
    if (!type) {
      return undefined;
    }
    const property: types.Property = {
      enum: _resolve_enum(value.enum),
      properties: _resolve_properties(`${name}.${key}`, value),
      type,
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
  tsconfig_path: string,
  source_file: ts.SourceFile
): types.Types | undefined {
  ion.trace(`Resolving types...`);
  const types: types.Types = {};
  const type_nodes = _get_nested_of_type<ts.TypeAliasDeclaration>(
    source_file,
    ts.SyntaxKind.TypeAliasDeclaration
  );
  if (type_nodes.length === 0) {
    return undefined;
  }
  const file_name = source_file.fileName;
  for (const type_node of type_nodes) {
    const name = type_node.name.getText();
    ion.trace(`Resolving type for '${name}'...`);
    const generated_schema = _generate_type_schema(
      tsconfig_path,
      file_name,
      name,
      type_node
    );
    if (generated_schema) {
      types[name] = generated_schema;
    }
  }
  return types;
}

function _create_ts_program(tsconfig_path: string) {
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
  // .getTypeChcker needs to be called otherwise
  // when searching nested nodes, the nodes have no
  // SourceFile attached to and the system fails
  program.getTypeChecker();
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

function _tjsg_schema(
  tsconfig: string,
  file_path: string,
  name: string
): tjsg.Schema {
  const config = {
    path: file_path,
    tsconfig,
    type: name,
    expose: 'none',
    sortProps: true,
    skipTypeCheck: true,
  } as const;
  const generator = tjsg.createGenerator(config);
  const schema = generator.createSchema(config.type);
  return schema;
}

function _resolve_tsconfig_path(path?: string): string {
  let tsconfig_path = _get_default_tsconfig_path();
  if (typeof path === 'string' && path !== '') {
    tsconfig_path = path;
  }
  return tsconfig_path;
}
