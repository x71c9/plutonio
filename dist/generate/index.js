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
const c = __importStar(require("../config/index"));
exports.atom_heritage_clause = 'plutonio.atom';
function generate(options) {
    log.trace('Generating...');
    const { program, checker } = _create_ts_program(options);
    const plutonio_source_files_map = _select_plutonio_source_files(program);
    const atom_schemas = _generate_atom_schemas(checker, plutonio_source_files_map);
    return atom_schemas;
}
exports.generate = generate;
function _generate_atom_schemas(checker, source_file_map) {
    log.trace(`Generating atom schemas from plutonio source files...`);
    const interfaces_map = _select_inherited_atom_interfaces(source_file_map);
    const atom_schemas = _generate_atom_schemas_from_interface_nodes(checker, interfaces_map);
    return atom_schemas;
}
function _generate_atom_schemas_from_interface_nodes(checker, interfaces_map) {
    const atom_schemas = {};
    for (const [interf, plutonio_name] of interfaces_map) {
        const { atom_name, atom_schema } = _generate_atom_schema(checker, interf, plutonio_name);
        atom_schemas[atom_name] = atom_schema;
    }
    return atom_schemas;
}
function _select_inherited_atom_interfaces(source_file_map) {
    log.trace(`Selecting inherited atom interfaces...`);
    const interfaces_map = new Map();
    for (const [source_file, plutonio_name] of source_file_map) {
        log.trace(source_file.fileName);
        typescript_1.default.forEachChild(source_file, _visit_node);
        function _visit_node(node) {
            if (_is_inherited_atom_interface_node(node)) {
                log.debug(`Added node: ${node.name.getText()}`);
                interfaces_map.set(node, plutonio_name);
            }
            typescript_1.default.forEachChild(node, _visit_node);
        }
    }
    return interfaces_map;
}
function _select_plutonio_source_files(program) {
    log.trace('Selecting SourceFile with imported Plutonio...');
    const plutonio_source_files_map = new Map();
    for (const source_file of program.getSourceFiles()) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        log.trace(source_file.fileName);
        typescript_1.default.forEachChild(source_file, _visit_node);
    }
    function _visit_node(node) {
        var _a;
        if (typescript_1.default.isImportDeclaration(node)) {
            const module_specifier = node.moduleSpecifier
                .getText()
                .replaceAll("'", '')
                .replaceAll('"', '');
            if (module_specifier === c.plutonio_package_name) {
                const source_file = node.getSourceFile();
                const import_clause = (_a = node.importClause) === null || _a === void 0 ? void 0 : _a.getText();
                if (typeof import_clause === 'string' && import_clause !== '') {
                    const splitted_import = import_clause.split(' ');
                    const plutonio_name = splitted_import[splitted_import.length - 1];
                    plutonio_source_files_map.set(source_file, plutonio_name);
                }
            }
        }
        typescript_1.default.forEachChild(node, _visit_node);
    }
    return plutonio_source_files_map;
}
function _generate_atom_schema(checker, interf, plutonio_name) {
    const name = interf.name.getText();
    const atom_name = _transform_atom_name(name);
    /**
     * Type is needed so that it gets also
     * all the inherited properties
     */
    const type = checker.getTypeAtLocation(interf);
    const properties = type.getProperties();
    const atom_schema = {};
    for (const property of properties) {
        const attribute_name = property.getName();
        if (c.inherited_atom_properties.includes(attribute_name)) {
            continue;
        }
        atom_schema[attribute_name] = _generate_atom_schema_attribute(checker, interf, property, plutonio_name);
    }
    return { atom_name, atom_schema };
}
function _generate_atom_schema_attribute(checker, interf, property, plutonio_name) {
    const property_type = checker.getTypeOfSymbolAtLocation(property, interf);
    const mapped_type = _map_type(checker, property_type);
    const type_string = checker.typeToString(property_type);
    // console.log("g", type_string);
    if (!mapped_type) {
        throw new Error(`Invalid Plutonio attribute type '${type_string}'`);
    }
    const atom_schema_attribute = {
        type: mapped_type,
    };
    if (_has_undefined(property_type)) {
        atom_schema_attribute.optional = true;
    }
    if (_atom_schema_attribute_is_unique(checker, property, plutonio_name)) {
        atom_schema_attribute.unique = true;
    }
    if (_is_array_type(property_type)) {
        atom_schema_attribute.array = true;
    }
    return atom_schema_attribute;
}
function _map_type(checker, type) {
    const type_string = checker.typeToString(type);
    const removed_undefined = type_string.replaceAll(' | undefined', '');
    const removed_array_brackets = removed_undefined
        .replaceAll('[', '')
        .replaceAll(']', '');
    const lower_removed_undefined = removed_array_brackets.toLowerCase();
    // console.log("map", type_string, removed_undefined, removed_array_brackets, lower_removed_undefined);
    if (lower_removed_undefined in c.primitive_types) {
        // string, number, boolean, date
        return lower_removed_undefined;
    }
    if (type.isStringLiteral()) {
        return 'string';
    }
    else if (type.isNumberLiteral()) {
        return 'number';
    }
    else if (type.isUnion()) {
        const types = type.types.map((t) => _map_type(checker, t));
        const defined_types = types.filter((t) => t !== undefined);
        if (defined_types.length > 1 &&
            !defined_types.every((t) => t === defined_types[0])) {
            throw new Error(`Union of different types is not allowed`);
        }
        if (defined_types.length === 0) {
            return undefined;
        }
        return defined_types[0];
    }
    return undefined;
}
function _is_array_type(type) {
    var _a, _b;
    if (type.isUnion()) {
        const is_array_types = type.types.map((t) => _is_array_type(t));
        const count = is_array_types.reduce((acc, curr) => (curr ? acc + 1 : acc), 0);
        if (count > is_array_types.length - 2) {
            return true;
        }
    }
    const value_declaration_text = (_b = (_a = type.getSymbol()) === null || _a === void 0 ? void 0 : _a.valueDeclaration) === null || _b === void 0 ? void 0 : _b.getText();
    return (value_declaration_text === null || value_declaration_text === void 0 ? void 0 : value_declaration_text.includes('ArrayConstructor')) === true;
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
function _atom_schema_attribute_is_unique(_checker, prop, plutonio_name) {
    var _a;
    const declaration_text = (_a = prop.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getText();
    if (declaration_text === null || declaration_text === void 0 ? void 0 : declaration_text.includes(`${plutonio_name}.${c.unique_type_name}`)) {
        return true;
    }
    return false;
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