/**
 *
 * Data access layer module
 *
 */

import {atom_schemas} from './atoms';

import mongoose from 'mongoose';

import * as client_types from './types';

import * as t from '../generate/index';

// export namespace dal {
export type unique<A> = A;
// }

export class DataAccessLayer<A extends client_types.Atom> {
  public model: mongoose.Model<mongoose.Document<A>>;
  constructor(params: client_types.DataAccessLayerParams) {
    this.model = _create_model(params);
  }
  public async select(
    params: client_types.QueryParams<A>,
    options?: client_types.QueryOptions<A>
  ): Promise<A[]> {
    const sort = options?.sort ? options.sort : {};
    const atoms = await this.model
      .find(params, null, options)
      .sort(sort)
      .lean<A[]>();
    return _clean_atoms(atoms);
  }
  public async get(id: string): Promise<A> {
    const atom = await this.model.findById<A>(id).lean<A>();
    if (!atom) {
      throw new Error('404');
    }
    return _clean_atom(atom);
  }
  public async insert(shape: client_types.Shape<A>): Promise<A> {
    const mon_model = new this.model(shape);
    const mon_res_doc = await mon_model.save();
    const atom = mon_res_doc.toObject() as A;
    return _clean_atom(atom);
  }
  public async update(
    id: string,
    partial_atom: Partial<client_types.Shape<A>>
  ): Promise<A> {
    const default_options: mongoose.QueryOptions = {new: true, lean: true};
    const $unset = _find_unsets(partial_atom);
    partial_atom = _clean_unset(partial_atom);
    const update = {
      $set: partial_atom,
      $unset: $unset,
    };
    const atom = await this.model.findByIdAndUpdate<A>(
      {_id: id},
      update,
      default_options
    );
    if (!atom) {
      throw new Error('404');
    }
    return _clean_atom(atom);
  }
  public async delete(id: string): Promise<A> {
    const atom = await this.model.findOneAndDelete<A>({_id: id});
    if (!atom) {
      throw new Error('404');
    }
    return _clean_atom(atom);
  }
  public async count(params: client_types.QueryParams<A>): Promise<number> {
    const count_number = await this.model.countDocuments(params).lean<number>();
    return count_number;
  }
}

function _create_model<A extends client_types.Atom>(
  params: client_types.DataAccessLayerParams
): mongoose.Model<mongoose.Document<A>> {
  const mongo_schema: mongoose.Schema = _generate_mongo_schema(
    params.atom_name
  );
  const model = params.connection.model<mongoose.Document<A>>(
    params.atom_name,
    mongo_schema
  );
  return model;
}

function _generate_mongo_schema(atom_name: string): mongoose.Schema {
  if (!(atom_name in atom_schemas)) {
  }
  const atom_schema = atom_schemas[atom_name];
  // TODO: fail if not found
  const atom_schema_def = _generate_mongo_schema_definition(atom_schema);
  let atom_mongo_schema = new mongoose.Schema(atom_schema_def, {
    versionKey: false,
    strict: false,
  });
  return atom_mongo_schema;
}

function _generate_mongo_schema_definition(
  atom_schema: t.AtomSchema
): mongoose.SchemaDefinition {
  let mongoose_schema_def = {};
  for (const [k, v] of Object.entries(atom_schema)) {
    mongoose_schema_def = {
      ...mongoose_schema_def,
      [k]: {..._generate_mongoose_schema_type_options(v)},
    };
  }
  // console.log(mongoose_schema_def);
  return mongoose_schema_def;
}

function _generate_mongoose_schema_type_options(
  atom_schema_attribute: t.AtomSchemaAttribute
): mongoose.SchemaTypeOptions<any> {
  let is_required = true;
  if (
    atom_schema_attribute.optional &&
    atom_schema_attribute.optional === true
  ) {
    is_required = false;
  }
  let schema_type_options: mongoose.SchemaTypeOptions<any> = {
    type: undefined,
    required: is_required,
  };
  if (atom_schema_attribute.unique && atom_schema_attribute.unique === true) {
    schema_type_options = {
      ...schema_type_options,
      ...{unique: true},
    };
  }
  switch (atom_schema_attribute.type) {
    // case 'primary': {
    //   schema_type_options = {
    //     ...schema_type_options,
    //     type: mongoose.Schema.Types.ObjectId,
    //   };
    //   return schema_type_options;
    // }
    case 'string': {
      return _generate_string_schema_options(schema_type_options);
    }
    case 'number': {
      return _generate_number_schema_options(schema_type_options);
    }
    case 'boolean': {
      return _generate_boolean_schema_options(schema_type_options);
    }
    // case 'object': {
    //   return _generate_object_schema_options(schema_type_options);
    // }
    // default: {
    //   throw new Error('type not found');
    // }
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

function _generate_boolean_schema_options(
  schema_type_options: mongoose.SchemaTypeOptions<any>
): mongoose.SchemaTypeOptions<number> {
  schema_type_options = {
    ...schema_type_options,
    type: Boolean,
  };
  return schema_type_options;
}

// function _generate_object_schema_options(
//   schema_type_options: mongoose.SchemaTypeOptions<any>
// ): mongoose.SchemaTypeOptions<Object> {
//   schema_type_options = {
//     ...schema_type_options,
//     type: Object,
//   };
//   return schema_type_options;
// }

function _clean_atoms<A extends client_types.Atom>(atoms: A[]): A[] {
  const cleaned_atoms: A[] = [];
  for (const atom of atoms) {
    cleaned_atoms.push(_clean_atom(atom));
  }
  return cleaned_atoms;
}

function _clean_atom<A extends client_types.Atom>(atom: A): A {
  if ('__v' in atom) {
    delete (atom as any).__v;
  }
  atom._id = atom._id.toString();
  // TODO: better clone
  const atom_obj = JSON.parse(JSON.stringify(atom));
  return atom_obj;
}

function _find_unsets<A extends client_types.Atom>(
  _partial_atom: Partial<client_types.Shape<A>>
) {
  const unsets = {};
  // const type_atom_props = atm_keys.get_bond(atom_name);
  // for(const [prop, value] of Object.entries(partial_atom)){
  //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
  //     unsets[prop] = 1;
  //   }
  // }
  return unsets;
}

function _clean_unset<A extends client_types.Atom>(
  partial_atom: Partial<client_types.Shape<A>>
) {
  // const type_atom_props = atm_keys.get_bond(atom_name);
  // for(const [prop, value] of Object.entries(partial_atom)){
  //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
  //     delete partial_atom[prop as keyof Partial<schema.AtomShape<A>>];
  //   }
  // }
  return partial_atom;
}
