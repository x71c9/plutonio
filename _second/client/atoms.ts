/**
 *
 * Atom schemas module
 *
 */

import * as t from '../generate/index';

export const atom_schemas: t.AtomSchemas = {
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
