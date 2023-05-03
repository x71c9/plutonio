"use strict";
/**
 *
 * Data access layer module
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataAccessLayer = void 0;
const atoms_1 = require("./atoms");
const mongoose_1 = __importDefault(require("mongoose"));
class DataAccessLayer {
    constructor(params) {
        this.model = _create_model(params);
    }
    async select(params, options) {
        const sort = (options === null || options === void 0 ? void 0 : options.sort) ? options.sort : {};
        const atoms = await this.model
            .find(params, null, options)
            .sort(sort)
            .lean();
        return _clean_atoms(atoms);
    }
    async get(id) {
        const atom = await this.model.findById(id).lean();
        if (!atom) {
            throw new Error('404');
        }
        return _clean_atom(atom);
    }
    async insert(shape) {
        const mon_model = new this.model(shape);
        const mon_res_doc = await mon_model.save();
        const atom = mon_res_doc.toObject();
        return _clean_atom(atom);
    }
    async update(id, partial_atom) {
        const default_options = { new: true, lean: true };
        const $unset = _find_unsets(partial_atom);
        partial_atom = _clean_unset(partial_atom);
        const update = {
            $set: partial_atom,
            $unset: $unset,
        };
        const atom = await this.model.findByIdAndUpdate({ _id: id }, update, default_options);
        if (!atom) {
            throw new Error('404');
        }
        return _clean_atom(atom);
    }
    async delete(id) {
        const atom = await this.model.findOneAndDelete({ _id: id });
        if (!atom) {
            throw new Error('404');
        }
        return _clean_atom(atom);
    }
    async count(params) {
        const count_number = await this.model.countDocuments(params).lean();
        return count_number;
    }
}
exports.DataAccessLayer = DataAccessLayer;
function _create_model(params) {
    const mongo_schema = _generate_mongo_schema(params.atom_name);
    const model = params.connection.model(params.atom_name, mongo_schema);
    return model;
}
function _generate_mongo_schema(atom_name) {
    if (!(atom_name in atoms_1.atom_schemas)) {
    }
    const atom_schema = atoms_1.atom_schemas[atom_name];
    // TODO: fail if not found
    const atom_schema_def = _generate_mongo_schema_definition(atom_schema);
    let atom_mongo_schema = new mongoose_1.default.Schema(atom_schema_def, {
        versionKey: false,
        strict: false,
    });
    return atom_mongo_schema;
}
function _generate_mongo_schema_definition(atom_schema) {
    let mongoose_schema_def = {};
    for (const [k, v] of Object.entries(atom_schema)) {
        mongoose_schema_def = {
            ...mongoose_schema_def,
            [k]: { ..._generate_mongoose_schema_type_options(v) },
        };
    }
    // console.log(mongoose_schema_def);
    return mongoose_schema_def;
}
function _generate_mongoose_schema_type_options(atom_schema_attribute) {
    let is_required = true;
    if (atom_schema_attribute.optional &&
        atom_schema_attribute.optional === true) {
        is_required = false;
    }
    let schema_type_options = {
        type: undefined,
        required: is_required,
    };
    if (atom_schema_attribute.unique && atom_schema_attribute.unique === true) {
        schema_type_options = {
            ...schema_type_options,
            ...{ unique: true },
        };
    }
    switch (atom_schema_attribute.type) {
        case 'string': {
            schema_type_options = {
                ...schema_type_options,
                type: atom_schema_attribute.array === true ? [String] : String,
                trim: true,
            };
            return schema_type_options;
        }
        case 'number': {
            schema_type_options = {
                ...schema_type_options,
                type: atom_schema_attribute.array === true ? [Number] : Number,
            };
            return schema_type_options;
        }
        case 'boolean': {
            schema_type_options = {
                ...schema_type_options,
                type: atom_schema_attribute.array === true ? [Boolean] : Boolean,
            };
            return schema_type_options;
        }
        case 'date': {
            schema_type_options = {
                ...schema_type_options,
                type: atom_schema_attribute.array === true ? [Date] : Date,
            };
            return schema_type_options;
        }
        case 'any': {
            schema_type_options = {
                ...schema_type_options,
                type: atom_schema_attribute.array === true
                    ? [mongoose_1.default.Schema.Types.Mixed]
                    : mongoose_1.default.Schema.Types.Mixed,
            };
            return schema_type_options;
        }
    }
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
function _clean_atoms(atoms) {
    const cleaned_atoms = [];
    for (const atom of atoms) {
        cleaned_atoms.push(_clean_atom(atom));
    }
    return cleaned_atoms;
}
function _clean_atom(atom) {
    if ('__v' in atom) {
        delete atom.__v;
    }
    atom._id = atom._id.toString();
    // TODO: better clone
    const atom_obj = JSON.parse(JSON.stringify(atom));
    return atom_obj;
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
//# sourceMappingURL=dal.js.map