#!/usr/bin/env node

import {program} from 'commander';
import {generate} from './generate/index';

program.name('plutonio');

program.command('generate').action(() => {
  const atom_schemas = generate();
  console.log(`ATOM_SCHEMAS: `, atom_schemas);
});

program.parse();
