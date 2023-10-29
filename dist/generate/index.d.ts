/**
 *
 * Generate index module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as types from '../types/index.js';
type GenerateParams = {
    tsconfig_path: string;
    source_file_path: string;
    type_name: string;
};
export declare function generate(params: GenerateParams): TypeSchema;
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
type GenerateOptions = {
    tsconfig_path: string;
};
export declare function _resolve_original(node?: ts.Node): string | undefined;
export declare function _generate(_options?: Partial<GenerateOptions>): void;
export declare class _Generator {
    private tjsg_schema_by_file;
    private tsconfig_path;
    private program;
    constructor(options?: Partial<GenerateOptions>);
    generate(): types.ProjectSchema;
    private _generate_tjsg_schema_map;
    private _create_ts_program;
    private _resolve_refs;
    private _resolve_definition_refs;
    private _generate_project_schema;
    private _resolve_file_schema;
    private _resolve_interfaces;
    private _generate_interface_schema;
    private _tjsg_schema;
    private _resolve_imports;
    private _resolve_types;
    private _generate_type_schema;
}
export {};
