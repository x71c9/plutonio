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
let checker;
export function scanner() {
    const tsconfig_path = `/Users/x71c9/repos/plutonio/builder/tsconfig.json`;
    const config_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile);
    const config_object = config_file.config;
    const parse_result = ts.parseJsonConfigFileContent(config_object, ts.sys, path.dirname(tsconfig_path));
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
    for (const source_file of source_files) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        const types = _get_nested_children(source_file, ts.SyntaxKind.TypeAliasDeclaration);
        // const interfaces = _get_nested_children(
        //   source_file,
        //   ts.SyntaxKind.InterfaceDeclaration
        // ) as ts.InterfaceDeclaration[];
        const scanned_types = {};
        for (const typ of types) {
            const type_name = _get_name(typ);
            scanned_types[type_name] = _resolve_type(typ, type_name);
        }
        console.log(JSON.stringify(scanned_types, null, 2));
        // const scanned_interfaces:t.Interfaces = {};
        // for (const inter of interfaces) {
        //   const inter_name = _get_name(inter);
        //   console.log(inter_name);
        //   scanned_interfaces[inter_name] = _resolve_interface(inter);
        // }
    }
}
function _resolve_type(node, name) {
    const scanned_type = {
        name,
        kind: t.KIND.TYPE,
        primitive: _resolve_primitive(node),
        array: _resolve_array(node),
        properties: _resolve_properties(node),
        original: '',
        enum: [],
        // original: _resolve_original(),
        // enum: _resolve_enum(),
        // properties: undefined,
    };
    return utils.no_undefined(scanned_type);
}
function _resolve_properties(node) {
    let properties;
    const type_literal = _get_first_level_child(node, ts.SyntaxKind.TypeLiteral);
    if (!type_literal) {
        return properties;
    }
    const syntax_list = _get_first_level_child(type_literal, ts.SyntaxKind.SyntaxList);
    if (!syntax_list) {
        return properties;
    }
    properties = {};
    const property_signatures = _get_first_level_children(syntax_list, ts.SyntaxKind.PropertySignature);
    for (const property_signature of property_signatures) {
        const property_name = _get_name(property_signature);
        properties[property_name] = _resolve_property(property_signature);
    }
    return properties;
}
function _resolve_property(property) {
    const type_attribute = {
        original: '',
        // original: _resolve_original(property),
        primitive: _resolve_primitive(property),
        array: _resolve_array(property),
        enum: [],
        // enum: _resolve_enum(property),
        properties: _resolve_properties(property),
    };
    return utils.no_undefined(type_attribute);
}
function _resolve_array(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.ArrayType)) {
        return true;
    }
    return false;
}
function _resolve_primitive(node) {
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
    return t.PRIMITIVE.UNKOWN;
}
function _node_type_is_object(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.TypeLiteral)) {
        return true;
    }
    return false;
}
function _node_type_is_boolean(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.BooleanKeyword)) {
        return true;
    }
    return false;
}
function _node_type_is_number(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.NumberKeyword)) {
        return true;
    }
    return false;
}
function _node_type_is_string(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.StringKeyword)) {
        return true;
    }
    return false;
}
function _node_type_is_any(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.AnyKeyword)) {
        return true;
    }
    return false;
}
function _node_type_is_null(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.NullKeyword)) {
        return true;
    }
    return false;
}
function _node_type_is_undefined(node) {
    if (_has_first_level_child(node, ts.SyntaxKind.UndefinedKeyword)) {
        return true;
    }
    return false;
}
// function _resolve_interface(node: ts.InterfaceDeclaration): t.Interace {
// }
export function _get_name(node) {
    const symbol = checker.getSymbolAtLocation(node.name);
    return String(symbol === null || symbol === void 0 ? void 0 : symbol.escapedName);
}
export function _get_nested_children(node, kind) {
    const children = node.getChildren();
    let nodes = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) {
            continue;
        }
        if (child.kind === kind) {
            nodes.push(child);
        }
        const nested_nodes = _get_nested_children(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
export function _has_first_level_child(node, kind) {
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
export function _get_first_level_child(node, kind) {
    const children = node.getChildren();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) {
            continue;
        }
        if (child.kind === kind) {
            return child;
        }
    }
    return undefined;
}
export function _get_first_level_children(node, kind) {
    const children = node.getChildren();
    const nodes = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child) {
            continue;
        }
        if (child.kind === kind) {
            nodes.push(child);
        }
    }
    return nodes;
}
//# sourceMappingURL=index.js.map