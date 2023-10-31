/**
 *
 * Utils module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
export function no_undefined(obj) {
    return JSON.parse(JSON.stringify(obj));
}
export function get_nested_of_type(node, kind) {
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
        const nested_nodes = get_nested_of_type(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
//# sourceMappingURL=index.js.map