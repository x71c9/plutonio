/**
 *
 * Types module
 *
 * @packageDocumentation
 *
 */

export type ProjectSchema = {
  [file_path: string]: FileSchema;
};

export type FileSchema = {
  imports?: Import[];
  interfaces?: Interfaces;
  types?: Types;
};

export type Import = {
  clause: string;
  module: string;
  specifiers: string[];
  text: string;
};

export type Interfaces = {
  [name: string]: Interface;
};

export type Interface = {
  extends: string[];
  full_text: string;
  properties: Properties;
  type: Primitive;
};

export type Types = {
  [name: string]: Type;
};

export type Type = {
  full_text: string;
  properties: Properties;
  type: Primitive;
  items?: Items;
};

export type Items = {
  type: Primitive | Primitive[];
};

export type Properties = {
  [k: string]: Property;
};

export type Property = {
  enum?: Primitive[];
  original?: string;
  properties?: Properties;
  type: Primitive;
};

export type Primitive =
  | 'any'
  | 'array'
  | 'boolean'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'undefined';
