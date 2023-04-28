import ts from 'typescript';
// import fs from 'fs';
import root from 'app-root-path';

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

const program: ts.Program = ts.createProgram(
	[`${root}/src/schema.ts`],
	{}
);
const checker: ts.TypeChecker = program.getTypeChecker();

const mySourceFile = program.getSourceFile(`${root}/src/schema.ts`);
if(!mySourceFile){
	throw new Error(`Cannot find source file`);
}

ts.forEachChild(mySourceFile, node => {
	if (ts.isTypeAliasDeclaration(node)) {
		const user_type = checker.getTypeAtLocation(node.name);
		const properties = user_type.getProperties();
		const propertyType = checker.getTypeOfSymbolAtLocation(properties[0], node);
		const propertyTypeName = checker.typeToString(propertyType);
		console.log(propertyTypeName);
	}
});

// Later involve the checker somehow
// const classSymbol = checker.getSymbolAtLocation(node.name);
