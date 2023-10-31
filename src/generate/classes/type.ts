/**
 *
 * Type class module
 *
 * @packageDocumentation
 *
 */

import path from 'path';
import ts from 'typescript';
import * as tjsg from 'ts-json-schema-generator';
import {ion} from '../../log/index.js';
import * as utils from '../../utils/index.js';
import * as types from '../types.js';
import {SourceFile} from './source_file.js';

export class Type {
  private wrap_node: types.NodeWrap;
  private tjsg_type_schema: tjsg.Schema;
  private tjsg_type_definition: tjsg.Schema;
  constructor(public name: string, public source_file?: SourceFile) {
    ion.trace(`Creating Type ${name} ...`);
    this.tjsg_type_schema = this._resolve_tjsg_schema();
    this.tjsg_type_definition = this._resolve_tjsg_definition();
    this.wrap_node = this._resolve_node();
  }
  public generate_schema(): types.TypeSchema {
    const text = this.wrap_node.node.getText();
    const original = typeof text === 'string' && text !== '' ? text : undefined;
    const type_schema: types.TypeSchema = {
      imports: this._resolve_imports(),
      name: this.name,
      type: _resolve_type(this.tjsg_type_definition, this.name),
      enum: _resolve_enum(this.tjsg_type_definition),
      original,
      properties: this._resolve_properties(),
      // properties: _resolve_all_properties(
      //   this.tjsg_type_definition,
      //   this.wrap_node.node,
      //   this.name,
      //   this.source_file
      // ),
    };
    return utils.no_undefined(type_schema);
  }
  private _resolve_properties(): types.Properties | undefined {
    const tjs_properties = this.tjsg_type_definition.properties;
    if (!tjs_properties) {
      return undefined;
    }
    let properties: types.Properties = {};
    for (const [key, value] of Object.entries(tjs_properties)) {
      if (typeof value === 'boolean') {
        continue;
      }
      // properties[key] = _resolve_property(value, node, name, key, source_file);
      const property = this._resolve_property(key, value);
      if (!property) {
        continue;
      }
      properties[key] = property;
    }
    return properties;
  }
  private _resolve_property_from_definition(ref_name: string) {
    return this.tjsg_type_schema.definitions?.[ref_name];
  }
  private _resolve_property(
    prop_name: string,
    prop_def: tjsg.Schema
  ): types.Property | undefined {
    if ('$ref' in prop_def) {
      const type_ref_name = _resolve_type_ref_name(prop_name, prop_def);
      const tjsg_property =
        this._resolve_property_from_definition(type_ref_name);
      if (!tjsg_property || typeof tjsg_property === 'boolean') {
        throw new Error(`Cannot find $ref property ${type_ref_name}`);
      }
      const type = new Type(prop_name);
      // console.log(tjsg_property);
      // const property:types.Property = {
      //   type: _resolve_type(tjsg_property, prop_name),
      //   enum: _resolve_enum(tjsg_property),
      //   // original?: string;
      //   // properties: this._resolve_properties(),

      // } as types.Property;
      // return property;
    }

    // const child_node = _resolve_property_signature_node(parent_node, key);
    // if ('$ref' in prop_def) {
    //   const type_ref_name = _resolve_type_ref_name(prop_def, key);
    //   const ref_source_file = _resolve_ref_source_file(
    //     type_ref_name,
    //     source_file,
    //     child_node
    //   );
    //   const property = _resolve_references_property(
    //     type_ref_name,
    //     ref_source_file
    //   );
    //   property.original = _resolve_original(child_node);
    //   return utils.no_undefined(property);
    // }
    // let property: types.Property = {
    //   type: _resolve_type(prop_def, `${parent_name}.${key}`),
    //   enum: _resolve_enum(prop_def.enum),
    //   original: _resolve_original(child_node),
    // };
    // return utils.no_undefined(property);
  }
  private _resolve_tjsg_schema(): tjsg.Schema {
    const tjsg_type_schema = this.source_file.tjsg_generator.createSchema(
      this.name
    );
    // console.log(JSON.stringify(tjsg_type_schema, null, 2));
    ion.debug(tjsg_type_schema);
    return tjsg_type_schema;
  }
  private _resolve_tjsg_definition(): tjsg.Schema {
    const definitions = this.tjsg_type_schema.definitions;
    if (!definitions || typeof definitions !== 'object') {
      throw new Error(`Missing tjsg definitions`);
    }
    const main_definition = definitions[this.name];
    if (!main_definition || typeof main_definition === 'boolean') {
      throw new Error(`Missing tjsg definition for ${this.name}`);
    }
    return main_definition;
  }
  private _resolve_node(): types.NodeWrap {
    if (this.source_file.nodes.has(this.name)) {
      return this.source_file.nodes.get(this.name) as types.NodeWrap;
    }
    throw new Error(`Cannot resolve node`);
  }
  private _resolve_imports(): types.Import[] {
    return this.source_file.imports;
  }
}

export function _resolve_original(node?: ts.Node): string | undefined {
  if (!node) {
    return undefined;
  }
  // TypeOperator: keyof, ...
  const type_operators = utils.get_nested_of_type(
    node,
    ts.SyntaxKind.TypeOperator
  );
  if (type_operators.length > 0 && type_operators[0]) {
    const type_op = type_operators[0];
    return type_op.getText();
  }
  // TypeReference: CustomType, ...
  const type_references = utils.get_nested_of_type(
    node,
    ts.SyntaxKind.TypeReference
  );
  if (type_references.length === 0 || !type_references[0]) {
    return undefined;
  }
  const type_ref = type_references[0];
  const text = type_ref.getText();
  if (typeof text !== 'string' || text === '') {
    return undefined;
  }
  return text;
}

