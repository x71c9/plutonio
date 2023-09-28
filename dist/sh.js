#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const index_1 = require("./generate/index");
const index_2 = require("./scan/index");
const index_3 = require("./resolve/index");
const index_4 = require("./read/index");
commander_1.program.name('plutonio');
commander_1.program.command('generate').action(() => {
    const atom_schemas = (0, index_1.generate)();
    console.log(`ATOM_SCHEMAS: `, atom_schemas);
});
commander_1.program.command('scan').action(() => {
    const schemas = (0, index_2.scan)();
    console.log(`SCHEMAS: `, schemas);
});
commander_1.program.command('resolve').action(() => {
    const resolved = (0, index_3.resolve)();
    console.log(`resolved: `, resolved);
});
commander_1.program.command('read').action(() => {
    const readed = (0, index_4.read)();
    console.log(`read: `, readed);
});
commander_1.program.parse();
//# sourceMappingURL=sh.js.map