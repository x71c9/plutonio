/**
 *
 * Scanner index module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import * as utils from '../utils/index.js';
import ts from 'typescript';
import * as t from './types.js';

const known_type_reference = ['Array', 'Record'];

let checker: ts.TypeChecker;

export function scanner() {
  const tsconfig_path = `/Users/x71c9/repos/plutonio/builder/tsconfig.json`;
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
  checker = program.getTypeChecker();
  const source_files = program.getSourceFiles();
  const scanned: t.Scanned = {};
  for (const source_file of source_files) {
    if (source_file.isDeclarationFile) {
      continue;
    }
    const scanned_source_file: t.SourceFile = {
      imports: _resolve_source_file_imports(source_file),
      types: _resolve_source_file_part(
        source_file,
        ts.SyntaxKind.TypeAliasDeclaration
      ),
      interfaces: _resolve_source_file_part(
        source_file,
        ts.SyntaxKind.InterfaceDeclaration
      ),
      enums: _resolve_source_file_part(
        source_file,
        ts.SyntaxKind.EnumDeclaration
      ),
    };
    scanned[source_file.fileName] = utils.no_undefined(scanned_source_file);
  }
  return scanned;
}

function _resolve_source_file_imports(
  source_file: ts.SourceFile
): t.Imports | undefined {
  const import_declarations: ts.ImportDeclaration[] = _get_nested_children(
    source_file,
    ts.SyntaxKind.ImportDeclaration
  );
  const imports: t.Imports = {};
  for (const import_declaration of import_declarations) {
    const import_attributes = _resolve_import(import_declaration);
    imports[import_attributes.module] = import_attributes;
  }
  if (Object.keys(imports).length < 1) {
    return undefined;
  }
  return imports;
}

function _resolve_import(import_declaration: ts.ImportDeclaration): t.Import {
  const text = import_declaration.getText();
  const module = import_declaration.moduleSpecifier
    .getText()
    .replaceAll("'", '')
    .replaceAll('"', '');
  // i.e.: import * as plutonio from 'plutonio'
  const namespace_imports = utils.get_nested_of_type(
    import_declaration,
    ts.SyntaxKind.NamespaceImport
  ) as ts.NamespaceImport[];
  if (namespace_imports.length > 0 && namespace_imports[0]) {
    const namespace_import = namespace_imports[0];
    const identifiers = utils.get_nested_of_type(
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
  // i.e.: import {atom} from 'plutonio'
  const import_specifiers = utils.get_nested_of_type(
    import_declaration,
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
  // i.e.: import plutonio from 'plutonio'
  const import_clauses = utils.get_nested_of_type(
    import_declaration,
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

function _resolve_source_file_part(
  source_file: ts.SourceFile,
  syntax_kind: ts.SyntaxKind
) {
  const nodes = _get_nested_children(source_file, syntax_kind) as
    | ts.TypeAliasDeclaration[]
    | ts.InterfaceDeclaration[]
    | ts.EnumDeclaration[];
  const scanned_nodes: t.Types | t.Interfaces | t.Enums = {};
  for (const node of nodes) {
    const name = _get_name(node);
    scanned_nodes[name] = _resolve_node(node, name);
  }
  if (Object.keys(scanned_nodes).length < 1) {
    return undefined;
  }
  return scanned_nodes;
}

function _resolve_node(node: ts.Node, name: string): t.Type | t.Interace {
  const type_attributes = _resolve_type_attributes(node);
  const scanned_type: t.Type | t.Interace | t.Enums = {
    name,
    kind: _resolve_kind(node),
    ...type_attributes,
  };
  return utils.no_undefined(scanned_type);
}

function _resolve_kind(node: ts.Node): t.Kind {
  if (ts.isTypeAliasDeclaration(node)) {
    return t.KIND.TYPE;
  }
  if (ts.isInterfaceDeclaration(node)) {
    return t.KIND.INTERFACE;
  }
  if (ts.isEnumDeclaration(node)) {
    return t.KIND.ENUM;
  }
  throw new Error(`Cannot resolve KIND`);
}

function _resolve_type_attributes(node: ts.Node): t.TypeAttributes {
  if (_is_node_custom_type_reference(node)) {
    const type_attributes = _resolve_type_attributes_for_type_reference(node);
    type_attributes.original = _resolve_original(node);
    return type_attributes;
  }
  const type_attributes: t.TypeAttributes = {
    primitive: _resolve_primitive(node),
    properties: _resolve_properties(node),
    item: _resolve_item(node),
    original: _resolve_original(node),
    values: _resolve_values(node),
  };
  return utils.no_undefined(type_attributes);
}

function _resolve_values(node: ts.Node): t.Values | undefined {
  const enum_members = _get_nested_children(
    node,
    ts.SyntaxKind.EnumMember
  ) as ts.EnumMember[];
  if (Array.isArray(enum_members) && enum_members.length > 0) {
    return _resolve_values_from_enum_members(enum_members);
  }
  const union_type = _get_first_level_child(node, ts.SyntaxKind.UnionType);
  if (union_type) {
    return _resolve_values_from_union_type(node);
  }
  return _resolve_values_from_keyof_keyword(node);
}

function _resolve_values_from_enum_members(enum_members: ts.EnumMember[]) {
  const values: (string | number)[] = [];
  for (const enum_member of enum_members) {
    const type = checker.getTypeAtLocation(enum_member);
    // TODO: fix any
    const value = (type as any).value;
    if (typeof value !== undefined) {
      const final_value = typeof value === 'number' ? value : String(value);
      values.push(final_value);
    }
  }
  return values;
}

function _resolve_values_from_union_type(node: ts.Node): t.Values | undefined {
  const union_type = _get_first_level_child(node, ts.SyntaxKind.UnionType);
  if (!union_type) {
    return undefined;
  }
  const type = checker.getTypeAtLocation(node) as ts.UnionType;
  return _get_values_from_union_type(type);
}

function _get_values_from_union_type(type: ts.UnionType): t.Values | undefined {
  const values: (string | number)[] = [];
  for (const keytype of type.types) {
    // TODO: fix any
    const value = (keytype as any).value;
    if (typeof value !== undefined) {
      const final_value = typeof value === 'number' ? value : String(value);
      if (value) {
        values.push(final_value);
      }
    }
  }
  if (values.length > 0) {
    return values;
  }
  return undefined;
}

function _resolve_values_from_keyof_keyword(
  node: ts.Node
): t.Values | undefined {
  const type_operator = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeOperator
  );
  if (!type_operator) {
    return undefined;
  }
  const keyof_keyword = _get_first_level_child(
    type_operator,
    ts.SyntaxKind.KeyOfKeyword
  );
  if (!keyof_keyword) {
    return undefined;
  }
  const type = checker.getTypeAtLocation(node) as ts.UnionType;
  return _get_values_from_union_type(type);
}

function _resolve_original(node: ts.Node): string {
  return node.getText();
}

function _resolve_item(node: ts.Node): t.TypeAttributes | undefined {
  const array_type = _get_first_level_child(node, ts.SyntaxKind.ArrayType);
  if (array_type) {
    return _resolve_type_attributes(array_type);
  }
  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  // Check same logic in _node_type_is_array
  if (type_reference) {
    const identifier = _get_first_level_child(
      type_reference,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier;
    if (!identifier) {
      return undefined;
    }
    const name = identifier.escapedText;
    if (name === 'Array') {
      const syntax_list = _get_first_level_child(
        type_reference,
        ts.SyntaxKind.SyntaxList
      );
      if (syntax_list) {
        return _resolve_type_attributes(syntax_list);
      }
    }
  }
  return undefined;
}

function _is_node_custom_type_reference(node: ts.Node): boolean {
  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (!type_reference) {
    return false;
  }
  if (_node_type_is_known_reference(type_reference)) {
    return false;
  }
  return true;
}

function _node_type_is_known_reference(node: ts.Node): boolean {
  const name = _get_type_first_identifier_name(node);
  if (!name) {
    return false;
  }
  if (known_type_reference.includes(name)) {
    return true;
  }
  return false;
}

function _get_type_first_identifier_name(node: ts.Node): string | undefined {
  // Check same logic in _resolve_item
  const identifier = _get_first_level_child(
    node,
    ts.SyntaxKind.Identifier
  ) as ts.Identifier;
  if (!identifier) {
    return undefined;
  }
  const name = identifier.escapedText;
  return name || undefined;
}

function _node_type_is_enum(node: ts.Node): boolean {
  if (ts.isEnumDeclaration(node)) {
    return true;
  }
  const type_operator = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeOperator
  );
  if (type_operator) {
    const keyof_keyword = _get_first_level_child(
      type_operator,
      ts.SyntaxKind.KeyOfKeyword
    );
    if (keyof_keyword) {
      return true;
    }
  }
  const union_type = _get_first_level_child(node, ts.SyntaxKind.UnionType) as
    | ts.UnionTypeNode
    | undefined;
  if (union_type) {
    return _is_union_type_an_enum(union_type);
  }
  return false;
}

function _is_union_type_an_enum(node: ts.UnionTypeNode): boolean {
  const children = node.getChildren();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) {
      continue;
    }
    if (
      child.kind !== ts.SyntaxKind.LiteralType &&
      child.kind !== ts.SyntaxKind.BarToken
    ) {
      return false;
    }
  }
  return true;
}

function _node_type_is_array(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.ArrayType)) {
    return true;
  }
  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  // Check same logic in _resolve_item
  if (type_reference) {
    const identifier = _get_first_level_child(
      type_reference,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier;
    if (!identifier) {
      return false;
    }
    const name = identifier.escapedText;
    if (name === 'Array') {
      return true;
    }
  }
  return false;
}

function _resolve_properties(node: ts.Node): t.Properties | undefined {
  let properties: t.Properties | undefined;
  const type_literal = _get_first_level_child(node, ts.SyntaxKind.TypeLiteral);
  if (!type_literal) {
    return properties;
  }
  const syntax_list = _get_first_level_child(
    type_literal,
    ts.SyntaxKind.SyntaxList
  );
  if (!syntax_list) {
    return properties;
  }
  properties = {};
  const property_signatures = _get_first_level_children(
    syntax_list,
    ts.SyntaxKind.PropertySignature
  ) as ts.PropertySignature[];
  for (const property_signature of property_signatures) {
    const property_name = _get_name(property_signature);
    if (_is_node_custom_type_reference(property_signature)) {
      const property_attributes =
        _resolve_type_attributes_for_type_reference(property_signature);
      property_attributes.original = _resolve_original(property_signature);
      properties[property_name] = property_attributes;
      continue;
    }
    properties[property_name] = _resolve_property(property_signature);
  }
  return properties;
}

// function _is_custom_type_reference(type_reference: ts.TypeReference): boolean {
// }

function _resolve_property(property: ts.PropertySignature): t.TypeAttributes {
  const type_attribute: t.TypeAttributes = {
    item: _resolve_item(property),
    original: _resolve_original(property),
    primitive: _resolve_primitive(property),
    values: _resolve_values(property),
    properties: _resolve_properties(property),
  };
  return utils.no_undefined(type_attribute);
}

function _resolve_type_attributes_for_type_reference(
  node: ts.Node
): t.TypeAttributes {
  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (!type_reference) {
    return _unknown_type_reference(node);
  }
  const node_type = checker.getTypeAtLocation(type_reference);
  const node_type_node = node_type.aliasSymbol?.declarations?.[0];
  if (node_type_node) {
    const resolved = _resolve_type_attributes(node_type_node);
    return resolved;
  }
  return _resolve_primitive_type_reference(node_type, type_reference);
}

function _resolve_primitive_type_reference(
  node_type: ts.Type,
  node: ts.Node
): t.TypeAttributes {
  const type_attribute: t.TypeAttributes = {
    original: _resolve_original(node),
    primitive: _resolve_primitive_of_simple_type(node_type),
  };
  return utils.no_undefined(type_attribute);
}

function _resolve_primitive_of_simple_type(node_type: ts.Type): t.Primitive {
  // TODO: Fix
  const primitive = (node_type as any).intrinsicName;
  return primitive;
}

function _unknown_type_reference(_node: ts.Node): t.TypeAttributes {
  const type_attribute: t.TypeAttributes = {
    // original: _resolve_original(node),
    original: '',
    primitive: t.PRIMITIVE.UNKNOWN,
  };
  return utils.no_undefined(type_attribute);
}

// function _resolve_primitive_for_type_reference(node: ts.Node): t.Primitive {
//   const type_attributes = _resolve_type_attributes_for_type_reference(node);
//   return type_attributes.primitive;
// }

function _resolve_primitive(node: ts.Node): t.Primitive {
  if (_node_type_is_enum(node)) {
    return t.PRIMITIVE.ENUM;
  }
  if (_node_type_is_array(node)) {
    return t.PRIMITIVE.ARRAY;
  }
  if (_node_type_is_boolean(node)) {
    return t.PRIMITIVE.BOOLEAN;
  }
  if (_node_type_is_number(node)) {
    return t.PRIMITIVE.NUMBER;
  }
  if (_node_type_is_string(node)) {
    return t.PRIMITIVE.STRING;
  }
  if (_node_type_is_object(node)) {
    return t.PRIMITIVE.OBJECT;
  }
  if (_node_type_is_any(node)) {
    return t.PRIMITIVE.ANY;
  }
  if (_node_type_is_null(node)) {
    return t.PRIMITIVE.NULL;
  }
  if (_node_type_is_undefined(node)) {
    return t.PRIMITIVE.UNDEFINED;
  }
  return t.PRIMITIVE.UNKNOWN;
}

function _node_type_is_object(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.TypeLiteral)) {
    return true;
  }
  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (type_reference) {
    const identifier_name = _get_type_first_identifier_name(type_reference);
    if (identifier_name === 'Record') {
      return true;
    }
  }
  return false;
}

function _node_type_is_boolean(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.BooleanKeyword)) {
    return true;
  }
  return false;
}

function _node_type_is_number(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.NumberKeyword)) {
    return true;
  }
  return false;
}

function _node_type_is_string(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.StringKeyword)) {
    return true;
  }
  return false;
}

function _node_type_is_any(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.AnyKeyword)) {
    return true;
  }
  return false;
}

function _node_type_is_null(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.NullKeyword)) {
    return true;
  }
  return false;
}

function _node_type_is_undefined(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.UndefinedKeyword)) {
    return true;
  }
  return false;
}

// function _resolve_interface(node: ts.InterfaceDeclaration): t.Interace {

// }

export function _get_name(node: ts.Node & {name: ts.Node}): string {
  const symbol = checker.getSymbolAtLocation(node.name);
  return String(symbol?.escapedName);
}

export function _get_nested_children<T extends ts.Node>(
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
      nodes.push(child as T);
    }
    const nested_nodes = _get_nested_children(child, kind);
    nodes = nodes.concat(nested_nodes as T[]);
  }
  return nodes;
}

export function _has_first_level_child(
  node: ts.Node,
  kind: ts.SyntaxKind
): boolean {
  const children = node.getChildren();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) {
      continue;
    }
    if (child.kind === kind) {
      return true;
    }
  }
  return false;
}

export function _get_first_level_child<T extends ts.Node>(
  node: ts.Node,
  kind: ts.SyntaxKind
): T | undefined {
  const children = node.getChildren();
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as T;
    if (!child) {
      continue;
    }
    if (child.kind === kind) {
      return child;
    }
  }
  return undefined;
}

export function _get_first_level_children<T extends ts.Node>(
  node: ts.Node,
  kind: ts.SyntaxKind
): T[] {
  const children = node.getChildren();
  const nodes: T[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as T;
    if (!child) {
      continue;
    }
    if (child.kind === kind) {
      nodes.push(child);
    }
  }
  return nodes;
}
