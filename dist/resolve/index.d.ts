/**
 *
 * Resolve module
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
export declare function resolve(options?: GenerateOptions): void;
export declare function printObjectWithCircular(obj: any, maxDepth?: number, currentDepth?: number, seen?: Set<any>, indent?: number): void;
export declare function assertNever(value: any): never;
export type ReferenceType = {};
export interface ReferenceTypeMap {
    [refName: string]: ReferenceType;
}
