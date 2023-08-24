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
exports.printObjectWithCircular = exports.scan = exports.atom_heritage_clause = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const log = __importStar(require("../log/index"));
exports.atom_heritage_clause = 'plutonio.atom';
// const valid_kind_name = ['InterfaceDeclaration', 'TypeAliasDeclaration'];
function scan(options) {
    log.trace('Scanning...');
    const { program, checker } = _create_ts_program(options);
    const schemas = _scan_all_files(program, checker);
    for (const [key, schema] of schemas) {
        console.log(key);
        log.info(schema);
    }
    return schemas;
}
exports.scan = scan;
function _scan_all_files(program, checker) {
    const schema_map = new Map();
    for (const source_file of program.getSourceFiles()) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        log.debug(`Scanning ${source_file.fileName}...`);
        const import_declarations = _get_import_declaration(source_file);
        const types = _get_types(source_file);
        const interfaces = _get_interfaces(source_file);
        const source_file_schema = _generate_source_file_schema(checker, import_declarations, types, interfaces);
        schema_map.set(source_file.fileName, source_file_schema);
    }
    return schema_map;
}
function _generate_source_file_schema(checker, import_nodes, type_nodes, interface_nodes) {
    const imports = [];
    for (let i = 0; i < import_nodes.length; i++) {
        imports.push(_generate_import(import_nodes[i]));
    }
    const types = [];
    for (let i = 0; i < type_nodes.length; i++) {
        types.push(_generate_type(checker, type_nodes[i]));
    }
    const interfaces = [];
    for (let i = 0; i < interface_nodes.length; i++) {
        interfaces.push(_generate_interface(checker, interface_nodes[i]));
    }
    return {
        imports,
        types,
        interfaces,
    };
}
function _generate_interface(checker, type_node) {
    const text = type_node.getText();
    const name = type_node.name.getText();
    const properties = _generate_properties(checker, type_node);
    return {
        text,
        name,
        properties,
    };
}
function _generate_type(checker, type_node) {
    const text = type_node.getText();
    const name = type_node.name.getText();
    const properties = _generate_properties(checker, type_node);
    return {
        text,
        name,
        properties,
    };
}
function _generate_properties(checker, type_node) {
    const type = checker.getTypeAtLocation(type_node);
    // console.log(type);
    const node_properties = type.getProperties();
    // console.log(node_properties);
    const properties = [];
    for (const node_property of node_properties) {
        const property = _generate_property(checker, node_property, type_node);
        properties.push(property);
    }
    return properties;
}
function _generate_property(checker, node_property, node) {
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
function _get_symbol_type(checker, symbol, node) {
    const property_type = checker.getTypeOfSymbolAtLocation(symbol, node);
    const type_string = checker.typeToString(property_type);
    return type_string;
}
function _get_property_value(node, name, node_property) {
    let value = '';
    const property_signature = _get_property_of_name(node, name);
    if (!property_signature) {
        value = _get_imported_property(name, node_property);
        return value;
    }
    const children = property_signature.getChildren();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typescript_1.default.isIdentifier(child)) {
            continue;
        }
        if (typescript_1.default.SyntaxKind.QuestionToken === child.kind) {
            continue;
        }
        if (typescript_1.default.SyntaxKind.ColonToken === child.kind) {
            continue;
        }
        // TypeReference, BooleanKeyword, ArrayType, ...
        return child.getText();
    }
    return value;
}
function _get_imported_property(name, node_property) {
    const member = node_property.parent.members.get(name);
    const declaration = member.valueDeclaration.type;
    const text = declaration.getText();
    return text;
}
function _get_property_of_name(node, name) {
    const children = node.getChildren();
    if (typescript_1.default.isTypeAliasDeclaration(node)) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (typescript_1.default.SyntaxKind.TypeLiteral === child.kind) {
                const type_litteral_children = child.getChildren();
                for (let j = 0; j < type_litteral_children.length; j++) {
                    if (typescript_1.default.SyntaxKind.SyntaxList === type_litteral_children[j].kind) {
                        const syntax_children = type_litteral_children[j].getChildren();
                        for (let k = 0; k < syntax_children.length; k++) {
                            const identi = _get_first_identifier(syntax_children[k]);
                            if ((identi === null || identi === void 0 ? void 0 : identi.getText()) === name) {
                                return syntax_children[k];
                            }
                        }
                    }
                }
            }
        }
    }
    else if (typescript_1.default.isInterfaceDeclaration(node)) {
        for (let i = 0; i < children.length; i++) {
            if (children[i].kind === typescript_1.default.SyntaxKind.SyntaxList) {
                const syntax_children = children[i].getChildren();
                for (let j = 0; j < syntax_children.length; j++) {
                    if (syntax_children[j].kind === typescript_1.default.SyntaxKind.PropertySignature) {
                        const identi = _get_first_identifier(syntax_children[j]);
                        if ((identi === null || identi === void 0 ? void 0 : identi.getText()) === name) {
                            return syntax_children[j];
                        }
                    }
                }
            }
        }
    }
    return null;
}
function _get_first_identifier(node) {
    const childern = node.getChildren();
    for (let i = 0; i < childern.length; i++) {
        if (childern[i].kind === typescript_1.default.SyntaxKind.Identifier) {
            return childern[i];
        }
    }
    return null;
}
function _is_attribute_optional(checker, symbol, node) {
    const property_type = checker.getTypeOfSymbolAtLocation(symbol, node);
    const has_undefined = _has_undefined(property_type);
    return has_undefined === true ? true : undefined;
}
function _has_undefined(type) {
    if (type.isUnion() && type.types.some(_has_undefined)) {
        return true;
    }
    else if (type.intrinsicName === 'undefined') {
        // TODO Better implementation
        return true;
    }
    return false;
}
function _generate_import(import_node) {
    var _a;
    const text = import_node.getText();
    const module = import_node.moduleSpecifier
        .getText()
        .replaceAll("'", '')
        .replaceAll('"', '');
    let clause;
    const import_clause = (_a = import_node.importClause) === null || _a === void 0 ? void 0 : _a.getText();
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
function printObjectWithCircular(obj, maxDepth = 8, currentDepth = 0, seen = new Set(), indent = 2) {
    if (currentDepth > maxDepth) {
        console.log(`${" ".repeat(indent * currentDepth)}[Reached maximum depth]`);
        return;
    }
    if (typeof obj === 'object' && obj !== null) {
        if (seen.has(obj)) {
            console.log(`${" ".repeat(indent * currentDepth)}[Circular Reference]`);
            return;
        }
        seen.add(obj);
        for (const key in obj) {
            if (typeof obj[key] !== 'function') {
                console.log(`${" ".repeat(indent * currentDepth)}${key}:`);
                printObjectWithCircular(obj[key], maxDepth, currentDepth + 1, seen, indent);
            }
        }
        seen.delete(obj);
    }
    else {
        if (typeof obj === 'function') {
            console.log(`${" ".repeat(indent * currentDepth)}[FUNCTION]`);
        }
        else {
            console.log(`${" ".repeat(indent * currentDepth)}${obj}`);
        }
    }
}
exports.printObjectWithCircular = printObjectWithCircular;
//# sourceMappingURL=index.js.map