/**
 *
 * Types index module
 *
 * @packageDocumentation
 */
export type Scanned = {
    [source_file_path: string]: {
        imports: Imports;
        types: Types;
        interfaces: Interfaces;
    };
};
export type Imports = {
    [module: string]: Import;
};
export type Import = {
    clause: string;
    module: string;
    specifiers: string[];
    text: string;
};
export type Types = {
    [name: string]: Type;
};
export type Interfaces = {
    [name: string]: Interace;
};
export declare const KIND: {
    readonly TYPE: "type";
    readonly INTERFACE: "interface";
};
export type Kind = ObjectValue<typeof KIND>;
export type CommonAttributes = TypeAttributes & {
    name: string;
    kind: Kind;
};
export type Type = CommonAttributes;
export type Interace = CommonAttributes & {
    extends?: Extend[];
};
export type Extend = {};
export type Properties = {
    [k: string]: TypeAttributes;
};
export type TypeAttributes = {
    original: string;
    primitive: Primitive;
    array: boolean;
    enum?: Enum[];
    properties?: Properties;
};
export declare const PRIMITIVE: {
    BOOLEAN: string;
    NUMBER: string;
    STRING: string;
    OBJECT: string;
    ANY: string;
    UNKOWN: string;
    NULL: string;
    UNDEFINED: string;
};
export type Primitive = ObjectValue<typeof PRIMITIVE>;
export type Enum = string[] | number[] | [true, false] | (string | number | boolean)[];
type ObjectValue<T> = T[keyof T];
export {};
