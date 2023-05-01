"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delint = void 0;
const fs_1 = require("fs");
const typescript_1 = __importDefault(require("typescript"));
function delint(sourceFile) {
    delintNode(sourceFile);
    function delintNode(node) {
        console.group();
        console.log(typescript_1.default.SyntaxKind[node.kind]);
        // switch (node.kind) {
        //   case ts.SyntaxKind.ForStatement:
        //   case ts.SyntaxKind.ForInStatement:
        //   case ts.SyntaxKind.WhileStatement:
        //   case ts.SyntaxKind.DoStatement:
        //     if ((node as ts.IterationStatement).statement.kind !== ts.SyntaxKind.Block) {
        //       report(
        //         node,
        //         'A looping statement\'s contents should be wrapped in a block body.'
        //       );
        //     }
        //     break;
        //   case ts.SyntaxKind.IfStatement:
        //     const ifStatement = node as ts.IfStatement;
        //     if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
        //       report(ifStatement.thenStatement, 'An if statement\'s contents should be wrapped in a block body.');
        //     }
        //     if (
        //       ifStatement.elseStatement &&
        //       ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
        //       ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement
        //     ) {
        //       report(
        //         ifStatement.elseStatement,
        //         'An else statement\'s contents should be wrapped in a block body.'
        //       );
        //     }
        //     break;
        //   case ts.SyntaxKind.BinaryExpression:
        //     const op = (node as ts.BinaryExpression).operatorToken.kind;
        //     if (op === ts.SyntaxKind.EqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
        //       report(node, 'Use \'===\' and \'!==\'.');
        //     }
        //     break;
        // }
        typescript_1.default.forEachChild(node, delintNode);
        console.groupEnd();
    }
    // function report(node: ts.Node, message: string) {
    //   const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    //   console.log(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
    // }
}
exports.delint = delint;
// const fileNames = process.argv.slice(2);
const fileNames = ['./src/content.ts'];
fileNames.forEach(fileName => {
    // Parse a file
    const sourceFile = typescript_1.default.createSourceFile(fileName, (0, fs_1.readFileSync)(fileName).toString(), typescript_1.default.ScriptTarget.ES2015, 
    /*setParentNodes */ true);
    // console.log(sourceFile);
    // delint it
    delint(sourceFile);
});
//# sourceMappingURL=linter.js.map