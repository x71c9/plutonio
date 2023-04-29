"use strict";
/**
 *
 * Client class
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlutonioClient = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connection_1 = require("./connection");
class PlutonioClient extends connection_1.ClientConnection {
    constructor() {
        super();
        this.connect();
        // TODO: Connection undefined
        this.user = _data_access_layer('user', this._connection, _get_schema(_get_property_definitions('user')));
    }
}
exports.PlutonioClient = PlutonioClient;
function _data_access_layer(atom_name, connection, schema) {
    const model = _create_model(atom_name, connection, schema);
    return {
        select: async (params, options) => {
            const sort = (options === null || options === void 0 ? void 0 : options.sort) ? options.sort : {};
            const response = await model
                .find(params, null, options)
                .sort(sort)
                .lean();
            return response;
        },
        get: async (id) => {
            const mon_find_by_id_res = await model
                .findById(id)
                .lean();
            if (!mon_find_by_id_res) {
                throw new Error('404');
            }
            return mon_find_by_id_res;
        },
        insert: async (atom_shape) => {
            const mon_model = new model(atom_shape);
            const mon_res_doc = await mon_model.save();
            const mon_obj = mon_res_doc.toObject();
            return _clean_atom(mon_obj);
        },
        update: async (id, partial_atom) => {
            const default_options = { new: true, lean: true };
            const $unset = _find_unsets(partial_atom);
            partial_atom = _clean_unset(partial_atom);
            const update = {
                $set: partial_atom,
                $unset: $unset,
            };
            // TODO: find primary key
            const mon_update_res = await model.findByIdAndUpdate({ id: id }, update, default_options);
            if (!mon_update_res) {
                throw new Error('404');
            }
            return mon_update_res;
        },
        delete: async (id) => {
            // TODO: find primary key
            const mon_delete_res = await model.findOneAndDelete({ id: id });
            if (!mon_delete_res) {
                throw new Error('404');
            }
            return _clean_atom(mon_delete_res.toObject());
        },
        count: async (params) => {
            const mon_count_res = await model.countDocuments(params).lean();
            return mon_count_res;
        },
    };
}
function _create_model(atom_name, connection, schema) {
    return connection.model(atom_name, schema);
}
function _get_schema(property_definitions) {
    const atom_schema_def = _generate_mongo_schema_definition(property_definitions);
    let atom_mongo_schema = new mongoose_1.default.Schema(atom_schema_def, {
        versionKey: false,
        strict: false,
    });
    return atom_mongo_schema;
}
function _generate_mongo_schema_definition(properties_definition) {
    let mongoose_schema_def = {};
    for (const [k, v] of Object.entries(properties_definition)) {
        mongoose_schema_def = {
            ...mongoose_schema_def,
            [k]: { ..._generate_mongoose_schema_type_options(v) },
        };
    }
    return mongoose_schema_def;
}
function _generate_mongoose_schema_type_options(prop_def) {
    let is_required = true;
    if (prop_def.optional && prop_def.optional === true) {
        is_required = false;
    }
    let schema_type_options = {
        type: undefined,
        required: is_required,
    };
    if (prop_def.unique && prop_def.unique === true) {
        schema_type_options = {
            ...schema_type_options,
            ...{ unique: true },
        };
    }
    switch (prop_def.type) {
        case 'primary': {
            schema_type_options = {
                ...schema_type_options,
                type: mongoose_1.default.Schema.Types.ObjectId,
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
function _generate_string_schema_options(schema_type_options) {
    schema_type_options = {
        ...schema_type_options,
        type: String,
        trim: true,
    };
    return schema_type_options;
}
function _generate_number_schema_options(schema_type_options) {
    schema_type_options = {
        ...schema_type_options,
        type: Number,
    };
    return schema_type_options;
}
function _get_property_definitions(atom_name) {
    const properties_definition = {
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
function _clean_atom(atom) {
    if ('__v' in atom) {
        delete atom.__v;
    }
    return atom;
}
function _find_unsets(_partial_atom) {
    const unsets = {};
    // const type_atom_props = atm_keys.get_bond(atom_name);
    // for(const [prop, value] of Object.entries(partial_atom)){
    //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
    //     unsets[prop] = 1;
    //   }
    // }
    return unsets;
}
function _clean_unset(partial_atom) {
    // const type_atom_props = atm_keys.get_bond(atom_name);
    // for(const [prop, value] of Object.entries(partial_atom)){
    //   if(type_atom_props.has(prop as keyof Partial<schema.AtomShape<A>>) && value === ''){
    //     delete partial_atom[prop as keyof Partial<schema.AtomShape<A>>];
    //   }
    // }
    return partial_atom;
}
//# sourceMappingURL=client.js.map