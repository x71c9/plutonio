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
  [name: string]: Interface;
};

export type Enums = {
  [name: string]: Enum;
};

export const KIND = {
  TYPE: 'type',
  INTERFACE: 'interface',
  ENUM: 'enum',
} as const;

export type Kind = ObjectValue<typeof KIND>;

export type CommonAttributes = TypeAttributes & {
  name: string;
  kind: Kind;
};

export type Type = CommonAttributes;

export type Enum = CommonAttributes;

export type Interface = CommonAttributes & {
  extends?: string[];
};

// TODO
// export type Extend = {};

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

export const PRIMITIVE = {
  ARRAY: 'array',
  DATE: 'date',
  ENUM: 'enum',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  OBJECT: 'object',
  ANY: 'any',
  UNKNOWN: 'unknown',
  NULL: 'null',
  UNDEFINED: 'undefined',
  UNRESOLVED: 'unresolved',
};

export type Primitive = ObjectValue<typeof PRIMITIVE>;

export type Values = (string | number)[];

type ObjectValue<T> = T[keyof T];
