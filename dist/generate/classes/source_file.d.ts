/**
 *
 * SourceFile class module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import * as tjsg from 'ts-json-schema-generator';
import * as types from '../types.js';
import { Project } from './project.js';
import { Type } from './type.js';
export declare class SourceFile {
    path: string;
    project: Project;
    types: Map<string, Type>;
    nodes: Map<string, types.NodeWrap>;
    imports: types.Import[];
    source: ts.SourceFile;
    tjsg_generator: tjsg.SchemaGenerator;
    constructor(path: string, project: Project);
    get_type(type_name: string): Type;
    private _create_tjsg_generator;
    private _resolve_source;
    private _resolve_nodes;
    private _resolve_imports;
}
