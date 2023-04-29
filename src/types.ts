/**
 *
 * Types module
 *
 */

export namespace uranio {
  export type primary = string & {__brand: 'PrimaryKey'};
  export type unique<T> = T;
}

export type User = {
  id: uranio.primary;
  username: uranio.unique<string>;
  first_name?: string;
  last_name?: string;
  age?: number;
};
