"use strict";
/**
 *
 * Index module
 *
 */
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
const plutonio = __importStar(require("./main"));
exports.default = plutonio;
const base_path = `./adiacenti/builder`;
const scanned = plutonio.scan(`${base_path}/tsconfig.json`);
// const imports = scanned[`${base_path}/src/index.ts`]?.imports;
// const type = scanned[`${base_path}/src/index.ts`]?.interfaces?.['Something'];
console.log(JSON.stringify(scanned, null, 2));
// console.log(JSON.stringify(imports, null, 2));
// console.log(JSON.stringify(type, null, 2));
//# sourceMappingURL=dev.js.map