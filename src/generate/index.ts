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

type GenerateParams = {
  tsconfig_path: string;
  source_file_path: string;
  type_name: string;
};

export function generate(params: GenerateParams): TypeSchema {
  ion.trace(`Generating...`);
  const generator = new Generator();
  return generator.generate(params);
}

export class Generator {
  public projects = new Map<string, Project>();
  constructor() {
    ion.trace(`Creating a Generator...`);
  }
  public get_project(tsconfig_path: string) {
    ion.trace(`Getting a Project...`);
    if (this.projects.has(tsconfig_path)) {
      return this.projects.get(tsconfig_path) as Project;
    }
    const project = new Project(tsconfig_path);
    this.projects.set(tsconfig_path, project);
    return project;
  }
  public generate(params: GenerateParams) {
    const project = this.get_project(params.tsconfig_path);
    const source_file = project.get_source_file(params.source_file_path);
    const type = source_file.get_type(params.type_name);
    const schema = type.generate_schema();
    return schema;
  }
}

class Project {
  public source_files = new Map<string, SourceFile>();
  public program: ts.Program;
  constructor(public tsconfig_path: string) {
    ion.trace(`Creating Project ${tsconfig_path} ...`);
    const config_file = ts.readConfigFile(this.tsconfig_path, ts.sys.readFile);
    const config_object = config_file.config;
    const parse_result = ts.parseJsonConfigFileContent(
      config_object,
      ts.sys,
      path.dirname(this.tsconfig_path)
    );
    const compilerOptions = parse_result.options;
    const rootNames = parse_result.fileNames;
    const create_program_options = {
      rootNames: rootNames,
      options: compilerOptions,
    };
    this.program = ts.createProgram(create_program_options);
    // .getTypeChcker needs to be called otherwise
    // when searching nested nodes, the nodes have no
    // SourceFile attached to and the system fails
    this.program.getTypeChecker();
  }
  public get_source_file(source_file_path: string): SourceFile {
    ion.trace(`Getting a SourceFile...`);
    if (this.source_files.has(source_file_path)) {
      return this.source_files.get(source_file_path) as SourceFile;
    }
    const source_file = new SourceFile(source_file_path, this);
    this.source_files.set(source_file_path, source_file);
    return source_file;
  }
}

type NodeType = {
  type: 'type' | 'interface';
  node: ts.Node;
};

class SourceFile {
  public types = new Map<string, Type>();
  public nodes = new Map<string, NodeType>();
  public imports: Import[] = [];
  public source: ts.SourceFile;
  public tjsg_generator: tjsg.SchemaGenerator;
  constructor(public path: string, public project: Project) {
    ion.trace(`Creating SourceFile ${path} ...`);
    this.tjsg_generator = this._create_tjsg_generator();
    this.source = this._resolve_source();
    this._resolve_imports();
    this._resolve_nodes();
  }
  public get_type(type_name: string): Type {
    if (this.types.has(type_name)) {
      return this.types.get(type_name) as Type;
    }
    const type = new Type(type_name, this);
    this.types.set(type_name, type);
    return type;
  }
  private _create_tjsg_generator(): tjsg.SchemaGenerator {
    ion.trace(`Creating ts json schema generator...`);
    const config = {
      tsconfig: this.project.tsconfig_path,
      path: this.path,
      skipTypeCheck: true,
      sortProps: true,
      // expose: 'none',
      // type: '*',
    } as const;
    return tjsg.createGenerator(config);
  }
  private _resolve_source() {
    ion.trace(`Getting ts SourceFile...`);
    const source_file = this.project.program.getSourceFile(this.path);
    if (!source_file) {
      throw new Error(`Cannot find source file ${this.path}`);
    }
    return source_file;
  }
  private _resolve_nodes() {
    ion.trace(`Resolving SourceFile nodes...`);
    // Interface
    const interface_nodes = _get_nested_of_type<ts.InterfaceDeclaration>(
      this.source,
      ts.SyntaxKind.InterfaceDeclaration
    );
    for (const interface_node of interface_nodes) {
      const name = interface_node.name.getText();
      this.nodes.set(name, {
        type: 'interface',
        node: interface_node,
      });
    }
    // Type
    const type_nodes = _get_nested_of_type<ts.InterfaceDeclaration>(
      this.source,
      ts.SyntaxKind.TypeAliasDeclaration
    );
    for (const type_node of type_nodes) {
      const name = type_node.name.getText();
      this.nodes.set(name, {
        type: 'type',
        node: type_node,
      });
    }
  }
  private _resolve_imports() {
    ion.trace(`Resolving SourceFile imports...`);
    this.imports = [];
    const import_declarations: ts.ImportDeclaration[] = _get_nested_of_type(
      this.source,
      ts.SyntaxKind.ImportDeclaration
    );
    for (const import_declaration of import_declarations) {
      const import_parts = _generate_import_schema(import_declaration);
      this.imports.push(import_parts);
    }
  }
}

