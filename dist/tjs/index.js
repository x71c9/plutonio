"use strict";
// import {resolve} from 'path';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const TJS = __importStar(require("typescript-json-schema"));
// optionally pass argument to schema generator
const settings = {
    required: true,
    // uniqueNames: true,
};
// optionally pass ts compiler options
const compilerOptions = {
    strictNullChecks: true,
};
// optionally pass a base path
const basePath = './';
const program = TJS.getProgramFromFiles(['src/index.ts'], compilerOptions, basePath);
// We can either get the schema for one file and one type...
const schema = TJS.generateSchema(program, 'atom', settings);
console.log(`schema: `, schema);
// ... or a generator that lets us incrementally get more schemas
const generator = TJS.buildGenerator(program, settings);
if (!generator) {
    throw new Error('Undefined generator');
}
// generator can be also reused to speed up generating the schema if usecase allows:
const schemaWithReusedGenerator = TJS.generateSchema(program, 'key', settings, [], generator);
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
//# sourceMappingURL=index.js.map