#!/usr/bin/env node

import {program} from 'commander';
import {generate} from './generate/index';
import {scan} from './scan/index';
import {read} from './read/index';

program.name('plutonio');

program.command('generate').action(() => {
  const atom_schemas = generate();
  console.log(`ATOM_SCHEMAS: `, atom_schemas);
});

program.command('scan').action(() => {
  const schemas = scan();
  console.log(`SCHEMAS: `, schemas);
});

program.command('read').action(() => {
  const readed = read();
  console.log(
    `SCHEMAS: `,
    JSON.stringify(Object.fromEntries(readed.entries()), null, 2)
  );
});

program.parse();