function _resolve_type(definition: tjsg.Schema, name: string): types.Primitive {
  const type = definition.type;
  if (!type) {
    ion.error(`Cannot resolve 'type' for '${name}'`);
    ion.error(`Definition: `, definition);
    throw new Error(`Cannot resolve type`);
  }
  switch (type) {
    case 'string': {
      return 'string';
    }
    case 'number': {
      return 'number';
    }
    case 'boolean': {
      return 'boolean';
    }
    case 'object': {
      return 'object';
    }
    case 'integer': {
      return 'number';
    }
    case 'null': {
      return 'null';
    }
    case 'array': {
      return 'array';
    }
  }
  throw new Error(`Invalid definition type`);
}

// function _resolve_all_properties(
//   definition: tjsg.Schema,
//   node: ts.Node | undefined,
//   name: string,
//   source_file: SourceFile
// ) {
//   const tjs_properties = definition?.properties;
//   if (!tjs_properties) {
//     return undefined;
//   }
//   let properties: types.Properties = {};
//   for (const [key, value] of Object.entries(tjs_properties)) {
//     if (typeof value === 'boolean') {
//       continue;
//     }
//     properties[key] = _resolve_property(value, node, name, key, source_file);
//   }
//   return properties;
// }

// export function _resolve_property(
//   prop_def: tjsg.Schema,
//   parent_node: ts.Node | undefined,
//   parent_name: string,
//   key: string,
//   source_file: SourceFile
// ) {
//   const child_node = _resolve_property_signature_node(parent_node, key);
//   if ('$ref' in prop_def) {
//     const type_ref_name = _resolve_type_ref_name(prop_def, key);
//     const ref_source_file = _resolve_ref_source_file(
//       type_ref_name,
//       source_file,
//       child_node
//     );
//     const property = _resolve_references_property(
//       type_ref_name,
//       ref_source_file
//     );
//     property.original = _resolve_original(child_node);
//     return utils.no_undefined(property);
//   }
//   let property: types.Property = {
//     type: _resolve_type(prop_def, `${parent_name}.${key}`),
//     enum: _resolve_enum(prop_def.enum),
//     original: _resolve_original(child_node),
//   };
//   return utils.no_undefined(property);
// }

export function _resolve_ref_source_file(
  type_ref_name: string,
  source_file: SourceFile,
  node?: ts.Node
): SourceFile {
  const type = source_file.nodes.get(type_ref_name);
  if (type || !node) {
    return source_file;
  }
  const child_text = node.getText();
  for (const import_declaration of source_file.imports) {
    const clause = import_declaration.clause;
    if (child_text.indexOf(clause) !== -1) {
      const other_source_file_path = path.resolve(
        path.dirname(source_file.path),
        import_declaration.module + '.ts'
      );
      const other_source_file = new SourceFile(
        other_source_file_path,
        source_file.project
      );
      other_source_file.nodes.get(type_ref_name);
      return other_source_file;
    }
  }
  throw new Error(`Cannot find source file for ${type_ref_name}`);
}

function _resolve_type_ref_name(
  prop_name: string,
  prop_def: tjsg.Schema
): string {
  const ref = prop_def.$ref;
  if (typeof ref !== 'string' || ref === '') {
    throw new Error(`Invalid $ref value`);
  }
  if (ref[0] !== '#') {
    ion.warn(
      `Reference $ref for ${prop_name} doesn't start with #/definition/`
    );
    ion.warn(`Reference $ref for ${prop_name} is ${ref}`);
    throw new Error(`Wrong $ref value`);
  }
  const ref_name = ref.replace(`#/definitions/`, '');
  return ref_name;
}

export function _resolve_references_property(
  name: string,
  source_file: SourceFile
) {
  const type = new Type(name, source_file);
  return type.generate_schema();
}

export function _resolve_property_signature_node(
  node: ts.Node | undefined,
  name: string
): ts.Node | undefined {
  if (!node) {
    return undefined;
  }
  const property_signatures = utils.get_nested_of_type(
    node,
    ts.SyntaxKind.PropertySignature
  ) as ts.PropertySignature[];
  const prop_signature_map = new Map<string, ts.PropertySignature>();
  for (const prop_sign of property_signatures) {
    const identifiers = utils.get_nested_of_type(
      prop_sign,
      ts.SyntaxKind.Identifier
    ) as ts.Identifier[];
    const identifier = identifiers[0];
    if (!identifier) {
      throw new Error('Missing identifier for property signature');
    }
    const prop_name = identifier.getText();
    prop_signature_map.set(prop_name, prop_sign);
  }
  const prop_signature = prop_signature_map.get(name);
  if (!prop_signature) {
    return undefined;
    // throw new Error(`Cannot find property signature node`);
  }
  return prop_signature;
}

function _resolve_enum(definition: tjsg.Schema): types.Primitive[] | undefined {
  const enum_value = definition.enum;
  if (!enum_value) {
    return undefined;
  }
  // TODO Check all possibilities
  return enum_value as types.Primitive[];
}
