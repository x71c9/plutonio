/**
 *
 * SourceFile class module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as tjsg from 'ts-json-schema-generator';
import { ion } from '../log/index.js';
import * as utils from '../utils/index.js';
import { Type } from './type.js';
export class SourceFile {
    constructor(path, project) {
        this.path = path;
        this.project = project;
        this.types = new Map();
        this.nodes = new Map();
        this.imports = [];
        ion.trace(`Creating SourceFile ${path} ...`);
        this.tjsg_generator = this._create_tjsg_generator();
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
    _create_tjsg_generator() {
        ion.trace(`Creating ts json schema generator...`);
        const config = {
            tsconfig: this.project.tsconfig_path,
            path: this.path,
            skipTypeCheck: true,
            sortProps: true,
            // expose: 'none',
            // type: '*',
        };
        return tjsg.createGenerator(config);
    }
    _resolve_source() {
        ion.trace(`Getting ts SourceFile...`);
        const source_file = this.project.program.getSourceFile(this.path);
        if (!source_file) {
            throw new Error(`Cannot find source file ${this.path}`);
        }
        return source_file;
    }
    _resolve_nodes() {
        ion.trace(`Resolving SourceFile nodes...`);
        // Interface
        const interface_nodes = utils.get_nested_of_type(this.source, ts.SyntaxKind.InterfaceDeclaration);
        for (const interface_node of interface_nodes) {
            const name = interface_node.name.getText();
            this.nodes.set(name, {
                type: 'interface',
                node: interface_node,
            });
        }
        // Type
        const type_nodes = utils.get_nested_of_type(this.source, ts.SyntaxKind.TypeAliasDeclaration);
        for (const type_node of type_nodes) {
            const name = type_node.name.getText();
            this.nodes.set(name, {
                type: 'type',
                node: type_node,
            });
        }
    }
    _resolve_imports() {
        ion.trace(`Resolving SourceFile imports...`);
        this.imports = [];
        const import_declarations = utils.get_nested_of_type(this.source, ts.SyntaxKind.ImportDeclaration);
        for (const import_declaration of import_declarations) {
            const import_parts = _generate_import_schema(import_declaration);
            this.imports.push(import_parts);
        }
    }
}
function _generate_import_schema(import_node) {
    const text = import_node.getText();
    const module = import_node.moduleSpecifier
        .getText()
        .replaceAll("'", '')
        .replaceAll('"', '');
    // import * as plutonio from 'plutonio'
    const namespace_imports = utils.get_nested_of_type(import_node, ts.SyntaxKind.NamespaceImport);
    if (namespace_imports.length > 0 && namespace_imports[0]) {
        const namespace_import = namespace_imports[0];
        const identifiers = utils.get_nested_of_type(namespace_import, ts.SyntaxKind.Identifier);
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
    const import_specifiers = utils.get_nested_of_type(import_node, ts.SyntaxKind.ImportSpecifier);
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
    const import_clauses = utils.get_nested_of_type(import_node, ts.SyntaxKind.ImportClause);
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
//# sourceMappingURL=source_file.js.map