type TypeSchema = Property & {
  name: string;
  imports: Import[];
  // full_text: string;
  // properties: Properties;
  // type: Primitive;
  // items?: Items;
};

type Import = {
  clause: string;
  module: string;
  specifiers: string[];
  text: string;
};

type Properties = {
  [k: string]: Property;
};

type Property = {
  type: Primitive;
  original?: string;
  enum?: Primitive[];
  properties?: Properties;
};

// type Items = {
//   type: Primitive | Primitive[];
// };

type Primitive =
  | 'any'
  | 'array'
  | 'boolean'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'undefined';

class Type {
  private node: NodeType;
  private tjsg_type_schema: tjsg.Schema;
  private tjsg_type_definition: tjsg.Schema;
  constructor(public name: string, public source_file: SourceFile) {
    ion.trace(`Creating Type ${name} ...`);
    this.tjsg_type_schema = this._resolve_tjsg_schema();
    this.tjsg_type_definition = this._resolve_tjsg_definition();
    this.node = this._resolve_node();
  }
  public generate_schema(): TypeSchema {
    const text = this.node.node.getText();
    const original = typeof text === 'string' && text !== '' ? text : undefined;
    const type_schema: TypeSchema = {
      name: this.name,
      type: _resolve_type(this.tjsg_type_definition, this.name),
      original,
      enum: this._resolve_enum(),
      imports: this._resolve_imports(),
      properties: _resolve_all_properties(
        this.tjsg_type_definition,
        this.node.node,
        this.name,
        this.source_file
      ),
    };
    return utils.no_undefined(type_schema);
  }
  private _resolve_tjsg_schema(): tjsg.Schema {
    const tjsg_type_schema = this.source_file.tjsg_generator.createSchema(
      this.name
    );
    // console.log(JSON.stringify(tjsg_type_schema, null, 2));
    ion.debug(tjsg_type_schema);
    return tjsg_type_schema;
  }
  private _resolve_tjsg_definition(): tjsg.Schema {
    const definitions = this.tjsg_type_schema.definitions;
    if (!definitions || typeof definitions !== 'object') {
      throw new Error(`Missing tjsg definitions`);
    }
    const main_definition = definitions[this.name];
    if (!main_definition || typeof main_definition === 'boolean') {
      throw new Error(`Missing tjsg definition for ${this.name}`);
    }
    return main_definition;
  }
  private _resolve_node(): NodeType {
    if (this.source_file.nodes.has(this.name)) {
      return this.source_file.nodes.get(this.name) as NodeType;
    }
    console.log(this.source_file.imports);
    throw new Error(`Cannot resolve node`);
  }
  private _resolve_imports(): Import[] {
    return this.source_file.imports;
  }
  private _resolve_enum(): Primitive[] | undefined {
    return undefined;
  }
}

