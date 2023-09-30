/**
 *
 * Content
 *
 */

// import * as t from '../client/types';
// import chalk from 'chalk';

export type MyType = {
  hello: string;
};

type MyOtherType = {};

namespace mynamespace {
  export type myexport = {
    world: MyOtherType;
  };
}

export interface MyInterface {
  what: mynamespace.myexport;
}

// export interface User extends t.plutonio.atom, MyInterface, chalk.ColorSupport {
// export interface User extends t.plutonio.atom, MyInterface {
//   username: t.plutonio.unique<string>;
//   first_name?: string;
//   last_name?: string;
//   age?: number;
//   // created_at: Date
// }

// const user:User = {
//   _id: '',
//   username: '',
//   // level: 0,
//   what: {
//     world: {}
//   }
// }

// export interface Product extends t.plutonio.atom {
//   title: string;
//   reference: t.Reference.AReference;
// }
