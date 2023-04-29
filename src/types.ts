/**
 *
 * Types module
 *
 */

import mongoose from 'mongoose';

export namespace uranio {
  export type primary = string & {__brand: 'primary_key'};
  export type unique<T> = T;
  export type atom = object;
}

export type Atom = uranio.atom;

export type Shape<A extends Atom> = {
  [K in keyof ExcludeKeysOfType<ExcludeOptional<A>, uranio.primary>]: A[K];
} & {
  [K in keyof ExcludeKeysOfType<PickOptional<A>, uranio.primary>]?: A[K];
};

type ExcludeKeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? never : T[K];
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type ExcludeOptional<T> = Pick<T, RequiredKeys<T>>;

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type PickOptional<T> = Pick<T, OptionalKeys<T>>;

export type SelectParams<A extends Atom> = Partial<A>;

type SortOrder = 1 | -1 | 'asc' | 'desc' | 'ascending' | 'descending';

export type SelectOptions<A extends Atom> = {
  sort?: {[k in keyof A]: SortOrder};
  limit?: number;
  skip?: number;
};

export type AtomSchema = {};

export type DataAccessLayerParams = {
  atom_name: string;
  connection: mongoose.Connection;
  schema: AtomSchema;
};

/**
 * -------------------------
 */

export interface User extends uranio.atom {
  id: uranio.primary;
  username: uranio.unique<string>;
  first_name?: string;
  last_name?: string;
  age?: number;
}

// export type User = {
//   id: uranio.primary;
//   username: uranio.unique<string>;
//   first_name?: string;
//   last_name?: string;
//   age?: number;
// }

// function _asserts_id(_id:unknown):asserts _id is uranio.primary{
//   // TODO?
// }
// const id = '';
// _asserts_id(id);

// export const user:User = {
//   id,
//   username: '',
// }

// export const shape:Shape<User> = {
//   id: '' as uranio.primary,
//   username: '',
//   // first_name: ''
// };

// export const e:ExcludeKeysOfType<User, string> = {
//   id: '' as uranio.primary,
//   age: 0
// }
