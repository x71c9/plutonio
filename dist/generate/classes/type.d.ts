/**
 *
 * Type class module
 *
 * @packageDocumentation
 *
 */
import * as types from '../types.js';
import { SourceFile } from './source_file.js';
export declare class Type {
    name: string;
    source_file: SourceFile;
    private node;
    private tjsg_type_schema;
    private tjsg_type_definition;
    constructor(name: string, source_file: SourceFile);
    generate_schema(): types.TypeSchema;
    private _resolve_tjsg_schema;
    private _resolve_tjsg_definition;
    private _resolve_node;
    private _resolve_imports;
}
