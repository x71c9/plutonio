// import {resolve} from 'path';

import * as TJS from 'typescript-json-schema';

// optionally pass argument to schema generator
const settings: TJS.PartialArgs = {
  required: true,
  // uniqueNames: true,
};

// optionally pass ts compiler options
const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true,
};

// optionally pass a base path
const basePath = './';

const program = TJS.getProgramFromFiles(
  ['src/index.ts'],
  compilerOptions,
  basePath
);

// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, 'atom', settings);
console.log(`schema: `, schema);

// ... or a generator that lets us incrementally get more schemas

const generator = TJS.buildGenerator(program, settings);
if (!generator) {
  throw new Error('Undefined generator');
}

// generator can be also reused to speed up generating the schema if usecase allows:
const schemaWithReusedGenerator = TJS.generateSchema(
  program,
  'key',
  settings,
  [],
  generator
);
console.log(`schemaWithReusedGenerator: `, schemaWithReusedGenerator);

// all symbols
// const symbols = generator.getUserSymbols();
// console.log(`symbols: `, symbols);

// Get symbols for different types from generator.
const schema1 = generator.getSchemaForSymbol('atom');
// const schema2 = generator.getSchemaForSymbol('AnotherType');

console.log(`schema1: `, schema1);
// console.log(`schema2: `, schema2);

// const schemas = generator.getSchemaForSymbols(['*'], true);
// console.log(`schemas: `, schemas);
