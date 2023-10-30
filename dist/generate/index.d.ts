/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as tjsg from 'ts-json-schema-generator';
type GenerateParams = {
    tsconfig_path: string;
    source_file_path: string;
    type_name: string;
};
export declare function generate(params: GenerateParams): TypeSchema;
export declare class Generator {
    projects: Map<string, Project>;
    constructor();
    get_project(tsconfig_path: string): Project;
    generate(params: GenerateParams): TypeSchema;
}
declare class Project {
    tsconfig_path: string;
    source_files: Map<string, SourceFile>;
    program: ts.Program;
    constructor(tsconfig_path: string);
    get_source_file(source_file_path: string): SourceFile;
}
type NodeType = {
    type: 'type' | 'interface';
    node: ts.Node;
};
declare class SourceFile {
    path: string;
    project: Project;
    types: Map<string, Type>;
    nodes: Map<string, NodeType>;
    imports: Import[];
    source: ts.SourceFile;
    tjsg_generator: tjsg.SchemaGenerator;
    constructor(path: string, project: Project);
    get_type(type_name: string): Type;
    private _create_tjsg_generator;
    private _resolve_source;
    private _resolve_nodes;
    private _resolve_imports;
}
type TypeSchema = Property & {
    name: string;
    imports: Import[];
};
type Import = {
    clause: string;
    module: string;
    specifiers: string[];
    text: string;
};
type Properties = {
    [k: string]: Property;
};
type Property = {
    type: Primitive;
    original?: string;
    enum?: Primitive[];
    properties?: Properties;
};
type Primitive = 'any' | 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string' | 'undefined';
declare class Type {
    name: string;
    source_file: SourceFile;
    private node;
    private tjsg_type_schema;
    private tjsg_type_definition;
    constructor(name: string, source_file: SourceFile);
    generate_schema(): TypeSchema;
    private _resolve_tjsg_schema;
    private _resolve_tjsg_definition;
    private _resolve_node;
    private _resolve_imports;
    private _resolve_enum;
}
export declare function _resolve_original(node?: ts.Node): string | undefined;
export {};
