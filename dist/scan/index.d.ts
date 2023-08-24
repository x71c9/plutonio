/**
 *
 * Generate module
 *
 */
import * as c from '../config/index';
export declare const atom_heritage_clause = "plutonio.atom";
export type GenerateOptions = {
    tsconfig_path?: string;
};
export type AtomSchemaAttributeType = keyof typeof c.primitive_types;
export type AtomSchemaAttribute = {
    type: AtomSchemaAttributeType;
    optional?: boolean;
    unique?: boolean;
    array?: boolean;
};
export type AtomSchema = {
    [k: string]: AtomSchemaAttribute;
};
export type AtomSchemas = {
    [k: string]: AtomSchema;
};
type Import = {
    text: string;
    module: string;
    clause?: string;
};
type Type = {
    text: string;
    name: string;
    properties: Property[];
};
type Interface = Type;
type Property = {
    name: string;
    value: string;
    type: string;
    optional?: boolean;
};
type SourceFileSchema = {
    imports: Import[];
    types: Type[];
    interfaces: Interface[];
};
export declare function scan(options?: GenerateOptions): Map<string, SourceFileSchema>;
export declare function printObjectWithCircular(obj: any, maxDepth?: number, currentDepth?: number, seen?: Set<any>, indent?: number): void;
export {};
