/**
 *
 * Scanner index module
 *
 * @packageDocumentation
 *
 */
import path from 'path';
import ts from 'typescript';
export function scanner() {
    var _a;
    const tsconfig_path = `/home/x71c9/repos/plutonio/builder/tsconfig.json`;
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
    const checker = program.getTypeChecker();
    const source_files = program.getSourceFiles();
    for (const source_file of source_files) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        const interfaces = _get_nested(source_file, ts.SyntaxKind.InterfaceDeclaration);
        for (const inter of interfaces) {
            const inter_type = checker.getTypeAtLocation(inter);
            // const base_types = inter_type.getBaseTypes();
            // const symbol = checker.getSymbolAtLocation(inter);
            console.log((_a = inter_type.getSymbol()) === null || _a === void 0 ? void 0 : _a.escapedName);
        }
    }
}
function _get_nested(node, kind) {
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
        const nested_nodes = _get_nested(child, kind);
        nodes = nodes.concat(nested_nodes);
    }
    return nodes;
}
//# sourceMappingURL=index.js.map