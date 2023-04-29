/**
 *
 * Client class
 *
 */

import mongoose from 'mongoose';

import {ClientConnection} from './connection';
import {User} from './types';

export class PlutonioClient extends ClientConnection {
  public user: DataAccessLayer<User>;
  constructor() {
    super();
    this.connect();
    // TODO: Connection undefined
    this.user = _data_access_layer<User>(
      'user',
      this._connection!,
      _get_schema(_get_property_definitions('user'))
    );
  }
}

function _data_access_layer<T extends object>(
  atom_name: string,
  connection: mongoose.Connection,
  schema: mongoose.Schema
): DataAccessLayer<T> {
  const model: mongoose.Model<mongoose.Document<T>> = _create_model<T>(
    atom_name,
    connection,
    schema
  );
  return {
    select: async (
      params: SelectParams<T>,
      options?: SelectOptions<T>
    ): Promise<Atom<T>[]> => {
      const sort = options?.sort ? options.sort : {};
      const response = await model
        .find(params, null, options)
        .sort(sort)
        .lean<Atom<T>[]>();
      return response;
    },
    get: async (id: string): Promise<Atom<T>> => {
      const mon_find_by_id_res = await model
        .findById<Atom<T>>(id)
        .lean<Atom<T>>();
      if (!mon_find_by_id_res) {
        throw new Error('404');
      }
      return mon_find_by_id_res;
    },
    insert: async (atom_shape: AtomShape<T>): Promise<Atom<T>> => {
      const mon_model = new model(atom_shape);
      const mon_res_doc = await mon_model.save();
      const mon_obj = mon_res_doc.toObject() as Atom<T>;
      return _clean_atom<T>(mon_obj);
    },
    update: async (
      id: string,
      partial_atom: Partial<Atom<T>>
    ): Promise<Atom<T>> => {
      const default_options: mongoose.QueryOptions = {new: true, lean: true};
      const $unset = _find_unsets(partial_atom);
      partial_atom = _clean_unset(partial_atom);
      const update = {
        $set: partial_atom,
        $unset: $unset,
      };
      // TODO: find primary key
      const mon_update_res = await model.findByIdAndUpdate<Atom<T>>(
        {id: id},
        update,
        default_options
      );
      if (!mon_update_res) {
        throw new Error('404');
      }
      return mon_update_res;
    },
    delete: async (id: string): Promise<Atom<T>> => {
      // TODO: find primary key
      const mon_delete_res = await model.findOneAndDelete({id: id});
      if (!mon_delete_res) {
        throw new Error('404');
      }
      return _clean_atom(mon_delete_res.toObject() as Atom<T>);
    },
    count: async (params: SelectParams<T>): Promise<number> => {
      const mon_count_res = await model.countDocuments(params).lean<number>();
      return mon_count_res;
    },
  };
}

function _create_model<T>(
  atom_name: string,
  connection: mongoose.Connection,
  schema: mongoose.Schema
): mongoose.Model<mongoose.Document<T>> {
  return connection.model<mongoose.Document<T>>(atom_name, schema);
}

function _get_schema(property_definitions: PropertyDefs): mongoose.Schema {
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

type PropertyDefs = {
  [k: string]: PropertyDef;
};

type PropertyDef = {
  type: 'string' | 'number' | 'primary';
  optional?: boolean;
  unique?: boolean;
};

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

function _get_property_definitions(atom_name: string): PropertyDefs {
  const properties_definition: PropertyDefs = {
    id: {
      type: 'primary',
      optional: true,
    },
    username: {
      unique: true,
      type: 'string',
    },
    first_name: {
      type: 'string',
      optional: true,
    },
    last_name: {
      type: 'string',
      optional: true,
    },
    age: {
      type: 'number',
      optional: true,
    },
  };
  switch (atom_name) {
    case 'user': {
      return properties_definition;
    }
  }
  return properties_definition;
}

// function _clean_atoms<T extends object>(atoms: Atom<T>[]): Atom<T>[] {
//   const cleaned_atoms: Atom<T>[] = [];
//   for (const atom of atoms) {
//     cleaned_atoms.push(_clean_atom(atom));
//   }
//   return cleaned_atoms;
// }

function _clean_atom<T extends object>(atom: Atom<T>): Atom<T> {
  if ('__v' in atom) {
    delete (atom as any).__v;
  }
  return atom;
}

function _find_unsets<T extends object>(_partial_atom: Partial<AtomShape<T>>) {
  const unsets = {};
  // const type_atom_props = atm_keys.get_bond(atom_name);
  // for(const [prop, value] of Object.entries(partial_atom)){
  //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
  //     unsets[prop] = 1;
  //   }
  // }
  return unsets;
}

function _clean_unset<T extends object>(partial_atom: Partial<AtomShape<T>>) {
  // const type_atom_props = atm_keys.get_bond(atom_name);
  // for(const [prop, value] of Object.entries(partial_atom)){
  //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
  //     delete partial_atom[prop as keyof Partial<schema.AtomShape<A>>];
  //   }
  // }
  return partial_atom;
}