export function _resolve_original(node?: ts.Node): string | undefined {
  if (!node) {
    return undefined;
  }
  // TypeOperator: keyof, ...
  const type_operators = _get_nested_of_type(node, ts.SyntaxKind.TypeOperator);
  if (type_operators.length > 0 && type_operators[0]) {
    const type_op = type_operators[0];
    return type_op.getText();
  }
  // TypeReference: CustomType, ...
  const type_references = _get_nested_of_type(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (type_references.length === 0 || !type_references[0]) {
    return undefined;
  }
  const type_ref = type_references[0];
  const text = type_ref.getText();
  if (typeof text !== 'string' || text === '') {
    return undefined;
  }
  return text;
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

function _resolve_type(definition: tjsg.Schema, name: string): types.Primitive {
  const type = definition.type;
  if (!type) {
    ion.error(`Cannot resolve 'type' for '${name}'`);
    ion.error(`Definition: `, definition);
    throw new Error(`Cannot resolve type`);
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
  throw new Error(`Invalid definition type`);
}

function _resolve_all_properties(
  definition: tjsg.Schema,
  node: ts.Node | undefined,
  name: string,
  source_file: SourceFile
) {
  const tjs_properties = definition?.properties;
  if (!tjs_properties) {
    return undefined;
  }
  let properties: types.Properties = {};
  for (const [key, value] of Object.entries(tjs_properties)) {
    if (typeof value === 'boolean') {
      continue;
    }
    properties[key] = _resolve_property(value, node, name, key, source_file);
  }
  return properties;
}

function _resolve_property(
  prop_def: tjsg.Schema,
  parent_node: ts.Node | undefined,
  parent_name: string,
  key: string,
  source_file: SourceFile
) {
  const child_node = _resolve_property_signature_node(parent_node, key);
  if ('$ref' in prop_def) {
    const type_ref_name = _resolve_type_ref_name(prop_def, key);
    const ref_source_file = _resolve_ref_source_file(
      type_ref_name,
      source_file,
      child_node
    );
    const property = _resolve_references_property(
      type_ref_name,
      ref_source_file
    );
    property.original = _resolve_original(child_node);
    return utils.no_undefined(property);
  }
  let property: types.Property = {
    type: _resolve_type(prop_def, `${parent_name}.${key}`),
    enum: _resolve_enum(prop_def.enum),
    original: _resolve_original(child_node),
  };
  return utils.no_undefined(property);
}

function _resolve_ref_source_file(
  type_ref_name: string,
  source_file: SourceFile,
  node?: ts.Node
): SourceFile {
  const type = source_file.nodes.get(type_ref_name);
  if (type || !node) {
    return source_file;
  }
  const child_text = node.getText();
  for (const import_declaration of source_file.imports) {
    const clause = import_declaration.clause;
    if (child_text.indexOf(clause) !== -1) {
      const other_source_file_path = path.resolve(
        path.dirname(source_file.path),
        import_declaration.module + '.ts'
      );
      const other_source_file = new SourceFile(
        other_source_file_path,
        source_file.project
      );
      other_source_file.nodes.get(type_ref_name);
      return other_source_file;
    }
  }
  throw new Error(`Cannot find source file for ${type_ref_name}`);
}

function _resolve_type_ref_name(
  prop_def: tjsg.Schema,
  prop_name: string
): string {
  const ref = prop_def.$ref;
  if (typeof ref !== 'string' || ref === '') {
    throw new Error(`Invalid $ref value`);
  }
  if (ref[0] !== '#') {
    ion.warn(
      `Reference $ref for ${prop_name} doesn't start with #/definition/`
    );
    ion.warn(`Reference $ref for ${prop_name} is ${ref}`);
    throw new Error(`Wrong $ref value`);
  }
  const ref_name = ref.replace(`#/definitions/`, '');
  return ref_name;
}

function _resolve_references_property(name: string, source_file: SourceFile) {
  const type = new Type(name, source_file);
  return type.generate_schema();
}

function _resolve_property_signature_node(
  node: ts.Node | undefined,
  name: string
): ts.Node | undefined {
  if (!node) {
    return undefined;
  }
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
  const prop_signature = prop_signature_map.get(name);
  if (!prop_signature) {
    return undefined;
    // throw new Error(`Cannot find property signature node`);
  }
  return prop_signature;
}

function _resolve_enum(tjs_enum?: unknown[]): types.Primitive[] | undefined {
  if (!tjs_enum) {
    return undefined;
  }
  // TODO Check all possibilities
  return tjs_enum as types.Primitive[];
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
