/**
 *
 * Atom schemas module
 *
 */

import * as t from './types';

export const atom_schemas: t.AtomSchemas = {
  user: {
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
  },
};
