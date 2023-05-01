/**
 *
 * Parser module
 *
 */

import ts from 'typescript';

// const file_content = fs.readFileSync(`${root}/src/schema.ts`);
// const node = ts.createSourceFile(
// 	'schema.ts',
// 	file_content.toString(),
// 	ts.ScriptTarget.Latest
// );
// // console.log(node);
// node.forEachChild((child) => {
// 	console.log('------------------------------------------------------------');
// 	console.log(ts.SyntaxKind[child.kind]);
// 	if(child.kind === ts.SyntaxKind.TypeAliasDeclaration){
// 		// const subchild = child.getChildAt(0)
// 		// console.log(subchild);
// 	}
// })

export const generate_schemas = () => {
  const program: ts.Program = ts.createProgram([`./src/content.ts`], {});

  const checker: ts.TypeChecker = program.getTypeChecker();

  const mySourceFile = program.getSourceFile(`./src/content.ts`);
  if (!mySourceFile) {
    throw new Error(`Cannot find source file`);
  }

  // console.log(checker);

  ts.forEachChild(mySourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      const node_type = checker.getTypeAtLocation(node.name);
      // console.log(node_type.getBaseTypes()?.[0]?.aliasSymbol);
      const symbol = node_type.getSymbol();
      if (!symbol) {
        throw new Error('cannot find symbol');
      }
      const name = symbol.getName();
      if (name !== 'User') {
        return;
      }
      console.log(`---------------------`);
      console.log(`Name: ${name}`);
      console.log(`---------------------`);
      const properties = node_type.getProperties();
      // console.log(`properties`, properties);
      for (const prop of properties) {
        const propertyType = checker.getTypeOfSymbolAtLocation(prop, node);
        const symbolstring = checker.symbolToString(prop);
        const propertyTypeString = checker.typeToString(propertyType);
        console.log(`${symbolstring}: ${propertyTypeString}`);
      }
      // console.log(`MODIFIERS`); // export, ...
      // console.log(ts.SyntaxKind[node.modifiers?.[0]?.kind || 0]);

      // const children = (node.heritageClauses?.[0]?.getChildren());
      // console.log(children?.[0].getText());
      // const plutonio_heritage_node = children?.[1].getChildren()?.[0];
      // console.log(ts.SyntaxKind[plutonio_heritage_node?.kind || 0])

      console.log(`HERITAGE`);
      console.log(ts.SyntaxKind[node.heritageClauses?.[0]?.kind || 0]);
      for (let i = 0; i < (node.heritageClauses?.length || 0); i++) {
        const heritage_node = node.heritageClauses?.[i];
        console.log(i, heritage_node?.getText());
        // console.log(heritage_node);
        // const heritage_types = heritage_node?.types;
        // for(let j = 0; j < (heritage_types?.length || 0); j++){
        //   const heritage_type = heritage_types?.[i];
        //   if(!heritage_type){
        //     continue;
        //   }
        //   // console.log(ts.SyntaxKind[heritage_type.kind]);
        //   console.log(heritage_type.getFirstToken());
        // }
      }
    }
  });
  // Later involve the checker somehow
  // const classSymbol = checker.getSymbolAtLocation(node.name);
  return undefined;
};
