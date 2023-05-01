"use strict";
/**
 *
 * Atom schemas module
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.atom_schemas = void 0;
exports.atom_schemas = {
    user: {
        username: {
            type: 'string',
            unique: true,
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
    },
};
//# sourceMappingURL=atoms.js.map