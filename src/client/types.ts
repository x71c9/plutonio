/**
 *
 * Types module
 *
 */

import mongoose from 'mongoose';

export namespace plutonio {
  // export type primary = string & {__brand: 'primary_key'};
  export type unique<T> = T;
  export type atom = {
    _id: string;
  };
}

export type Atom = plutonio.atom;

export type Shape<A extends Atom> = ExcludeId<A>;

type ExcludeId<T extends object> = Omit<T, '_id'>;

// export type Shape<A extends Atom> = {
//   [K in keyof ExcludeKeysOfType<ExcludeOptional<A>, plutonio.primary>]: A[K];
// } & {
//   [K in keyof ExcludeKeysOfType<PickOptional<A>, plutonio.primary>]?: A[K];
// };

// type ExcludeKeysOfType<T, U> =  Omit<T, {
//   [K in keyof T]: T[K] extends U ? K : never;
// }[keyof T]>;

// type RequiredKeys<T> = {
//   [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
// }[keyof T];

// type ExcludeOptional<T> = Pick<T, RequiredKeys<T>>;

// type OptionalKeys<T> = {
//   [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
// }[keyof T];

// type PickOptional<T> = Pick<T, OptionalKeys<T>>;

export type QueryParams<A extends Atom> = Partial<A>;

type SortOrder = 1 | -1 | 'asc' | 'desc' | 'ascending' | 'descending';

export type QueryOptions<A extends Atom> = {
  sort?: {[k in keyof A]: SortOrder};
  limit?: number;
  skip?: number;
};

export type DataAccessLayerParams = {
  atom_name: string;
  connection: mongoose.Connection;
};

/**
 * -------------------------
 */

export interface User extends plutonio.atom {
  username: plutonio.unique<string>;
  first_name?: string;
  last_name?: string;
  age?: number;
  // created_at: Date
}

// export type User = {
//   id: plutonio.primary;
//   username: plutonio.unique<string>;
//   first_name?: string;
//   last_name?: string;
//   age?: number;
//   created_at: Date
// }

// function _asserts_id(_id:unknown):asserts _id is plutonio.primary{
//   // TODO?
// }
// const id = '';
// _asserts_id(id);

// export const user:User = {
//   id,
//   username: '',
// }

// export const shape:Shape<User> = {
//   id: '' as plutonio.primary,
//   username: '',
//   // first_name: ''
// };

// export const e:ExcludeKeysOfType<User, string> = {
//   id: '' as plutonio.primary,
//   age: 0
// }

export namespace Reference {
  export type AReference = {
    whatever: number;
  };
}
