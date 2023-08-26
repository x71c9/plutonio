#!/usr/bin/env node

import {program} from 'commander';
import {generate} from './generate/index';
import {scan} from './scan/index';
import {resolve} from './resolve/index';

program.name('plutonio');

program.command('generate').action(() => {
  const atom_schemas = generate();
  console.log(`ATOM_SCHEMAS: `, atom_schemas);
});

program.command('scan').action(() => {
  const schemas = scan();
  console.log(`SCHEMAS: `, schemas);
});

program.command('resolve').action(() => {
  const resolved = resolve();
  console.log(`resolved: `, resolved);
});

program.parse();
