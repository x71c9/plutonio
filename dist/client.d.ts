/**
 *
 * Client class
 *
 */
import mongoose from 'mongoose';
import { ClientConnection } from './connection';
import { User, uranio } from './types';
type ExcludeKeysOfType<T, U> = {
    [K in keyof T]: T[K] extends U ? never : K;
}[keyof T];
type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
type ExcludeOptional<T> = Pick<T, RequiredKeys<T>>;
type OptionalKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
type PickOptional<T> = Pick<T, OptionalKeys<T>>;
type Atom<T extends object> = T;
type AtomShape<T extends object> = {
    [K in ExcludeKeysOfType<ExcludeOptional<T>, uranio.primary>]: T[K];
} & {
    [K in ExcludeKeysOfType<PickOptional<T>, uranio.primary>]?: T[K];
};
type SelectParams<T extends object> = Partial<Atom<T>>;
type SelectOptions<T extends object> = {
    sort?: {
        [k in keyof T]: mongoose.SortOrder;
    };
    limit?: number;
    skip?: number;
};
type DataAccessLayer<T extends object> = {
    select: (params: SelectParams<T>, options?: SelectOptions<T>) => Promise<Atom<T>[]>;
    get: (id: string) => Promise<Atom<T>>;
    insert: (atom: AtomShape<T>) => Promise<Atom<T>>;
    update: (id: string, parital_atom: Partial<Atom<T>>) => Promise<Atom<T>>;
    delete: (id: string) => Promise<Atom<T>>;
    count: (params: SelectParams<T>) => Promise<number>;
};
export declare class PlutonioClient extends ClientConnection {
    user: DataAccessLayer<User>;
    constructor();
}
export {};
