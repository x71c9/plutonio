/**
 *
 * Type class module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as types from '../types.js';
import { SourceFile } from './source_file.js';
export declare class Type {
    name: string;
    source_file: SourceFile;
    private wrap_node;
    private tjsg_type_schema;
    private tjsg_type_definition;
    constructor(name: string, source_file: SourceFile);
    generate_schema(): types.TypeSchema;
    private _resolve_properties;
    private _resolve_property_from_definition;
    private _resolve_property;
    private _resolve_tjsg_schema;
    private _resolve_tjsg_definition;
    private _resolve_node;
    private _resolve_imports;
}
export declare function _resolve_original(node?: ts.Node): string | undefined;
export declare function _resolve_ref_source_file(type_ref_name: string, source_file: SourceFile, node?: ts.Node): SourceFile;
export declare function _resolve_references_property(name: string, source_file: SourceFile): types.TypeSchema;
export declare function _resolve_property_signature_node(node: ts.Node | undefined, name: string): ts.Node | undefined;
