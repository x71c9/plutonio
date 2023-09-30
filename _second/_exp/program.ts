import ts from 'typescript';
import path from 'path';
// import fs from 'fs';

export function listTypesInProject(tsconfigPath: string): Set<string> {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  const configObject = configFile.config;
  const parseResult = ts.parseJsonConfigFileContent(
    configObject,
    ts.sys,
    path.dirname(tsconfigPath)
  );
  const compilerOptions = parseResult.options;
  const rootNames = parseResult.fileNames;
  console.log(rootNames);

  // const options = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config.compilerOptions;
  // delete (options).moduleResolution;

  const program = ts.createProgram({
    rootNames: rootNames,
    options: compilerOptions,
  });

  // const checker = program.getTypeChecker();

  const types = new Set<string>();

  for (const sourceFile of program.getSourceFiles()) {
    if (!sourceFile.isDeclarationFile) {
      console.log(sourceFile.fileName);
      ts.forEachChild(sourceFile, visitNode);
    }
  }

  function visitNode(node: ts.Node) {
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

const tsconfigPath = './tsconfig.json';
const types = listTypesInProject(tsconfigPath);
console.log(Array.from(types)); // Output: an array containing all the types used in your TypeScript project
