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

type Import = {
  text: string;
  module: string;
  clause?: string;
};

type Type = {
  text: string;
  name: string;
  properties: Property[];
};

type Interface = Type;

type Property = {
  name: string;
  value: string;
  type: string;
  optional?: boolean;
};

type SourceFileSchema = {
  imports: Import[];
  types: Type[];
  interfaces: Interface[];
};

// const valid_kind_name = ['InterfaceDeclaration', 'TypeAliasDeclaration'];

export function scan(options?: GenerateOptions) {
  log.trace('Scanning...');
  const {program, checker} = _create_ts_program(options);
  const schemas = _scan_all_files(program, checker);
  for (const [key, schema] of schemas) {
    console.log(key);
    log.info(schema);
  }
  return schemas;
}

function _scan_all_files(program: ts.Program, checker: ts.TypeChecker) {
  const schema_map = new Map<string, SourceFileSchema>();
  for (const source_file of program.getSourceFiles()) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    log.debug(`Scanning ${source_file.fileName}...`);
    const import_declarations = _get_import_declaration(source_file);
    const types = _get_types(source_file);
    const interfaces = _get_interfaces(source_file);
    const source_file_schema = _generate_source_file_schema(
      checker,
      import_declarations,
      types,
      interfaces
    );
    schema_map.set(source_file.fileName, source_file_schema);
  }
  return schema_map;
}

function _generate_source_file_schema(
  checker: ts.TypeChecker,
  import_nodes: ts.ImportDeclaration[],
  type_nodes: ts.TypeAliasDeclaration[],
  interface_nodes: ts.InterfaceDeclaration[]
): SourceFileSchema {
  const imports: Import[] = [];
  for (let i = 0; i < import_nodes.length; i++) {
    imports.push(_generate_import(import_nodes[i]));
  }
  const types: Type[] = [];
  for (let i = 0; i < type_nodes.length; i++) {
    types.push(_generate_type(checker, type_nodes[i]));
  }
  const interfaces: Interface[] = [];
  for (let i = 0; i < interface_nodes.length; i++) {
    interfaces.push(_generate_interface(checker, interface_nodes[i]));
  }
  return {
    imports,
    types,
    interfaces,
  };
}

function _generate_interface(
  checker: ts.TypeChecker,
  type_node: ts.InterfaceDeclaration
) {
  const text = type_node.getText();
  const name = type_node.name.getText();
  const properties = _generate_properties(checker, type_node);
  return {
    text,
    name,
    properties,
  };
}

function _generate_type(
  checker: ts.TypeChecker,
  type_node: ts.TypeAliasDeclaration
): Type {
  const text = type_node.getText();
  const name = type_node.name.getText();
  const properties = _generate_properties(checker, type_node);
  return {
    text,
    name,
    properties,
  };
}

function _generate_properties(
  checker: ts.TypeChecker,
  type_node: ts.TypeAliasDeclaration | ts.InterfaceDeclaration
): Property[] {
  const type = checker.getTypeAtLocation(type_node);
  // console.log(type);
  const node_properties = type.getProperties();
  // console.log(node_properties);
  const properties: Property[] = [];
  for (const node_property of node_properties) {
    const property = _generate_property(checker, node_property, type_node);
    properties.push(property);
  }
  return properties;
}

function _generate_property(
  checker: ts.TypeChecker,
  node_property: ts.Symbol,
  node: ts.Node
): Property {
  const name = node_property.getName();

  const value = _get_property_value(node, name, node_property);
  console.log('value:', value);
  const type = _get_symbol_type(checker, node_property, node);
  console.log('type:', type);
  const optional = _is_attribute_optional(checker, node_property, node);
  return {
    name,
    value,
    type,
    optional,
  };
}

function _get_symbol_type(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  node: ts.Node
) {
  const property_type = checker.getTypeOfSymbolAtLocation(symbol, node);
  const type_string = checker.typeToString(property_type);
  return type_string;
}

function _get_property_value(
  node: ts.Node,
  name: string,
  node_property: ts.Symbol
) {
  let value = '';
  const property_signature = _get_property_of_name(node, name);
  if (!property_signature) {
    value = _get_imported_property(name, node_property);
    return value;
  }
  const children = property_signature.getChildren();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (ts.isIdentifier(child)) {
      continue;
    }
    if (ts.SyntaxKind.QuestionToken === child.kind) {
      continue;
    }
    if (ts.SyntaxKind.ColonToken === child.kind) {
      continue;
    }
    // TypeReference, BooleanKeyword, ArrayType, ...
    return child.getText();
  }
  return value;
}

