"use strict";
/**
 *
 * Generate module
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const tjs = __importStar(require("typescript-json-schema"));
const log = __importStar(require("../log/index"));
function read(options) {
    log.trace('Reading...');
    const { program } = _create_ts_program(options);
    const schemas = _read_all_files(program);
    console.log(schemas);
    return schemas;
}
exports.read = read;
function _read_all_files(program) {
    const schemas_by_file = new Map();
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
function _resolve_schema_for(program, source_file) {
    const schemas = {};
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
        const type_schema = _generate_schema(program, name, 'type');
        schemas[name] = type_schema;
        schemas[name].full_text = full_text;
    }
    for (const i of interfaces) {
        const name = i.name.getText();
        console.log(`Generating schema for interface ${name}...`);
        const full_text = i.getFullText();
        const interface_schema = _generate_schema(program, name, 'interface');
        schemas[name] = interface_schema;
        schemas[name].full_text = full_text;
        schemas[name].extends = _get_heritage(i);
    }
    return schemas;
}
function _get_heritage(i) {
    const heritage_clauses = _get_syntax_kind(i, typescript_1.default.SyntaxKind.HeritageClause);
    let expressions = [];
    for (const heritage_clause of heritage_clauses) {
        const expression_with_typed_arguments = _get_syntax_kind(heritage_clause, typescript_1.default.SyntaxKind.ExpressionWithTypeArguments);
        expressions = expressions.concat(expression_with_typed_arguments);
    }
    return expressions.map(e => e.getText());
}
function _generate_schema(program, name, category) {
    const partial_args = {
        ref: false,
    };
    const tjs_schema = tjs.generateSchema(program, name, partial_args);
    tjs_schema === null || tjs_schema === void 0 ? true : delete tjs_schema.$schema;
    const schema = {
        category,
        ...tjs_schema,
    };
    return schema;
}
function _get_types(source_file) {
    return _get_syntax_kind(source_file, typescript_1.default.SyntaxKind.TypeAliasDeclaration);
}
function _get_interfaces(source_file) {
    return _get_syntax_kind(source_file, typescript_1.default.SyntaxKind.InterfaceDeclaration);
}
function _get_syntax_kind(node, kind) {
    const children = node.getChildren();
    let nodes = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.kind === kind) {
            let any_child = child;
            let name = any_child.name
                ? any_child.name.getText()
                : any_child.getText();
            log.trace(`Found ${typescript_1.default.SyntaxKind[kind]}: ${name}`);
            nodes.push(child);
        }
        // Do not check types and interfaces inside namespaces.
        // typescript-json-schema won't work with them
        if (child.kind === typescript_1.default.SyntaxKind.ModuleDeclaration) {
            continue;
        }
        const nested_nodes = _get_syntax_kind(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
function _create_ts_program(options) {
    log.trace('Creating Typescript program...');
    let tsconfig_path = _get_default_tsconfig_path();
    if (typeof (options === null || options === void 0 ? void 0 : options.tsconfig_path) === 'string' &&
        (options === null || options === void 0 ? void 0 : options.tsconfig_path) !== '') {
        tsconfig_path = options.tsconfig_path;
    }
    const config_file = typescript_1.default.readConfigFile(tsconfig_path, typescript_1.default.sys.readFile);
    const config_object = config_file.config;
    const parse_result = typescript_1.default.parseJsonConfigFileContent(config_object, typescript_1.default.sys, path_1.default.dirname(tsconfig_path));
    const compilerOptions = parse_result.options;
    const rootNames = parse_result.fileNames;
    const create_program_options = {
        rootNames: rootNames,
        options: compilerOptions,
    };
    const program = typescript_1.default.createProgram(create_program_options);
    const checker = program.getTypeChecker();
    return { program, checker };
}
function _get_default_tsconfig_path() {
    return './tsconfig.json';
}
function _get_import_declaration(source_file) {
    const children = source_file.getChildren()[0].getChildren(); // SyntaxList
    const import_declarations = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.kind === typescript_1.default.SyntaxKind.ImportDeclaration) {
            log.trace(`Found ImportDeclaration: ${child.getText()}`);
            import_declarations.push(child);
        }
    }
    return import_declarations;
}
function _generate_import(import_node) {
    const text = import_node.getText();
    const module = import_node.moduleSpecifier
        .getText()
        .replaceAll("'", '')
        .replaceAll('"', '');
    // import * as plutonio from 'plutonio'
    const namespace_imports = _get_syntax_kind(import_node, typescript_1.default.SyntaxKind.NamespaceImport);
    if (namespace_imports.length > 0) {
        const namespace_import = namespace_imports[0];
        const identifiers = _get_syntax_kind(namespace_import, typescript_1.default.SyntaxKind.Identifier);
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
    const import_specifiers = _get_syntax_kind(import_node, typescript_1.default.SyntaxKind.ImportSpecifier);
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
    const import_clauses = _get_syntax_kind(import_node, typescript_1.default.SyntaxKind.ImportClause);
    const import_clause = import_clauses[0];
    const clause = import_clause.getText();
    return {
        text,
        module,
        clause,
        specifiers: [],
    };
}
//# sourceMappingURL=index.js.map