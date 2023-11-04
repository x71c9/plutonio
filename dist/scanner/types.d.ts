/**
 *
 * Types index module
 *
 * @packageDocumentation
 */
export type Scanned = {
    [source_file_path: string]: SourceFile;
};
export type SourceFile = {
    imports?: Imports;
    types?: Types;
    interfaces?: Interfaces;
    enums?: Enums;
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
export type Enums = {
    [name: string]: Enum;
};
export declare const KIND: {
    readonly TYPE: "type";
    readonly INTERFACE: "interface";
    readonly ENUM: "enum";
};
export type Kind = ObjectValue<typeof KIND>;
export type CommonAttributes = TypeAttributes & {
    name: string;
    kind: Kind;
};
export type Type = CommonAttributes;
export type Enum = CommonAttributes;
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
    item?: TypeAttributes;
    values?: Values;
    properties?: Properties;
};
export declare const PRIMITIVE: {
    ARRAY: string;
    ENUM: string;
    BOOLEAN: string;
    NUMBER: string;
    STRING: string;
    OBJECT: string;
    ANY: string;
    UNKNOWN: string;
    NULL: string;
    UNDEFINED: string;
};
export type Primitive = ObjectValue<typeof PRIMITIVE>;
export type Values = (string | number)[];
type ObjectValue<T> = T[keyof T];
export {};
