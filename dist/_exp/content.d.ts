/**
 *
 * Content
 *
 */
import * as t from '../client/types';
export type MyType = {
    hello: string;
};
type MyOtherType = {};
declare namespace mynamespace {
    type myexport = {
        world: MyOtherType;
    };
}
export interface MyInterface {
    what: mynamespace.myexport;
}
export interface User extends t.plutonio.atom, MyInterface {
    username: t.plutonio.unique<string>;
    first_name?: string;
    last_name?: string;
    age?: number;
}
export interface Product extends t.plutonio.atom {
    title: string;
    reference: t.Reference.AReference;
}
export {};
