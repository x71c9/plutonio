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
    const types = _get_types(source_file);
    const interfaces = _get_interfaces(source_file);
    for (const t of types) {
        const name = t.name.getText();
        console.log(`Generating schema for type ${name}...`);
        const type_schema = _generate_schema(program, name, 'type');
        schemas[name] = type_schema;
    }
    for (const i of interfaces) {
        const name = i.name.getText();
        console.log(`Generating schema for interface ${name}...`);
        const interface_schema = _generate_schema(program, name, 'interface');
        schemas[name] = interface_schema;
    }
    return schemas;
}
function _generate_schema(program, name, category) {
    const partial_args = {
        ref: false
    };
    const tjs_schema = tjs.generateSchema(program, name, partial_args);
    tjs_schema === null || tjs_schema === void 0 ? true : delete tjs_schema.$schema;
    const schema = {
        category,
        ...tjs_schema
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
            log.trace(`Found ${typescript_1.default.SyntaxKind[kind]}: ${child.name.getText()}`);
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
//# sourceMappingURL=index.js.map