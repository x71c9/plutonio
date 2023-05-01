/**
 *
 * Generate module
 *
 */
export declare const atom_heritage_clause = "plutonio.atom";
export type GenerateOptions = {
    tsconfig_path?: string;
};
export type AtomSchemaAttributeType = 'string' | 'number' | 'boolean' | 'object';
export type AtomSchemaAttribute = {
    type: AtomSchemaAttributeType;
    optional?: boolean;
    unique?: boolean;
};
export type AtomSchema = {
    [k: string]: AtomSchemaAttribute;
};
export type AtomSchemas = {
    [k: string]: AtomSchema;
};
export declare function generate(options?: GenerateOptions): AtomSchemas;
