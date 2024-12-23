/**
 *
 * Scanner index module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import ts from 'typescript';
// import {log} from '../log/index';
import * as utils from '../utils/index';
import * as t from './types';
export * from './types';

const known_type_reference = ['Array', 'Record', 'Omit', 'Pick'];

let checker: ts.TypeChecker;

export function scan(tsconfig_path: string) {
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
    if (source_file.fileName.indexOf(compilerOptions.baseUrl || '') === -1) {
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
  // _resolve_interface_extends(scanned);
  return scanned;
}

// function _resolve_interface_extends(scanned:t.Scanned){
//   for(const [source_path, source_scanned] of Object.entries(scanned)){
//   }
// }

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
  if (import_clauses.length > 0) {
    const import_clause = import_clauses[0]!;
    const clause = import_clause.getText();
    return {
      text,
      module,
      clause,
      specifiers: [],
    };
  }
  // i.e.: import './file.js'
  return {
    text,
    module,
    clause: '',
    specifiers: [],
  };
  // if (!import_clause) {
  //   throw new Error(`Missing import clause`);
  // }
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

function _resolve_node(node: ts.Node, name: string): t.Type | t.Interface {
  const type_attributes = _resolve_type_attributes(node);
  const scanned_type: t.Type | t.Interface | t.Enums = {
    name,
    kind: _resolve_kind(node),
    extends: _resolve_extends(node),
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
  let type_attributes: t.TypeAttributes = {
    primitive: _resolve_primitive(node),
    properties: _resolve_properties(node),
    item: _resolve_item(node),
    original: _resolve_original(node),
    values: _resolve_values(node),
  };
  if (ts.isInterfaceDeclaration(node)) {
    const extended_type_attributes = _resolve_extended_type_attributes(node);
    type_attributes = _merge_type_attributes(
      type_attributes,
      ...extended_type_attributes
    );
  }
  return utils.no_undefined(type_attributes);
}

function _merge_type_attributes(
  ...type_attributes: t.TypeAttributes[]
): t.TypeAttributes {
  const main_type_attributues = type_attributes[0];
  if (!main_type_attributues?.properties) {
    return main_type_attributues as t.TypeAttributes;
  }
  for (let i = 1; i < type_attributes.length; i++) {
    const current_type_attributes = type_attributes[i];
    if (!current_type_attributes?.properties) {
      continue;
    }
    for (const [key, value] of Object.entries(
      current_type_attributes?.properties
    )) {
      if (key in main_type_attributues?.properties) {
        continue;
      }
      main_type_attributues.properties[key] = value;
    }
  }
  return main_type_attributues;
}

function _resolve_extended_type_attributes(node: ts.Node): t.TypeAttributes[] {
  const syntax_lists = _get_first_level_children(
    node,
    ts.SyntaxKind.SyntaxList
  );
  const type_attributes: t.TypeAttributes[] = [];
  for (const syntax_list of syntax_lists) {
    const heritage_clause = _get_first_level_child(
      syntax_list,
      ts.SyntaxKind.HeritageClause
    );
    if (heritage_clause) {
      const heritage_syntax_list = _get_first_level_child(
        heritage_clause,
        ts.SyntaxKind.SyntaxList
      );
      if (heritage_syntax_list) {
        const exp_with_type_args = _get_first_level_children(
          heritage_syntax_list,
          ts.SyntaxKind.ExpressionWithTypeArguments
        );
        for (const exp of exp_with_type_args) {
          const exp_type = checker.getTypeAtLocation(exp);
          let declaration: ts.Declaration | undefined;
          if (exp_type.aliasSymbol) {
            declaration = exp_type.aliasSymbol?.declarations?.[0];
          } else if (exp_type.symbol) {
            declaration = exp_type.symbol?.declarations?.[0];
          }
          if (declaration) {
            const resolved = _resolve_type_attributes(declaration);
            type_attributes.push(resolved);
          }
        }
      }
    }
  }
  return type_attributes;
}

function _resolve_extends(node: ts.Node): string[] | undefined {
  const syntax_lists = _get_first_level_children(
    node,
    ts.SyntaxKind.SyntaxList
  );
  for (const syntax_list of syntax_lists) {
    const heritage_clause = _get_first_level_child(
      syntax_list,
      ts.SyntaxKind.HeritageClause
    );
    if (heritage_clause) {
      const heritage_syntax_list = _get_first_level_child(
        heritage_clause,
        ts.SyntaxKind.SyntaxList
      );
      if (heritage_syntax_list) {
        const extend_string = heritage_syntax_list.getFullText().trim();
        const exts = extend_string.split(',');
        return exts.map((e) => e.trim());
      }
    }
  }
  return undefined;
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
  if (!type.types) {
    // TODO: fix any
    return [(type as any).value];
  }
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

function _is_pick_omit_type_reference(type_reference?: ts.Node) {
  if (!type_reference) {
    return false;
  }
  const type_text = type_reference.getText();
  if (type_text.substring(0, 4) === 'Omit') {
    return true;
  }
  if (type_text.substring(0, 4) === 'Pick') {
    return true;
  }
  return false;
}

// function _resolve_omit_properties(node_type: ts.Type) {
//   const properties = node_type.getProperties();
//   console.log(properties);
//   for(const prop of properties){
//     const original = prop.getText();
//     const primitive = t.PRIMITIVE.UNKNOWN;
//   const property = {
//   original: string;
//   primitive: Primitive;
//   item?: TypeAttributes;
//   values?: Values;
//   properties?: Properties;
//   }
//   }
// }

function _infer_primitive(type: ts.Type): string {
  if (type.flags & ts.TypeFlags.String) return t.PRIMITIVE.STRING;
  if (type.flags & ts.TypeFlags.Number) return t.PRIMITIVE.NUMBER;
  if (type.flags & ts.TypeFlags.Boolean) return t.PRIMITIVE.BOOLEAN;
  if (type.flags & ts.TypeFlags.Object) {
    if (type.symbol && type.symbol.name === 'Date') return t.PRIMITIVE.DATE;
    return t.PRIMITIVE.OBJECT;
  }
  return t.PRIMITIVE.UNKNOWN;
}

function _resolve_properties(node: ts.Node): t.Properties | undefined {
  if (_is_intersection(node)) {
    return _resolve_intersection_properties(node);
  }

  const type_reference = _get_first_level_child(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (_is_pick_omit_type_reference(type_reference)) {
    const type = checker.getTypeAtLocation(node);
    const type_properties = type.getProperties();
    const properties: t.Properties = {};
    for (let i = 0; i < type_properties.length; i++) {
      const prop = type_properties[i]!;
      const propType = checker.getTypeOfSymbolAtLocation(prop, node);
      const propTypeString = checker.typeToString(propType);
      const primitive = _infer_primitive(propType);
      properties[prop.name] = {
        original: `${prop.name}: ${propTypeString};`,
        primitive,
      };
    }
    return properties;
  }

  let properties: t.Properties | undefined;
  const property_signatures = _get_property_signatures(node);
  for (const property_signature of property_signatures) {
    const property_name = _get_name(property_signature);
    if (_is_node_custom_type_reference(property_signature)) {
      const property_attributes =
        _resolve_type_attributes_for_type_reference(property_signature);
      property_attributes.original = _resolve_original(property_signature);
      if (!properties) {
        properties = {};
      }
      properties[property_name] = property_attributes;
      continue;
    }
    if (!properties) {
      properties = {};
    }
    properties[property_name] = _resolve_property(property_signature);
  }
  return properties;
}

function _get_property_signatures(node: ts.Node): ts.PropertySignature[] {
  const type_literal = _get_first_level_child(node, ts.SyntaxKind.TypeLiteral);
  // Type Literal
  if (type_literal) {
    const syntax_list = _get_first_level_child(
      type_literal,
      ts.SyntaxKind.SyntaxList
    );
    if (syntax_list) {
      const property_signatures = _get_first_level_children(
        syntax_list,
        ts.SyntaxKind.PropertySignature
      ) as ts.PropertySignature[];
      return property_signatures;
    }
  }
  // Interface
  const syntax_lists = _get_first_level_children(
    node,
    ts.SyntaxKind.SyntaxList
  );
  for (const syntax_list of syntax_lists) {
    const property_signatures = _get_first_level_children(
      syntax_list,
      ts.SyntaxKind.PropertySignature
    ) as ts.PropertySignature[];
    if (property_signatures.length > 0) {
      return property_signatures;
    }
  }
  return [];
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
  if (type_reference.getText() === 'Date') {
    let type_attributes: t.TypeAttributes = {
      primitive: t.PRIMITIVE.DATE,
      original: _resolve_original(node),
    };
    return type_attributes;
  }
  const node_type = checker.getTypeAtLocation(type_reference);

  /*
   * I added this for avoiding infinite loop when defining ENUM as ObjectValue
   * of a constant. e.g.:
   *
   * type ObjectValue<T> = T[keyof T];
   * const VIDEO_CATEGORY = {
   *   STACK_EXCHANGE: 'stackexchange',
   *   TIMER: 'timer',
   * } as const;
   * type VideoCategory = ObjectValue<typeof VIDEO_CATEGORY>;
   *
   * VideoCategory in this case is a Union:
   */
  if (node_type.isUnion()) {
    const values: t.Values = [];
    for (let single_type of node_type.types) {
      values.push((single_type as any).value);
    }
    let type_attributes: t.TypeAttributes = {
      primitive: t.PRIMITIVE.ENUM,
      original: _resolve_original(node),
      values,
    };
    return type_attributes;
  }

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
  if (!primitive) {
    // log.warn(`'intrinsicName' was undefined. Cannot resolve primitive`);
    return t.PRIMITIVE.UNRESOLVED;
  }
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
  if (ts.isInterfaceDeclaration(node)) {
    return t.PRIMITIVE.OBJECT;
  }
  if (_is_intersection(node)) {
    return _resolve_intersection_primitive(node);
  }
  if (_is_union(node)) {
    return _resolve_union_primitive(node);
  }
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
  if (_node_type_is_unknown(node)) {
    return t.PRIMITIVE.UNKNOWN;
  }
  return t.PRIMITIVE.UNRESOLVED;
}

