/**
 *
 * Data access layer module
 *
 */

import mongoose from 'mongoose';
import * as t from './types';

export class DataAccessLayer<A extends t.Atom> {
  public atom_name: string;
  private connection: mongoose.Connection;
  private schema: t.AtomSchema;
  constructor(params: t.DataAccessLayerParams) {
    this.atom_name = params.atom_name;
    this.connection = params.connection;
    this.schema = params.schema;
    const mongo_schema: mongoose.Schema = _generate_mongo_schema(this.schema);
    const model: mongoose.Model<mongoose.Document<A>> = this.connection.model<
      mongoose.Document<A>
    >(this.atom_name, mongo_schema);
  }
  public select(
    params: t.SelectParams<Atom>,
    options?: t.SelectOptions<Atom>
  ): Promise<t.Atom[]> {}
  public get(id: string): Promise<t.Atom> {}
  public insert(atom: t.Shape<Atom>): Promise<t.Atom> {}
  public update(
    id: string,
    parital_atom: Partial<t.Atom<T>>
  ): Promise<t.Atom<T>> {}
  public delete(id: string): Promise<t.Atom<T>> {}
  public count(params: t.SelectParams<T>): Promise<number> {}
}

function _generate_mongo_schema(atom_schema: t.AtomSchema): mongoose.Schema {
  const atom_schema_def =
    _generate_mongo_schema_definition(property_definitions);
  let atom_mongo_schema = new mongoose.Schema(atom_schema_def, {
    versionKey: false,
    strict: false,
  });
  return atom_mongo_schema;
}

function _generate_mongo_schema_definition(
  properties_definition: PropertyDefs
): mongoose.SchemaDefinition {
  let mongoose_schema_def = {};
  for (const [k, v] of Object.entries(properties_definition)) {
    mongoose_schema_def = {
      ...mongoose_schema_def,
      [k]: {..._generate_mongoose_schema_type_options(v)},
    };
  }
  return mongoose_schema_def;
}

function _generate_mongoose_schema_type_options(
  prop_def: PropertyDef
): mongoose.SchemaTypeOptions<any> {
  let is_required = true;
  if (prop_def.optional && prop_def.optional === true) {
    is_required = false;
  }
  let schema_type_options: mongoose.SchemaTypeOptions<any> = {
    type: undefined,
    required: is_required,
  };
  if (prop_def.unique && prop_def.unique === true) {
    schema_type_options = {
      ...schema_type_options,
      ...{unique: true},
    };
  }
  switch (prop_def.type) {
    case 'primary': {
      schema_type_options = {
        ...schema_type_options,
        type: mongoose.Schema.Types.ObjectId,
      };
      return schema_type_options;
    }
    case 'string': {
      return _generate_string_schema_options(schema_type_options);
    }
    case 'number': {
      return _generate_number_schema_options(schema_type_options);
    }
  }
}

function _generate_string_schema_options(
  schema_type_options: mongoose.SchemaTypeOptions<any>
): mongoose.SchemaTypeOptions<string> {
  schema_type_options = {
    ...schema_type_options,
    type: String,
    trim: true,
  };
  return schema_type_options;
}

function _generate_number_schema_options(
  schema_type_options: mongoose.SchemaTypeOptions<any>
): mongoose.SchemaTypeOptions<number> {
  schema_type_options = {
    ...schema_type_options,
    type: Number,
  };
  return schema_type_options;
}
