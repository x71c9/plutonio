/**
 *
 * Project class module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
import { SourceFile } from './source_file.js';
export declare class Project {
    tsconfig_path: string;
    source_files: Map<string, SourceFile>;
    program: ts.Program;
    constructor(tsconfig_path: string);
    get_source_file(source_file_path: string): SourceFile;
}
