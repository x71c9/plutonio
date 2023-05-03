/**
 *
 * Content
 *
 */
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
export {};
