/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import path from 'path';
import ts from 'typescript';
import { ion } from '../log/index.js';
import * as tjsg from 'ts-json-schema-generator';
import * as utils from '../utils/index.js';
export function generate(params) {
    const generator = new Generator();
    return generator.generate(params);
}
class Generator {
    constructor() {
        this.projects = new Map();
    }
    get_project(tsconfig_path) {
        if (this.projects.has(tsconfig_path)) {
            return this.projects.get(tsconfig_path);
        }
        const project = new Project(tsconfig_path);
        this.projects.set(tsconfig_path, project);
        return project;
    }
    generate(params) {
        const project = this.get_project(params.tsconfig_path);
        const source_file = project.get_source_file(params.source_file_path);
        const type = source_file.get_type(params.type_name);
        const schema = type.generate_schema();
        return schema;
    }
}
class Project {
    constructor(tsconfig_path) {
        this.tsconfig_path = tsconfig_path;
        this.source_files = new Map();
        const config_file = ts.readConfigFile(this.tsconfig_path, ts.sys.readFile);
        const config_object = config_file.config;
        const parse_result = ts.parseJsonConfigFileContent(config_object, ts.sys, path.dirname(this.tsconfig_path));
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
    get_source_file(source_file_path) {
        if (this.source_files.has(source_file_path)) {
            return this.source_files.get(source_file_path);
        }
        const source_file = new SourceFile(source_file_path, this);
        this.source_files.set(source_file_path, source_file);
        return source_file;
    }
}
class SourceFile {
    constructor(path, project) {
        this.path = path;
        this.project = project;
        this.types = new Map();
        this.nodes = new Map();
        this.imports = [];
        const config = {
            tsconfig: this.project.tsconfig_path,
            path,
            skipTypeCheck: true,
            sortProps: true,
            expose: 'none',
        };
        this.tjsg_generator = tjsg.createGenerator(config);
        this.source = this._resolve_source();
        this._resolve_imports();
        this._resolve_nodes();
    }
    get_type(type_name) {
        if (this.types.has(type_name)) {
            return this.types.get(type_name);
        }
        const type = new Type(type_name, this);
        this.types.set(type_name, type);
        return type;
    }
    _resolve_source() {
        const source_file = this.project.program.getSourceFile(this.path);
        if (!source_file) {
            throw new Error(`Cannot find source file ${this.path}`);
        }
        return source_file;
    }
    _resolve_nodes() {
        // Interface
        const interface_nodes = _get_nested_of_type(this.source, ts.SyntaxKind.InterfaceDeclaration);
        for (const interface_node of interface_nodes) {
            const name = interface_node.name.getText();
            this.nodes.set(name, {
                type: 'interface',
                node: interface_node,
            });
        }
        // Type
        const type_nodes = _get_nested_of_type(this.source, ts.SyntaxKind.TypeAliasDeclaration);
        for (const type_node of type_nodes) {
            const name = type_node.name.getText();
            this.nodes.set(name, {
                type: 'type',
                node: type_node,
            });
        }
    }
    _resolve_imports() {
        this.imports = [];
        const import_declarations = _get_nested_of_type(this.source, ts.SyntaxKind.ImportDeclaration);
        for (const import_declaration of import_declarations) {
            const import_parts = _generate_import_schema(import_declaration);
            this.imports.push(import_parts);
        }
    }
}
class Type {
    constructor(name, source_file) {
        this.name = name;
        this.source_file = source_file;
        this.tjsg_type_definition = this._resolve_tjsg_definition();
        this.node = this._resolve_node();
    }
    generate_schema() {
        const type_schema = {
            name: this.name,
            type: _resolve_type(this.tjsg_type_definition, this.name),
            original: this.node.node.getText(),
            enum: this._resolve_enum(),
            imports: this._resolve_imports(),
            properties: _resolve_all_properties(this.tjsg_type_definition, this.node.node, this.name),
        };
        return utils.no_undefined(type_schema);
    }
    _resolve_tjsg_definition() {
        const tjsg_type_schema = this.source_file.tjsg_generator.createSchema(this.name);
        const definitions = tjsg_type_schema.definitions;
        if (!definitions || typeof definitions !== 'object') {
            throw new Error(`Missing tjsg definition`);
        }
        const definition_keys = Object.keys(definitions);
        if (definition_keys.length < 1) {
            throw new Error(`Missing tjsg definition keys`);
        }
        const first_key = definition_keys[0];
        return definitions[first_key];
    }
    _resolve_node() {
        if (this.source_file.nodes.has(this.name)) {
            return this.source_file.nodes.get(this.name);
        }
        throw new Error(`Cannot resolve node`);
    }
    _resolve_imports() {
        return this.source_file.imports;
    }
    // private _resolve_original(): string | undefined {
    //   return undefined;
    // }
    _resolve_enum() {
        return undefined;
    }
}
export function _resolve_original(node) {
    if (!node) {
        return undefined;
    }
    // const property_signatures = _get_nested_of_type(
    //   node,
    //   ts.SyntaxKind.PropertySignature
    // ) as ts.PropertySignature[];
    // const prop_signature_map = new Map<string, ts.PropertySignature>();
    // for (const prop_sign of property_signatures) {
    //   const identifiers = _get_nested_of_type(
    //     prop_sign,
    //     ts.SyntaxKind.Identifier
    //   ) as ts.Identifier[];
    //   const identifier = identifiers[0];
    //   if (!identifier) {
    //     throw new Error('Missing identifier for property signature');
    //   }
    //   const prop_name = identifier.getText();
    //   prop_signature_map.set(prop_name, prop_sign);
    // }
    // const prop_signature = prop_signature_map.get(name);
    // console.log(name, prop_signature);
    // if (!prop_signature) {
    //   return '';
    // }
    // const type_operators = _get_nested_of_type(
    //   prop_signature,
    //   ts.SyntaxKind.TypeOperator
    // );
    // if (type_operators.length > 0 && type_operators[0]) {
    //   const type_op = type_operators[0];
    //   return type_op.getText();
    // }
    // const type_references = _get_nested_of_type(
    //   prop_signature,
    //   ts.SyntaxKind.TypeReference
    // );
    // if (type_references.length === 0 || !type_references[0]) {
    //   return '';
    // }
    // const type_ref = type_references[0];
    // return type_ref.getText();
    const type_operators = _get_nested_of_type(node, ts.SyntaxKind.TypeOperator);
    if (type_operators.length > 0 && type_operators[0]) {
        const type_op = type_operators[0];
        return type_op.getText();
    }
    const type_references = _get_nested_of_type(node, ts.SyntaxKind.TypeReference);
    if (type_references.length === 0 || !type_references[0]) {
        return '';
    }
    const type_ref = type_references[0];
    return type_ref.getText();
}
export function _generate(_options) {
    // const generator = new Generator(options);
    // return generator.generate();
}
export class _Generator {
    constructor(options) {
        this.tjsg_schema_by_file = new Map();
        this.tsconfig_path = _resolve_tsconfig_path(options === null || options === void 0 ? void 0 : options.tsconfig_path);
        this.program = this._create_ts_program();
        this._generate_tjsg_schema_map();
    }
    generate() {
        const project_schema = this._generate_project_schema();
        return project_schema;
    }
    _generate_tjsg_schema_map() {
        const source_files = this.program.getSourceFiles();
        for (const source_file of source_files) {
            if (source_file.isDeclarationFile) {
                continue;
            }
            const file_name = source_file.fileName;
            ion.trace(`Generating tjsg schema for ${file_name}`);
            const config = {
                // expose: 'none',
                path: file_name,
                skipTypeCheck: true,
                sortProps: true,
                tsconfig: this.tsconfig_path,
                type: '*',
            };
            const schema = tjsg.createGenerator(config).createSchema(config.type);
            // TODO
            ion.debug(file_name, schema);
            this.tjsg_schema_by_file.set(file_name, schema);
        }
        for (const [file_name, schema] of this.tjsg_schema_by_file) {
            this._resolve_refs(schema, file_name);
        }
    }
    _create_ts_program() {
        const config_file = ts.readConfigFile(this.tsconfig_path, ts.sys.readFile);
        const config_object = config_file.config;
        const parse_result = ts.parseJsonConfigFileContent(config_object, ts.sys, path.dirname(this.tsconfig_path));
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
    _resolve_refs(schema, file_name) {
        if (!schema.definitions) {
            return;
        }
        for (const [_name, definition] of Object.entries(schema.definitions)) {
            if (typeof definition === 'boolean') {
                continue;
            }
            this._resolve_definition_refs(definition, file_name);
        }
    }
    _resolve_definition_refs(definition, file_name) {
        var _a;
        const properties = definition.properties;
        if (!properties) {
            return;
        }
        for (let [prop_name, prop_def] of Object.entries(properties)) {
            if (typeof prop_def === 'boolean') {
                continue;
            }
            const ref = prop_def.$ref;
            if (typeof ref === 'string' && ref !== '') {
                if (ref[0] !== '#') {
                    ion.warn(`Reference $ref for ${prop_name} doesn't start with #/definition/`);
                    ion.warn(`Reference $ref for ${prop_name} is ${ref}`);
                    continue;
                }
                const ref_name = ref.replace(`#/definitions/`, '');
                const file_schema = this.tjsg_schema_by_file.get(file_name);
                if (!file_schema) {
                    ion.warn(`Cannot find schema for file ${file_name}`);
                    ion.warn(`Cannot resolve reference for ${prop_name}`);
                    continue;
                }
                const ref_value = (_a = file_schema.definitions) === null || _a === void 0 ? void 0 : _a[ref_name];
                if (!ref_value) {
                    ion.warn(`Cannot find schema for definition ${ref_name}`);
                    ion.warn(`Cannot resolve reference for ${prop_name}`);
                    continue;
                }
                ion.trace(`Replacing ${prop_name} value with`, ref_value);
                properties[prop_name] = ref_value;
            }
        }
    }
    _generate_project_schema() {
        const project_schema = {};
        const source_files = this.program.getSourceFiles();
        for (const source_file of source_files) {
            if (source_file.isDeclarationFile) {
                continue;
            }
            const file_name = source_file.fileName;
            ion.trace(`Parsing ${file_name}`);
            project_schema[source_file.fileName] =
                this._resolve_file_schema(source_file);
        }
        return project_schema;
    }
    _resolve_file_schema(source_file) {
        const file_schema = {
            imports: this._resolve_imports(source_file),
            interfaces: this._resolve_interfaces(source_file),
            types: this._resolve_types(source_file),
        };
        return utils.no_undefined(file_schema);
    }
    _resolve_interfaces(source_file) {
        ion.trace(`Resolving interfaces...`);
        const interfaces = {};
        const interface_nodes = _get_nested_of_type(source_file, ts.SyntaxKind.InterfaceDeclaration);
        if (interface_nodes.length === 0) {
            return undefined;
        }
        const file_path = source_file.fileName;
        for (const interface_node of interface_nodes) {
            const name = interface_node.name.getText();
            ion.trace(`Resolving interface for '${name}'...`);
            const generated_schema = this._generate_interface_schema(file_path, name, interface_node);
            if (generated_schema) {
                interfaces[name] = generated_schema;
            }
        }
        return interfaces;
    }
    _generate_interface_schema(file_path, name, interface_node) {
        const full_text = interface_node.getFullText();
        // const tjsg_schema = this._tjsg_schema(file_path, name);
        const tjsg_schema = this._tjsg_schema(file_path);
        if (!tjsg_schema) {
            throw new Error(`Cannot generate schema for interface '${name}'`);
        }
        const definition = _get_definition(tjsg_schema, name);
        let properties = _resolve_properties(definition, name);
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
    _tjsg_schema(file_path) {
        // const config = {
        //   path: file_path,
        //   tsconfig: this.tsconfig_path,
        //   type: name,
        //   expose: 'none',
        //   sortProps: true,
        //   skipTypeCheck: true,
        // } as const;
        // const generator = tjsg.createGenerator(config);
        // const schema = generator.createSchema(config.type);
        // return schema;
        const file_schema = this.tjsg_schema_by_file.get(file_path);
        return file_schema;
    }
    _resolve_imports(source_file) {
        ion.trace(`Resolving imports...`);
        const imports = [];
        const import_declarations = _get_nested_of_type(source_file, ts.SyntaxKind.ImportDeclaration);
        for (const import_declaration of import_declarations) {
            const import_parts = _generate_import_schema(import_declaration);
            imports.push(import_parts);
        }
        if (imports.length === 0) {
            return undefined;
        }
        return imports;
    }
    _resolve_types(source_file) {
        ion.trace(`Resolving types...`);
        const types = {};
        const type_nodes = _get_nested_of_type(source_file, ts.SyntaxKind.TypeAliasDeclaration);
        if (type_nodes.length === 0) {
            return undefined;
        }
        const file_name = source_file.fileName;
        for (const type_node of type_nodes) {
            const name = type_node.name.getText();
            ion.trace(`Resolving type for '${name}'...`);
            const generated_schema = this._generate_type_schema(file_name, name, type_node);
            if (generated_schema) {
                types[name] = generated_schema;
            }
        }
        return types;
    }
    _generate_type_schema(file_path, name, type_node) {
        const full_text = type_node.getFullText();
        // const tjsg_schema = this._tjsg_schema(file_path, name);
        const tjsg_schema = this._tjsg_schema(file_path);
        // console.log(`NAME: ${name}`);
        // console.log(`TJS: `, tjsg_schema);
        if (!tjsg_schema) {
            throw new Error(`Cannot generate schema for type '${name}'`);
        }
        const definition = _get_definition(tjsg_schema, name);
        let properties = _resolve_properties(definition, name);
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
}
function _generate_import_schema(import_node) {
    const text = import_node.getText();
    const module = import_node.moduleSpecifier
        .getText()
        .replaceAll("'", '')
        .replaceAll('"', '');
    // import * as plutonio from 'plutonio'
    const namespace_imports = _get_nested_of_type(import_node, ts.SyntaxKind.NamespaceImport);
    if (namespace_imports.length > 0 && namespace_imports[0]) {
        const namespace_import = namespace_imports[0];
        const identifiers = _get_nested_of_type(namespace_import, ts.SyntaxKind.Identifier);
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
    const import_specifiers = _get_nested_of_type(import_node, ts.SyntaxKind.ImportSpecifier);
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
    const import_clauses = _get_nested_of_type(import_node, ts.SyntaxKind.ImportClause);
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
function _resolve_extends(interface_node) {
    const heritage_clauses = _get_nested_of_type(interface_node, ts.SyntaxKind.HeritageClause);
    let expressions = [];
    for (const heritage_clause of heritage_clauses) {
        const expression_with_typed_arguments = _get_nested_of_type(heritage_clause, ts.SyntaxKind.ExpressionWithTypeArguments);
        expressions = expressions.concat(expression_with_typed_arguments);
    }
    return expressions.map((e) => e.getText());
}
function _update_properties(properties, node) {
    // TODO: remvoe
    // if (!node) {
    //   return properties;
    // }
    const property_signatures = _get_nested_of_type(node, ts.SyntaxKind.PropertySignature);
    const prop_signature_map = new Map();
    for (const prop_sign of property_signatures) {
        const identifiers = _get_nested_of_type(prop_sign, ts.SyntaxKind.Identifier);
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
        const type_operators = _get_nested_of_type(prop_signature, ts.SyntaxKind.TypeOperator);
        if (type_operators.length > 0 && type_operators[0]) {
            const type_op = type_operators[0];
            // TODO: FIX
            prop_def.original = type_op.getText();
            return properties;
        }
        const type_references = _get_nested_of_type(prop_signature, ts.SyntaxKind.TypeReference);
        if (type_references.length === 0 || !type_references[0]) {
            continue;
        }
        const type_ref = type_references[0];
        // TODO: FIX
        prop_def.original = type_ref.getText();
    }
    return properties;
}
function _get_definition(tjsg_schema, name) {
    var _a;
    const definition = (_a = tjsg_schema.definitions) === null || _a === void 0 ? void 0 : _a[name];
    if (!definition || typeof definition === 'boolean') {
        throw new Error(`Cannot resolve definition for '${name}'`);
    }
    return definition;
}
function _resolve_type(definition, name) {
    const type = definition.type;
    if (!type) {
        ion.warn(`Cannot resolve 'type' for '${name}'`);
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
function _resolve_items(definition) {
    const items = definition === null || definition === void 0 ? void 0 : definition.items;
    if (!items || typeof items === 'boolean') {
        return undefined;
    }
    return items;
}
function _resolve_all_properties(definition, node, name) {
    const tjs_properties = definition === null || definition === void 0 ? void 0 : definition.properties;
    if (!tjs_properties) {
        return undefined;
    }
    let properties = {};
    for (const [key, value] of Object.entries(tjs_properties)) {
        if (typeof value === 'boolean') {
            continue;
        }
        properties[key] = _resolve_property(value, node, name, key);
    }
    return properties;
}
function _resolve_property(prop_def, parent_node, parent_name, key) {
    const type = _resolve_type(prop_def, `${parent_name}.${key}`);
    const child_node = _resolve_property_signature_node(parent_node, key);
    const property = {
        enum: _resolve_enum(prop_def.enum),
        properties: _resolve_all_properties(prop_def, child_node, `${parent_name}.${key}`),
        type,
        original: _resolve_original(child_node)
    };
    return utils.no_undefined(property);
}
function _resolve_property_signature_node(node, name) {
    if (!node) {
        return undefined;
    }
    const property_signatures = _get_nested_of_type(node, ts.SyntaxKind.PropertySignature);
    const prop_signature_map = new Map();
    for (const prop_sign of property_signatures) {
        const identifiers = _get_nested_of_type(prop_sign, ts.SyntaxKind.Identifier);
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
function _resolve_properties(definition, name
// node: ts.Node
) {
    const tjs_properties = definition === null || definition === void 0 ? void 0 : definition.properties;
    if (!tjs_properties) {
        return undefined;
    }
    let properties = {};
    for (const [key, value] of Object.entries(tjs_properties)) {
        if (typeof value === 'boolean') {
            continue;
        }
        const type = _resolve_type(value, `${name}.${key}`);
        if (!type) {
            return undefined;
        }
        // const child_node = _get_child_node(node, key);
        const property = {
            enum: _resolve_enum(value.enum),
            properties: _resolve_properties(value, `${name}.${key}`),
            type,
        };
        properties[key] = utils.no_undefined(property);
    }
    if (Object.keys(properties).length === 0) {
        return undefined;
    }
    // if (properties) {
    //   properties = _update_properties(properties, node);
    // }
    return properties;
}
// function _get_child_node(_node?: ts.Node, _key?: string): ts.Node | undefined {
//   return undefined;
// }
function _resolve_enum(tjs_enum) {
    if (!tjs_enum) {
        return undefined;
    }
    // TODO Check all possibilities
    return tjs_enum;
}
function _get_default_tsconfig_path() {
    return './tsconfig.json';
}
function _get_nested_of_type(node, kind) {
    const children = node.getChildren();
    let nodes = [];
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
            nodes.push(child);
        }
        // Do not check types and interfaces inside namespaces.
        // typescript-json-schema won't work with them
        if (child.kind === ts.SyntaxKind.ModuleDeclaration) {
            continue;
        }
        const nested_nodes = _get_nested_of_type(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
function _resolve_tsconfig_path(path) {
    let tsconfig_path = _get_default_tsconfig_path();
    if (typeof path === 'string' && path !== '') {
        tsconfig_path = path;
    }
    return tsconfig_path;
}
//# sourceMappingURL=index.js.map