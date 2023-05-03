/**
 *
 * Data access layer module
 *
 */
import mongoose from 'mongoose';
import * as client_types from './types';
export declare class DataAccessLayer<A extends client_types.Atom> {
    model: mongoose.Model<mongoose.Document<A>>;
    constructor(params: client_types.DataAccessLayerParams);
    select(params: client_types.QueryParams<A>, options?: client_types.QueryOptions<A>): Promise<A[]>;
    get(id: string): Promise<A>;
    insert(shape: client_types.Shape<A>): Promise<A>;
    update(id: string, partial_atom: Partial<client_types.Shape<A>>): Promise<A>;
    delete(id: string): Promise<A>;
    count(params: client_types.QueryParams<A>): Promise<number>;
}
