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
export declare function read(options?: GenerateOptions): void;
