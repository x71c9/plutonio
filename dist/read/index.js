"use strict";
/**
 *
 * Resolve module
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = exports.atom_heritage_clause = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const log = __importStar(require("../log/index"));
exports.atom_heritage_clause = 'plutonio.atom';
function read(options) {
    log.trace('Resolving...');
    const { program, checker } = _create_ts_program(options);
    console.log(program, checker);
}
exports.read = read;
function _create_ts_program(options) {
    log.trace('Creating Typescript program...');
    let tsconfig_path = _get_default_tsconfig_path();
    if (typeof (options === null || options === void 0 ? void 0 : options.tsconfig_path) === 'string' &&
        (options === null || options === void 0 ? void 0 : options.tsconfig_path) !== '') {
        tsconfig_path = options.tsconfig_path;
    }
    const config_file = typescript_1.default.readConfigFile(tsconfig_path, typescript_1.default.sys.readFile);
    const config_object = config_file.config;
    const parse_result = typescript_1.default.parseJsonConfigFileContent(config_object, typescript_1.default.sys, path_1.default.dirname(tsconfig_path));
    const compilerOptions = parse_result.options;
    const rootNames = parse_result.fileNames;
    const create_program_options = {
        rootNames: rootNames,
        options: compilerOptions,
    };
    const program = typescript_1.default.createProgram(create_program_options);
    const checker = program.getTypeChecker();
    return { program, checker };
}
function _get_default_tsconfig_path() {
    return './tsconfig.json';
}
//# sourceMappingURL=index.js.map