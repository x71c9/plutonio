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
exports.generate = exports.atom_heritage_clause = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const log = __importStar(require("../log/index"));
exports.atom_heritage_clause = 'plutonio.atom';
function generate(options) {
    const { program, checker } = _create_ts_program(options);
    const nodes = _get_all_inherited_atom_interface_nodes(program);
    const atom_schemas = _generate_atom_schemas(nodes, checker);
    return atom_schemas;
}
exports.generate = generate;
function _get_all_inherited_atom_interface_nodes(program) {
    const interfaces = new Set();
    for (const source_file of program.getSourceFiles()) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        log.trace(source_file.fileName);
        typescript_1.default.forEachChild(source_file, _visit_node);
    }
    function _visit_node(node) {
        if (_is_inherited_atom_interface_node(node)) {
            log.debug(`Added node: ${node.name.getText()}`);
            interfaces.add(node);
        }
        typescript_1.default.forEachChild(node, _visit_node);
    }
    return Array.from(interfaces);
}
function _generate_atom_schemas(nodes, checker) {
    const atom_schemas = {};
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const { atom_name, atom_schema } = _generate_atom_schema(node, checker);
        atom_schemas[atom_name] = atom_schema;
    }
    return atom_schemas;
}
function _generate_atom_schema(node, checker) {
    const node_type = checker.getTypeAtLocation(node.name);
    // console.log(node_type.getBaseTypes()?.[0]?.aliasSymbol);
    const symbol = node_type.getSymbol();
    if (!symbol) {
        throw new Error('cannot find symbol');
    }
    const name = symbol.getName();
    const atom_name = _transform_atom_name(name);
    // const members_text = node.members.map(m => m.getText());
    const properties = node_type.getProperties();
    const atom_schema = {};
    for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        const property_type = checker.getTypeOfSymbolAtLocation(prop, node);
        const symbol_string = checker.symbolToString(prop);
        // TODO better check real attribute
        if (symbol_string === '_id') {
            continue;
        }
        atom_schema[symbol_string] = _generate_atom_schema_attribute(property_type, checker);
    }
    return { atom_name, atom_schema };
}
function _generate_atom_schema_attribute(property_type, checker) {
    const property_type_string = checker.typeToString(property_type, undefined, typescript_1.default.TypeFormatFlags.InTypeAlias);
    const atom_schema_attribute = {
        type: _get_atom_schema_attribute_type(property_type_string),
    };
    if (_atom_schema_attribute_is_optional(property_type_string)) {
        atom_schema_attribute.optional = true;
    }
    if (_atom_schema_attribute_is_unique(property_type_string)) {
        atom_schema_attribute.unique = true;
    }
    return atom_schema_attribute;
}
function _atom_schema_attribute_is_unique(_p) {
    // TODO implement with real type
    return false;
}
function _atom_schema_attribute_is_optional(property_type_string) {
    if (property_type_string.includes('undefined')) {
        return true;
    }
    return false;
}
function _get_atom_schema_attribute_type(property_type_string) {
    // TODO: Better implementation
    // What about:
    // 0 | 1 | 2
    // 'a' | 'b'
    // true
    // other types?
    if (property_type_string.includes('string')) {
        return 'string';
    }
    if (property_type_string.includes('number')) {
        return 'number';
    }
    if (property_type_string.includes('boolean')) {
        return 'boolean';
    }
    if (property_type_string.includes('{')) {
        return 'object';
    }
    throw new Error(`Invalid property type: ${property_type_string}`);
}
function _transform_atom_name(name) {
    return name.toLowerCase();
}
function _is_inherited_atom_interface_node(node) {
    var _a;
    if (!typescript_1.default.isInterfaceDeclaration(node)) {
        return false;
    }
    const heritage_clause = (_a = node.heritageClauses) === null || _a === void 0 ? void 0 : _a[0];
    if (!heritage_clause) {
        return false;
    }
    const heritage_children = heritage_clause.getChildren();
    const heritage_first_child = heritage_children === null || heritage_children === void 0 ? void 0 : heritage_children[0];
    if (!heritage_first_child) {
        return false;
    }
    const heritage_text = heritage_clause.getText();
    if (heritage_text.includes(exports.atom_heritage_clause)) {
        return true;
    }
    return false;
}
function _create_ts_program(options) {
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