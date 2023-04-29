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
const mongoose_1 = __importDefault(require("mongoose"));
class DataAccessLayer {
    constructor(params) {
        this.atom_name = params.atom_name;
        this.connection = params.connection;
        this.schema = params.schema;
        const mongo_schema = _generate_mongo_schema(this.schema);
        this.model = this.connection.model(this.atom_name, mongo_schema);
    }
    async select(params, options) {
        const sort = (options === null || options === void 0 ? void 0 : options.sort) ? options.sort : {};
        const response = await this.model
            .find(params, null, options)
            .sort(sort)
            .lean();
        return response;
    }
    get(id) { }
    insert(atom) { }
    update(id, parital_atom) { }
    delete(id) { }
    count(params) { }
}
exports.DataAccessLayer = DataAccessLayer;
function _generate_mongo_schema(atom_schema) {
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
//# sourceMappingURL=dal.js.map