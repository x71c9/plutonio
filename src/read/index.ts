/**
 *
 * Read module
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

type Schema = any;

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
  const import_declarations = _get_import_declaration(source_file);
  for (const import_declaration of import_declarations) {
    const import_parts = _generate_import(import_declaration);
    console.log(import_parts);
  }
  const types = _get_types(source_file);
  const interfaces = _get_interfaces(source_file);
  for (const t of types) {
    const name = t.name.getText();
    console.log(`Generating schema for type ${name}...`);
    const full_text = t.getFullText();
    let type_schema = _generate_schema(program, name, 'type');
    type_schema = _update_properties(t, type_schema);
    schemas[name] = type_schema;
    schemas[name].full_text = full_text;
  }
  for (const i of interfaces) {
    const name = i.name.getText();
    console.log(`Generating schema for interface ${name}...`);
    const full_text = i.getFullText();
    let interface_schema = _generate_schema(program, name, 'interface');
    interface_schema = _update_properties(i, interface_schema);
    schemas[name] = interface_schema;
    schemas[name].full_text = full_text;
    schemas[name].extends = _get_heritage(i);
  }
  return schemas;
}

function _get_heritage(i: ts.InterfaceDeclaration) {
  const heritage_clauses = _get_syntax_kind(
    i,
    ts.SyntaxKind.HeritageClause
  ) as ts.HeritageClause[];
  let expressions: ts.ExpressionWithTypeArguments[] = [];
  for (const heritage_clause of heritage_clauses) {
    const expression_with_typed_arguments = _get_syntax_kind(
      heritage_clause,
      ts.SyntaxKind.ExpressionWithTypeArguments
    ) as ts.ExpressionWithTypeArguments[];
    expressions = expressions.concat(expression_with_typed_arguments);
  }
  return expressions.map((e) => e.getText());
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
      let any_child = child as any;
      let name = any_child.name
        ? any_child.name.getText()
        : any_child.getText();
      log.trace(`Found ${ts.SyntaxKind[kind]}: ${name}`);
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

function _get_import_declaration(source_file: ts.SourceFile) {
  const children = source_file.getChildren()[0].getChildren(); // SyntaxList
  const import_declarations: ts.ImportDeclaration[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.kind === ts.SyntaxKind.ImportDeclaration) {
      log.trace(`Found ImportDeclaration: ${child.getText()}`);
      import_declarations.push(child as ts.ImportDeclaration);
    }
  }
  return import_declarations;
}

function _generate_import(import_node: ts.ImportDeclaration) {
  const text = import_node.getText();
  const module = import_node.moduleSpecifier
    .getText()
    .replaceAll("'", '')
    .replaceAll('"', '');

  // import * as plutonio from 'plutonio'
  const namespace_imports = _get_syntax_kind(
    import_node,
    ts.SyntaxKind.NamespaceImport
  ) as ts.NamespaceImport[];
  if (namespace_imports.length > 0) {
    const namespace_import = namespace_imports[0];
    const identifiers = _get_syntax_kind(
      namespace_import,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier[];
    const identifier = identifiers[0];
    const clause = identifier.getText();
    return {
      text,
      module,
      clause,
      specifiers: [],
    };
  }

  // import {atom} from 'plutonio'
  const import_specifiers = _get_syntax_kind(
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
  const import_clauses = _get_syntax_kind(
    import_node,
    ts.SyntaxKind.ImportClause
  ) as ts.ImportClause[];
  const import_clause = import_clauses[0];
  const clause = import_clause.getText();
  return {
    text,
    module,
    clause,
    specifiers: [],
  };
}

function _update_properties(node: ts.Node, schema: Schema): Schema {
  const property_signatures = _get_syntax_kind(
    node,
    ts.SyntaxKind.PropertySignature
  ) as ts.PropertySignature[];
  const prop_signature_map = new Map<string, ts.PropertySignature>();
  for (const prop_sign of property_signatures) {
    const identifiers = _get_syntax_kind(
      prop_sign,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier[];
    const identifier = identifiers[0];
    const prop_name = identifier.getText();
    prop_signature_map.set(prop_name, prop_sign);
  }
  if (!schema.properties) {
    return schema;
  }
  for (const [prop_name, prop_def] of Object.entries(schema.properties)) {
    const prop_signature = prop_signature_map.get(prop_name);
    if (!prop_signature) {
      continue;
    }
    const type_operators = _get_syntax_kind(
      prop_signature,
      ts.SyntaxKind.TypeOperator
    );
    if (type_operators.length > 0) {
      const type_op = type_operators[0];
      // TODO: FIX
      (prop_def as any).original = type_op.getText();
      return schema;
    }
    const type_references = _get_syntax_kind(
      prop_signature,
      ts.SyntaxKind.TypeReference
    );
    if (type_references.length === 0) {
      continue;
    }
    const type_ref = type_references[0];
    // TODO: FIX
    (prop_def as any).original = type_ref.getText();
  }
  return schema;
}