function _is_union(node: ts.Node): boolean {
  const union_type = _get_first_level_child(node, ts.SyntaxKind.UnionType);
  if (union_type) {
    return true;
  }
  return false;
}

function _is_intersection(node: ts.Node): boolean {
  const intersection_node = _get_first_level_child(
    node,
    ts.SyntaxKind.IntersectionType
  );
  if (intersection_node) {
    return true;
  }
  return false;
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
    if (
      identifier_name === 'Record' ||
      identifier_name === 'Omit' ||
      identifier_name === 'Pick'
    ) {
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

function _node_type_is_unknown(node: ts.Node): boolean {
  if (_has_first_level_child(node, ts.SyntaxKind.UnknownKeyword)) {
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

function _get_name(node: ts.Node & {name: ts.Node}): string {
  const symbol = checker.getSymbolAtLocation(node.name);
  return String(symbol?.escapedName);
}

function _get_nested_children<T extends ts.Node>(
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

function _has_first_level_child(node: ts.Node, kind: ts.SyntaxKind): boolean {
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

function _get_first_level_child<T extends ts.Node>(
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

function _get_first_level_children<T extends ts.Node>(
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

// Method for solving primitive of intersecetion type
// Not clean method
function _resolve_direct_node_primitive(node: ts.Node): t.Primitive {
  if (ts.isTypeReferenceNode(node)) {
    return _resolve_reference_node_primitive(node);
  }
  if (ts.isTypeLiteralNode(node)) {
    return t.PRIMITIVE.OBJECT;
  }
  return t.PRIMITIVE.UNRESOLVED;
}

function _resolve_reference_node_primitive(node: ts.Node): t.Primitive {
  const node_type = checker.getTypeAtLocation(node);
  const node_type_node = node_type.aliasSymbol?.declarations?.[0];
  if (node_type_node) {
    const resolved = _resolve_type_attributes(node_type_node);
    return resolved.primitive;
  }
  return t.PRIMITIVE.UNRESOLVED;
}

// Method for solving properties of interecetion type
// Not clean method
function _resolve_intersection_properties(
  node: ts.Node
): t.Properties | undefined {
  const intersection_node = _get_first_level_child(
    node,
    ts.SyntaxKind.IntersectionType
  ) as ts.IntersectionTypeNode | undefined;
  if (!intersection_node) {
    return undefined;
  }
  const syntax_list = _get_first_level_child(
    intersection_node,
    ts.SyntaxKind.SyntaxList
  ) as ts.SyntaxList | undefined;
  if (!syntax_list) {
    return undefined;
  }
  const children = syntax_list.getChildren();
  let properties: t.Properties = {};
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || child.kind === ts.SyntaxKind.AmpersandToken) {
      continue;
    }
    const current_properties = _resolve_direct_node_properties(child);
    properties = {
      ...properties,
      ...current_properties,
    };
  }
  return properties;
}

// Method for solving properties of intersecetion type
// Not clean method
function _resolve_direct_node_properties(
  node: ts.Node
): t.Properties | undefined {
  if (ts.isTypeReferenceNode(node)) {
    const node_type = checker.getTypeAtLocation(node);
    const node_type_node = node_type.aliasSymbol?.declarations?.[0];
    if (node_type_node) {
      node = node_type_node;
    }
  }
  let properties: t.Properties | undefined;
  const syntax_list = _get_first_level_child(node, ts.SyntaxKind.SyntaxList);
  if (!syntax_list) {
    const type_literal = _get_first_level_child(
      node,
      ts.SyntaxKind.TypeLiteral
    );
    if (!type_literal) {
      return undefined;
    }
    return _resolve_direct_node_properties(type_literal);
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

function _resolve_union_primitive(node: ts.Node): t.Primitive {
  const union_type = _get_first_level_child(node, ts.SyntaxKind.UnionType);
  if (!union_type) {
    return t.PRIMITIVE.UNRESOLVED;
  }
  const type_literals = _get_nested_children(
    union_type,
    ts.SyntaxKind.TypeLiteral
  );
  const type_references = _get_nested_children(
    union_type,
    ts.SyntaxKind.TypeReference
  );
  if (type_literals.length > 0 || type_references.length > 0) {
    return t.PRIMITIVE.UNRESOLVED;
  }
  return t.PRIMITIVE.ENUM;
}

// Method for solving primitive of interecetion type
// Not clean method
function _resolve_intersection_primitive(node: ts.Node): t.Primitive {
  const intersection_node = _get_first_level_child(
    node,
    ts.SyntaxKind.IntersectionType
  ) as ts.IntersectionTypeNode | undefined;
  if (!intersection_node) {
    return t.PRIMITIVE.UNRESOLVED;
  }
  const syntax_list = _get_first_level_child(
    intersection_node,
    ts.SyntaxKind.SyntaxList
  ) as ts.SyntaxList | undefined;
  if (!syntax_list) {
    return t.PRIMITIVE.UNRESOLVED;
  }
  const children = syntax_list.getChildren();
  let first_primitive: t.Primitive = t.PRIMITIVE.UNRESOLVED;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child || child.kind === ts.SyntaxKind.AmpersandToken) {
      continue;
    }
    const primitive = _resolve_direct_node_primitive(child);
    if (first_primitive === t.PRIMITIVE.UNRESOLVED) {
      first_primitive = primitive;
    }
    if (primitive !== first_primitive) {
      return t.PRIMITIVE.UNRESOLVED;
    }
  }
  return first_primitive;
}
