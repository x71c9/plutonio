/**
 *
 * Data access layer module
 *
 */
import mongoose from 'mongoose';
import * as t from './types';
export declare class DataAccessLayer<A extends t.Atom> {
    model: mongoose.Model<mongoose.Document<A>>;
    constructor(params: t.DataAccessLayerParams);
    select(params: t.QueryParams<A>, options?: t.QueryOptions<A>): Promise<A[]>;
    get(id: string): Promise<A>;
    insert(shape: t.Shape<A>): Promise<A>;
    update(id: string, partial_atom: Partial<t.Shape<A>>): Promise<A>;
    delete(id: string): Promise<A>;
    count(params: t.QueryParams<A>): Promise<number>;
}
