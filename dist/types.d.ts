/**
 *
 * Types module
 *
 */
import mongoose from 'mongoose';
export declare namespace plutonio {
    type unique<T> = T;
    type atom = {
        _id: string;
    };
}
export type Atom = plutonio.atom;
export type Shape<A extends Atom> = ExcludeId<A>;
type ExcludeId<T extends object> = Omit<T, '_id'>;
export type QueryParams<A extends Atom> = Partial<A>;
type SortOrder = 1 | -1 | 'asc' | 'desc' | 'ascending' | 'descending';
export type QueryOptions<A extends Atom> = {
    sort?: {
        [k in keyof A]: SortOrder;
    };
    limit?: number;
    skip?: number;
};
export type AtomSchemaAttributeType = 'primary' | 'string' | 'number' | 'boolean';
export type AtomSchemaAttribute = {
    type: AtomSchemaAttributeType;
    optional?: boolean;
    unique?: boolean;
};
export type AtomSchema = {
    [k: string]: AtomSchemaAttribute;
};
export type DataAccessLayerParams = {
    atom_name: string;
    connection: mongoose.Connection;
};
export type AtomSchemas = {
    [k: string]: AtomSchema;
};
/**
 * -------------------------
 */
export interface User extends plutonio.atom {
    username: plutonio.unique<string>;
    first_name?: string;
    last_name?: string;
    age?: number;
}
export {};
