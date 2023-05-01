"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTypesInProject = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
// import fs from 'fs';
function listTypesInProject(tsconfigPath) {
    const configFile = typescript_1.default.readConfigFile(tsconfigPath, typescript_1.default.sys.readFile);
    const configObject = configFile.config;
    const parseResult = typescript_1.default.parseJsonConfigFileContent(configObject, typescript_1.default.sys, path_1.default.dirname(tsconfigPath));
    const compilerOptions = parseResult.options;
    const rootNames = parseResult.fileNames;
    console.log(rootNames);
    // const options = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config.compilerOptions;
    // delete (options).moduleResolution;
    const program = typescript_1.default.createProgram({
        rootNames: rootNames,
        options: compilerOptions
    });
    // const checker = program.getTypeChecker();
    const types = new Set();
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            console.log(sourceFile.fileName);
            typescript_1.default.forEachChild(sourceFile, visitNode);
        }
    }
    function visitNode(node) {
        console.log(node.getFullText());
        // if(ts.isExportDeclaration(node)){
        //   console.log(node.getText());
        // }
        // if (ts.isTypeNode(node)) {
        //   const type = checker.getTypeAtLocation(node);
        //   const symbol = type.getSymbol();
        //   if (symbol) {
        //     types.add(symbol.name);
        //   }
        // }
        // ts.forEachChild(node, visitNode);
    }
    // function printChildren(node: ts.Node){
    //   console.log(node.getText());
    // }
    return types;
}
exports.listTypesInProject = listTypesInProject;
const tsconfigPath = './tsconfig.json';
const types = listTypesInProject(tsconfigPath);
console.log(Array.from(types)); // Output: an array containing all the types used in your TypeScript project
//# sourceMappingURL=program.js.map