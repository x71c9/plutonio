"use strict";
/**
 *
 * Utils module
 *
 * @packageDocumentation
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_nested_of_type = exports.no_undefined = void 0;
const typescript_1 = __importDefault(require("typescript"));
function no_undefined(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.no_undefined = no_undefined;
function get_nested_of_type(node, kind) {
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
        if (child.kind === typescript_1.default.SyntaxKind.ModuleDeclaration) {
            continue;
        }
        const nested_nodes = get_nested_of_type(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
exports.get_nested_of_type = get_nested_of_type;
//# sourceMappingURL=index.js.map