function _get_imported_property(name: string, node_property: ts.Symbol) {
  const member = (node_property as any).parent.members.get(name);
  const declaration = member.valueDeclaration.type;
  const text = declaration.getText();
  return text;
}

function _get_property_of_name(
  node: ts.Node,
  name: string
): ts.PropertySignature | null {
  const children = node.getChildren();
  if (ts.isTypeAliasDeclaration(node)) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (ts.SyntaxKind.TypeLiteral === child.kind) {
        const type_litteral_children = child.getChildren();
        for (let j = 0; j < type_litteral_children.length; j++) {
          if (ts.SyntaxKind.SyntaxList === type_litteral_children[j].kind) {
            const syntax_children = type_litteral_children[j].getChildren();
            for (let k = 0; k < syntax_children.length; k++) {
              const identi = _get_first_identifier(syntax_children[k]);
              if (identi?.getText() === name) {
                return syntax_children[k] as ts.PropertySignature;
              }
            }
          }
        }
      }
    }
  } else if (ts.isInterfaceDeclaration(node)) {
    for (let i = 0; i < children.length; i++) {
      if (children[i].kind === ts.SyntaxKind.SyntaxList) {
        const syntax_children = children[i].getChildren();
        for (let j = 0; j < syntax_children.length; j++) {
          if (syntax_children[j].kind === ts.SyntaxKind.PropertySignature) {
            const identi = _get_first_identifier(syntax_children[j]);
            if (identi?.getText() === name) {
              return syntax_children[j] as ts.PropertySignature;
            }
          }
        }
      }
    }
  }
  return null;
}

function _get_first_identifier(node: ts.Node): ts.Identifier | null {
  const childern = node.getChildren();
  for (let i = 0; i < childern.length; i++) {
    if (childern[i].kind === ts.SyntaxKind.Identifier) {
      return childern[i] as ts.Identifier;
    }
  }
  return null;
}

function _is_attribute_optional(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  node: ts.Node
): true | undefined {
  const property_type = checker.getTypeOfSymbolAtLocation(symbol, node);
  const has_undefined = _has_undefined(property_type);
  return has_undefined === true ? true : undefined;
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

function _generate_import(import_node: ts.ImportDeclaration): Import {
  const text = import_node.getText();
  const module = import_node.moduleSpecifier
    .getText()
    .replaceAll("'", '')
    .replaceAll('"', '');
  let clause;
  const import_clause = import_node.importClause?.getText();
  if (typeof import_clause === 'string' && import_clause !== '') {
    const splitted_import = import_clause.split(' ');
    clause = splitted_import[splitted_import.length - 1];
  }
  return {
    text,
    module,
    clause,
  };
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
    const nested_nodes = _get_syntax_kind(child, kind);
    nodes = nodes.concat(nested_nodes);
  }
  return nodes;
}

// function _get_types(node:ts.Node){
//   const children = node.getChildren();
//   for(let i = 0; i < children.length; i++){
//     const child = children[i];
//     const kind_name = ts.SyntaxKind[child.kind];
//     if(valid_kind_name.includes(kind_name)){
//       console.log('------------------------');
//       console.log(kind_name);
//       console.log('------------------------');
//       // console.log(child);
//     }
//     _get_types(child)
//   }
// }

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

export function printObjectWithCircular(
  obj: any,
  maxDepth: number = 8,
  currentDepth: number = 0,
  seen: Set<any> = new Set(),
  indent: number = 2
) {
  if (currentDepth > maxDepth) {
    console.log(`${' '.repeat(indent * currentDepth)}[Reached maximum depth]`);
    return;
  }

  if (typeof obj === 'object' && obj !== null) {
    if (seen.has(obj)) {
      console.log(`${' '.repeat(indent * currentDepth)}[Circular Reference]`);
      return;
    }

    seen.add(obj);

    for (const key in obj) {
      if (typeof obj[key] !== 'function') {
        console.log(`${' '.repeat(indent * currentDepth)}${key}:`);
        printObjectWithCircular(
          obj[key],
          maxDepth,
          currentDepth + 1,
          seen,
          indent
        );
      }
    }

    seen.delete(obj);
  } else {
    if (typeof obj === 'function') {
      console.log(`${' '.repeat(indent * currentDepth)}[FUNCTION]`);
    } else {
      console.log(`${' '.repeat(indent * currentDepth)}${obj}`);
    }
  }
}
