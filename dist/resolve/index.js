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
exports.assertNever = exports.printObjectWithCircular = exports.resolve = exports.atom_heritage_clause = void 0;
const typescript_1 = __importDefault(require("typescript"));
const path_1 = __importDefault(require("path"));
const log = __importStar(require("../log/index"));
exports.atom_heritage_clause = 'plutonio.atom';
const localReferenceTypeCache = {};
const inProgressTypes = {};
// const valid_kind_name = ['InterfaceDeclaration', 'TypeAliasDeclaration'];
function resolve(options) {
    log.trace('Resolving...');
    const { program, checker } = _create_ts_program(options);
    const schemas = _scan_all_files(program, checker);
    // for (const [key, schema] of schemas) {
    //   console.log(key);
    //   log.info(schema);
    // }
    return schemas;
}
exports.resolve = resolve;
function _scan_all_files(program, checker) {
    // const schema_map = new Map<string, SourceFileSchema>();
    const all_map = new Map();
    for (const source_file of program.getSourceFiles()) {
        if (source_file.isDeclarationFile) {
            continue;
        }
        log.debug(`Scanning ${source_file.fileName}...`);
        const type_nodes = _get_type_nodes(source_file);
        type_nodes.forEach((value, key) => {
            all_map.set(key, value);
        });
    }
    all_map.forEach((value, key) => {
        _resolve(checker, key, value);
    });
}
function _resolve(checker, typeNode, parent_node, referencer, addToRefTypeMap = true) {
    var _a;
    console.log(`-------------------------------------------------------------`);
    console.log(typeNode.getText());
    const primitiveType = _get_primitive_type(typeNode);
    if (primitiveType) {
        console.log(`Primitive Type: ${primitiveType}`);
        return primitiveType;
    }
    if (typeNode.kind === typescript_1.default.SyntaxKind.NullKeyword) {
        console.log('NULL', typescript_1.default.SyntaxKind[typeNode.kind]);
        const enumType = {
            dataType: 'enum',
            enums: [null],
        };
        return enumType;
    }
    if (typeNode.kind === typescript_1.default.SyntaxKind.UndefinedKeyword) {
        console.log('UNDEFINED', typescript_1.default.SyntaxKind[typeNode.kind]);
        const undefinedType = {
            dataType: 'undefined',
        };
        return undefinedType;
    }
    if (typescript_1.default.isArrayTypeNode(typeNode)) {
        console.log('ARRAY TYPE NODE', typescript_1.default.SyntaxKind[typeNode.kind]);
        const arrayMetaType = {
            dataType: 'array',
            elementType: _resolve(checker, typeNode.elementType, parent_node),
        };
        return arrayMetaType;
    }
    if (typescript_1.default.isUnionTypeNode(typeNode)) {
        console.log('UNION TYPE NODE', typescript_1.default.SyntaxKind[typeNode.kind]);
        const types = typeNode.types.map((type) => {
            return _resolve(checker, type, parent_node);
        });
        const unionMetaType = {
            dataType: 'union',
            types,
        };
        return unionMetaType;
    }
    if (typescript_1.default.isIntersectionTypeNode(typeNode)) {
        console.log('INTERSECTION TYPE NODE', typeNode.kind);
        const types = typeNode.types.map((type) => {
            return _resolve(checker, type, parent_node);
        });
        const intersectionMetaType = {
            dataType: 'intersection',
            types,
        };
        return intersectionMetaType;
    }
    if (typeNode.kind === typescript_1.default.SyntaxKind.AnyKeyword ||
        typeNode.kind === typescript_1.default.SyntaxKind.UnknownKeyword) {
        console.log('ANY UNKNOWN', typescript_1.default.SyntaxKind[typeNode.kind]);
        const literallyAny = {
            dataType: 'any',
        };
        return literallyAny;
    }
    if (typescript_1.default.isLiteralTypeNode(typeNode)) {
        console.log('LITERAL TYPE NODE', typescript_1.default.SyntaxKind[typeNode.kind]);
        const enumType = {
            dataType: 'enum',
            enums: [getLiteralValue(typeNode)],
        };
        return enumType;
    }
    if (typescript_1.default.isTypeLiteralNode(typeNode)) {
        console.log('TYPE LITERAL', typescript_1.default.SyntaxKind[typeNode.kind]);
        const properties = typeNode.members
            .filter(typescript_1.default.isPropertySignature)
            .reduce((res, propertySignature) => {
            const type = _resolve(checker, propertySignature.type, propertySignature);
            const property = {
                example: getNodeExample(propertySignature),
                // default: getJSDocComment(propertySignature, 'default'),
                // description: this.getNodeDescription(propertySignature),
                // format: this.getNodeFormat(propertySignature),
                // name: (propertySignature.name as ts.Identifier).text,
                // required: !propertySignature.questionToken,
                type,
                // validators: getPropertyValidators(propertySignature) || {},
                // deprecated: isExistJSDocTag(propertySignature, tag => tag.tagName.text === 'deprecated'),
                // extensions: this.getNodeExtension(propertySignature),
            };
            return [property, ...res];
        }, []);
        const indexMember = typeNode.members.find((member) => typescript_1.default.isIndexSignatureDeclaration(member));
        let additionalType;
        if (indexMember) {
            const indexSignatureDeclaration = indexMember;
            const indexType = _resolve(checker, indexSignatureDeclaration.parameters[0].type, parent_node);
            if (indexType.dataType !== 'string') {
                throw new Error(`Only string indexers are supported.`);
            }
            additionalType = _resolve(checker, indexSignatureDeclaration.type, parent_node);
        }
        const objLiteral = {
            additionalProperties: indexMember && additionalType,
            dataType: 'nestedObjectLiteral',
            properties,
        };
        return objLiteral;
    }
    if (typescript_1.default.isMappedTypeNode(typeNode)) {
        console.log('MAPPED TYPE NODE', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'mapped' };
    }
    if (typescript_1.default.isConditionalTypeNode(typeNode) &&
        referencer &&
        typescript_1.default.isTypeReferenceNode(referencer)) {
        console.log('CONDITIONAL TYPE NODE', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'conditional' };
    }
    //keyof
    if (typescript_1.default.isTypeOperatorNode(typeNode) &&
        typeNode.operator === typescript_1.default.SyntaxKind.KeyOfKeyword) {
        console.log('TYPE OPERATOR keyof', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'keyof' };
    }
    // Handle `readonly` arrays
    if (typescript_1.default.isTypeOperatorNode(typeNode) &&
        typeNode.operator === typescript_1.default.SyntaxKind.ReadonlyKeyword) {
        console.log('TYPE OPERATION READONLY', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'readonly' };
    }
    // Indexed by keyword
    if (typescript_1.default.isIndexedAccessTypeNode(typeNode) &&
        (typeNode.indexType.kind === typescript_1.default.SyntaxKind.NumberKeyword ||
            typeNode.indexType.kind === typescript_1.default.SyntaxKind.StringKeyword)) {
        console.log('INDEXED ACCESS', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'index by keyword' };
    }
    // Indexed by literal
    if (typescript_1.default.isIndexedAccessTypeNode(typeNode) &&
        typescript_1.default.isLiteralTypeNode(typeNode.indexType) &&
        (typescript_1.default.isStringLiteral(typeNode.indexType.literal) ||
            typescript_1.default.isNumericLiteral(typeNode.indexType.literal))) {
        console.log('INDEXED ACCESS BY LITERAL', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'index by literal' };
    }
    // Indexed by keyof typeof value
    if (typescript_1.default.isIndexedAccessTypeNode(typeNode) &&
        typescript_1.default.isTypeOperatorNode(typeNode.indexType) &&
        typeNode.indexType.operator === typescript_1.default.SyntaxKind.KeyOfKeyword) {
        console.log('INDEXED KEYOF TYPEOF', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'indexed keyof typeof' };
    }
    if (typescript_1.default.isTemplateLiteralTypeNode(typeNode)) {
        console.log('TEMPLATE LITERAL', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'template' };
    }
    if (typescript_1.default.isParenthesizedTypeNode(typeNode)) {
        console.log('PARENHESIZED', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'parenth' };
    }
    if (typeNode.kind !== typescript_1.default.SyntaxKind.TypeReference) {
        console.log('NO REFERENCE', typescript_1.default.SyntaxKind[typeNode.kind]);
        return { typenode: 'no ref' };
    }
    const typeReference = typeNode;
    if (((_a = typeReference === null || typeReference === void 0 ? void 0 : typeReference.typeName) === null || _a === void 0 ? void 0 : _a.kind) === typescript_1.default.SyntaxKind.Identifier) {
        console.log('REFERENCE IDENTIFIER', typescript_1.default.SyntaxKind[typeNode.kind]);
        // return {typenode: 'ref'};
    }
    const referenceType = getReferenceType(checker, typeReference, parent_node);
    if (addToRefTypeMap) {
        AddReferenceType(referenceType);
    }
    return referenceType;
    // console.log('******MISSING******', typeNode.kind);
}
function _get_type_nodes(source_file) {
    const children = source_file.getChildren();
    const map = new Map();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (typescript_1.default.isTypeNode(child)) {
            log.trace(`Found TypeNode: ${child.getText()}`);
            map.set(child, child.parent);
        }
        const nested_map = _get_type_nodes(child);
        nested_map.forEach((value, key) => {
            map.set(key, value);
        });
    }
    return map;
}
function _get_primitive_type(node) {
    const resolution = attemptToResolveKindToPrimitive(node.kind);
    if (!resolution.foundMatch) {
        return undefined;
    }
    if (resolution.resolvedType === 'number') {
        return 'number';
    }
    else if (resolution.resolvedType === 'string') {
        return 'string';
    }
    else if (resolution.resolvedType === 'boolean') {
        return 'boolean';
    }
    else if (resolution.resolvedType === 'void') {
        return 'void';
    }
    else if (resolution.resolvedType === 'undefined') {
        return 'undefined';
    }
    else {
        return assertNever(resolution.resolvedType);
    }
}
// function _get_syntax_kind(node: ts.Node, kind: ts.SyntaxKind) {
//   const children = node.getChildren();
//   let nodes: ts.Node[] = [];
//   for (let i = 0; i < children.length; i++) {
//     const child = children[i];
//     if (child.kind === kind) {
//       log.trace(
//         `Found ${ts.SyntaxKind[kind]}: ${(child as any).name.getText()}`
//       );
//       nodes.push(child);
//     }
//     const nested_nodes = _get_syntax_kind(child, kind);
//     nodes = nodes.concat(nested_nodes);
//   }
//   return nodes;
// }
function attemptToResolveKindToPrimitive(syntaxKind) {
    if (syntaxKind === typescript_1.default.SyntaxKind.NumberKeyword) {
        return {
            foundMatch: true,
            resolvedType: 'number',
        };
    }
    else if (syntaxKind === typescript_1.default.SyntaxKind.StringKeyword) {
        return {
            foundMatch: true,
            resolvedType: 'string',
        };
    }
    else if (syntaxKind === typescript_1.default.SyntaxKind.BooleanKeyword) {
        return {
            foundMatch: true,
            resolvedType: 'boolean',
        };
    }
    else if (syntaxKind === typescript_1.default.SyntaxKind.VoidKeyword) {
        return {
            foundMatch: true,
            resolvedType: 'void',
        };
    }
    else if (syntaxKind === typescript_1.default.SyntaxKind.UndefinedKeyword) {
        return {
            foundMatch: true,
            resolvedType: 'undefined',
        };
    }
    else {
        return {
            foundMatch: false,
        };
    }
}
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
function printObjectWithCircular(obj, maxDepth = 8, currentDepth = 0, seen = new Set(), indent = 2) {
    if (currentDepth > maxDepth) {
        console.log(`${' '.repeat(indent * currentDepth)}[Reached maximum depth]`);
        return;
    }
    if (typeof obj === 'object' && obj !== null) {
        if (seen.has(obj)) {
            console.log(`${' '.repeat(indent * currentDepth)}[Circular Reference]`);
            return;
        }
        seen.add(obj);
        for (const key in obj) {
            if (typeof obj[key] !== 'function') {
                console.log(`${' '.repeat(indent * currentDepth)}${key}:`);
                printObjectWithCircular(obj[key], maxDepth, currentDepth + 1, seen, indent);
            }
        }
        seen.delete(obj);
    }
    else {
        if (typeof obj === 'function') {
            console.log(`${' '.repeat(indent * currentDepth)}[FUNCTION]`);
        }
        else {
            console.log(`${' '.repeat(indent * currentDepth)}${obj}`);
        }
    }
}
exports.printObjectWithCircular = printObjectWithCircular;
function assertNever(value) {
    throw new Error(`Unhandled discriminated union member: ${JSON.stringify(value)}`);
}
exports.assertNever = assertNever;
function getLiteralValue(typeNode) {
    let value;
    switch (typeNode.literal.kind) {
        case typescript_1.default.SyntaxKind.TrueKeyword:
            value = true;
            break;
        case typescript_1.default.SyntaxKind.FalseKeyword:
            value = false;
            break;
        case typescript_1.default.SyntaxKind.StringLiteral:
            value = typeNode.literal.text;
            break;
        case typescript_1.default.SyntaxKind.NumericLiteral:
            value = parseFloat(typeNode.literal.text);
            break;
        case typescript_1.default.SyntaxKind.NullKeyword:
            value = null;
            break;
        default:
            if (Object.prototype.hasOwnProperty.call(typeNode.literal, 'text')) {
                value = typeNode.literal.text;
            }
            else {
                throw new Error(`Couldn't resolve literal node: ${typeNode.literal.getText()}`);
            }
    }
    return value;
}
function getReferenceType(checker, node, parent_node, addToRefTypeMap = true, context = {}) {
    let type;
    if (typescript_1.default.isTypeReferenceNode(node)) {
        type = node.typeName;
    }
    else if (typescript_1.default.isExpressionWithTypeArguments(node)) {
        type = node.expression;
    }
    else {
        throw new Error(`Can't resolve Reference type.`);
    }
    // Can't invoke getText on Synthetic Nodes
    let resolvableName = node.pos !== -1 ? node.getText() : type.text;
    console.log(`resolvableName:`, resolvableName);
    if (node.pos === -1 &&
        'typeArguments' in node &&
        Array.isArray(node.typeArguments)) {
        // Add typearguments for Synthetic nodes (e.g. Record<> in TestClassModel.indexedResponse)
        const argumentsString = node.typeArguments.map((arg) => {
            if (typescript_1.default.isLiteralTypeNode(arg)) {
                return `'${String(getLiteralValue(arg))}'`;
            }
            const resolved = attemptToResolveKindToPrimitive(arg.kind);
            if (resolved.foundMatch === false)
                return 'any';
            return resolved.resolvedType;
        });
        resolvableName += `<${argumentsString.join(', ')}>`;
    }
    const name = contextualizedName(resolvableName, context);
    console.log(`ContextualizedName: `, name);
    typeArgumentsToContext(node, type, context, checker);
    try {
        const existingType = localReferenceTypeCache[name];
        if (existingType) {
            console.log(`TYPE ALREADY RESOLVED: `, existingType);
            return existingType;
        }
        const refEnumType = getEnumerateType(type, checker);
        if (refEnumType) {
            console.log(`TYPE is ENUM: `, refEnumType);
            localReferenceTypeCache[name] = refEnumType;
            return refEnumType;
        }
        if (inProgressTypes[name]) {
            console.log(`TYPE is in PROGRESS (Circular): `, inProgressTypes[name]);
            return createCircularDependencyResolver(name);
        }
        inProgressTypes[name] = true;
        const declaration = getModelTypeDeclaration(type, checker);
        console.log(`Model type declaration: `, declaration.getText());
        let referenceType;
        if (typescript_1.default.isTypeAliasDeclaration(declaration)) {
            console.log(`isTypeAliasDeclaration TRUE`);
            referenceType = getTypeAliasReference(checker, declaration, name, node, parent_node, addToRefTypeMap);
            console.log(`type ALIAS REFERENCE: `, referenceType);
        }
        else if (typescript_1.default.isEnumMember(declaration)) {
            referenceType = {
                dataType: 'refEnum',
                // refName: getRefTypeName(name),
                // enums: [current.typeChecker.getConstantValue(declaration)!],
                enumVarnames: [declaration.name.getText()],
                deprecated: isExistJSDocTag(declaration, (tag) => tag.tagName.text === 'deprecated'),
            };
            console.log(`REFERENCE TYPE: `, referenceType);
        }
        else {
            referenceType = getModelReference(checker, declaration, name);
        }
        // localReferenceTypeCache[name] = referenceType;
        return referenceType;
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error(`There was a problem resolving type of '${name}'.`);
        throw err;
    }
}
function contextualizedName(name, context) {
    return Object.entries(context).reduce((acc, [key, entry]) => {
        return acc
            .replace(new RegExp(`<\\s*([^>]*\\s)*\\s*(${key})(\\s[^>]*)*\\s*>`, 'g'), `<$1${entry.getText()}$3>`)
            .replace(new RegExp(`<\\s*([^,]*\\s)*\\s*(${key})(\\s[^,]*)*\\s*,`, 'g'), `<$1${entry.getText()}$3,`)
            .replace(new RegExp(`,\\s*([^>]*\\s)*\\s*(${key})(\\s[^>]*)*\\s*>`, 'g'), `,$1${entry.getText()}$3>`)
            .replace(new RegExp(`<\\s*([^<]*\\s)*\\s*(${key})(\\s[^<]*)*\\s*<`, 'g'), `<$1${entry.getText()}$3<`);
    }, name);
}
const referenceTypeMap = {};
function AddReferenceType(referenceType) {
    if (!referenceType.refName) {
        return;
    }
    referenceTypeMap[referenceType.refName] = referenceType;
}
function typeArgumentsToContext(type, targetEntity, context, typeChecker) {
    context = {};
    const declaration = getModelTypeDeclaration(targetEntity, typeChecker);
    const typeParameters = 'typeParameters' in declaration ? declaration.typeParameters : undefined;
    if (typeParameters) {
        for (let index = 0; index < typeParameters.length; index++) {
            const typeParameter = typeParameters[index];
            const typeArg = type.typeArguments && type.typeArguments[index];
            let resolvedType;
            // Argument may be a forward reference from context
            if (typeArg &&
                typescript_1.default.isTypeReferenceNode(typeArg) &&
                typescript_1.default.isIdentifier(typeArg.typeName) &&
                context[typeArg.typeName.text]) {
                resolvedType = context[typeArg.typeName.text];
            }
            else if (typeArg) {
                resolvedType = typeArg;
            }
            else if (typeParameter.default) {
                resolvedType = typeParameter.default;
            }
            else {
                throw new Error(`Could not find a value for type parameter ${typeParameter.name.text}`);
            }
            context = {
                ...context,
                [typeParameter.name.text]: resolvedType,
            };
        }
    }
    return context;
}
function getModelTypeDeclaration(type, checker) {
    let typeName = type.kind === typescript_1.default.SyntaxKind.Identifier ? type.text : type.right.text;
    const symbol = getSymbolAtLocation(type, checker);
    const declarations = symbol === null || symbol === void 0 ? void 0 : symbol.getDeclarations();
    if (!declarations) {
        throw new Error(`No declarations found for referenced type ${typeName}.`);
    }
    if (symbol.escapedName !== typeName && symbol.escapedName !== 'default') {
        typeName = symbol.escapedName;
    }
    let modelTypes = declarations.filter((node) => {
        var _a;
        return nodeIsUsable(node) && ((_a = node.name) === null || _a === void 0 ? void 0 : _a.getText()) === typeName;
    });
    if (!modelTypes.length) {
        throw new Error(`No matching model found for referenced type ${typeName}.`);
    }
    if (modelTypes.length > 1) {
        // remove types that are from typescript e.g. 'Account'
        modelTypes = modelTypes.filter((modelType) => {
            return (modelType
                .getSourceFile()
                .fileName.replace(/\\/g, '/')
                .toLowerCase()
                .indexOf('node_modules/typescript') <= -1);
        });
        modelTypes = getDesignatedModels(modelTypes, typeName);
    }
    if (modelTypes.length > 1) {
        const conflicts = modelTypes
            .map((modelType) => modelType.getSourceFile().fileName)
            .join('"; "');
        throw new Error(`Multiple matching models found for referenced type ${typeName}; please make model names unique. Conflicts found: "${conflicts}".`);
    }
    return modelTypes[0];
}
function getSymbolAtLocation(type, typeChecker) {
    const symbol = typeChecker.getSymbolAtLocation(type) ||
        type.symbol;
    // resolve alias if it is an alias, otherwise take symbol directly
    return ((symbol &&
        hasFlag(symbol, typescript_1.default.SymbolFlags.Alias) &&
        typeChecker.getAliasedSymbol(symbol)) ||
        symbol);
}
function hasFlag(type, flag) {
    return (type.flags & flag) === flag;
}
function getDesignatedModels(nodes, typeName) {
    /**
     * Model is marked with '@tsoaModel', indicating that it should be the 'canonical' model used
     */
    const designatedNodes = nodes.filter((enumNode) => {
        return isExistJSDocTag(enumNode, (tag) => tag.tagName.text === 'tsoaModel');
    });
    if (designatedNodes.length > 0) {
        if (designatedNodes.length > 1) {
            throw new Error(`Multiple models for ${typeName} marked with '@tsoaModel'; '@tsoaModel' should only be applied to one model.`);
        }
        return designatedNodes;
    }
    return nodes;
}
function isExistJSDocTag(_node, _isMatching) {
    // const tags = getJSDocTags(node, isMatching);
    const tags = [];
    if (tags.length === 0) {
        return false;
    }
    return true;
}
// function getSymbolAtLocation(type: ts.Node, typeChecker: ts.TypeChecker) {
//   const symbol = typeChecker.getSymbolAtLocation(type) || ((type as any).symbol as ts.Symbol);
//   // resolve alias if it is an alias, otherwise take symbol directly
//   return (symbol && hasFlag(symbol, ts.SymbolFlags.Alias) && typeChecker.getAliasedSymbol(symbol)) || symbol;
// }
function getEnumerateType(typeName, typeChecker) {
    var _a, _b, _c;
    const enumName = typeName.text;
    const symbol = getSymbolAtLocation(typeName, typeChecker);
    // resolve value
    let declaredType = (((_a = typeChecker.getDeclaredTypeOfSymbol(symbol)) === null || _a === void 0 ? void 0 : _a.symbol) ||
        symbol);
    // if we are a EnumMember, return parent instead (this happens if a enum has only one entry, not quite sure why though...)
    if (hasFlag(declaredType, typescript_1.default.SymbolFlags.EnumMember) &&
        ((_c = (_b = declaredType.parent) === null || _b === void 0 ? void 0 : _b.valueDeclaration) === null || _c === void 0 ? void 0 : _c.kind) ===
            typescript_1.default.SyntaxKind.EnumDeclaration) {
        declaredType = declaredType.parent;
    }
    const declarations = declaredType.getDeclarations();
    if (!declarations) {
        return;
    }
    let enumNodes = declarations.filter((node) => {
        return typescript_1.default.isEnumDeclaration(node) && node.name.getText() === enumName;
    });
    if (!enumNodes.length) {
        return;
    }
    enumNodes = getDesignatedModels(enumNodes, enumName);
    if (enumNodes.length > 1) {
        throw new Error(`Multiple matching enum found for enum ${enumName}; please make enum names unique.`);
    }
    const enumDeclaration = enumNodes[0];
    const isNotUndefined = (item) => {
        return item === undefined ? false : true;
    };
    const enums = enumDeclaration.members
        .map((e) => typeChecker.getConstantValue(e))
        .filter(isNotUndefined);
    const enumVarnames = enumDeclaration.members
        .map((e) => e.name.getText())
        .filter(isNotUndefined);
    return {
        dataType: 'refEnum',
        // description: this.getNodeDescription(enumDeclaration),
        enums,
        enumVarnames,
        refName: enumName,
        deprecated: isExistJSDocTag(enumDeclaration, (tag) => tag.tagName.text === 'deprecated'),
    };
}
function nodeIsUsable(node) {
    switch (node.kind) {
        case typescript_1.default.SyntaxKind.InterfaceDeclaration:
        case typescript_1.default.SyntaxKind.ClassDeclaration:
        case typescript_1.default.SyntaxKind.TypeAliasDeclaration:
        case typescript_1.default.SyntaxKind.EnumDeclaration:
        case typescript_1.default.SyntaxKind.EnumMember:
            return true;
        default:
            return false;
    }
}
function createCircularDependencyResolver(refName) {
    const referenceType = {
        dataType: 'refObject',
        refName,
    };
    OnFinish((referenceTypes) => {
        const realReferenceType = referenceTypes[refName];
        if (!realReferenceType) {
            return;
        }
        // referenceType.description = realReferenceType.description;
        // if (realReferenceType.dataType === 'refObject' && referenceType.dataType === 'refObject') {
        //   referenceType.properties = realReferenceType.properties;
        // }
        // referenceType.dataType = realReferenceType.dataType;
        // referenceType.refName = realReferenceType.refName;
    });
    return referenceType;
}
const circularDependencyResolvers = new Array();
function OnFinish(callback) {
    circularDependencyResolvers.push(callback);
}
function getTypeAliasReference(checker, declaration, name, referencer, parent_node, addToRefTypeMap = true) {
    const example = getNodeExample(declaration);
    return {
        dataType: 'refAlias',
        // default: getJSDocComment(declaration, 'default'),
        // description: getNodeDescription(declaration),
        refName: getRefTypeName(name),
        format: getNodeFormat(declaration),
        type: _resolve(checker, declaration.type, parent_node, referencer, addToRefTypeMap),
        // validators: getPropertyValidators(declaration) || {},
        ...(example && { example }),
    };
}
function getRefTypeName(name) {
    return encodeURIComponent(name
        .replace(/<|>/g, '_')
        .replace(/\s+/g, '')
        .replace(/,/g, '.')
        .replace(/'([^']*)'/g, '$1')
        .replace(/"([^"]*)"/g, '$1')
        .replace(/&/g, '-and-')
        .replace(/\|/g, '-or-')
        .replace(/\[\]/g, '-Array')
        .replace(/{|}/g, '_') // SuccessResponse_{indexesCreated-number}_ -> SuccessResponse__indexesCreated-number__
        .replace(/([a-z]+):([a-z]+)/gi, '$1-$2') // SuccessResponse_indexesCreated:number_ -> SuccessResponse_indexesCreated-number_
        .replace(/;/g, '--')
        .replace(/([a-z]+)\[([a-z]+)\]/gi, '$1-at-$2') // Partial_SerializedDatasourceWithVersion[format]_ -> Partial_SerializedDatasourceWithVersion~format~_,
    );
}
function getNodeFormat(node) {
    return getJSDocComment(node, 'format');
}
function getJSDocComment(node, tagName) {
    const comments = getJSDocComments(node, tagName);
    if (comments && comments.length !== 0) {
        return comments[0];
    }
    return;
}
function getJSDocComments(node, tagName) {
    const tags = getJSDocTags(node, (tag) => tag.tagName.text === tagName || tag.tagName.escapedText === tagName);
    if (tags.length === 0) {
        return;
    }
    const comments = [];
    tags.forEach((tag) => {
        const comment = commentToString(tag.comment);
        if (comment)
            comments.push(comment);
    });
    return comments;
}
function getJSDocTags(node, isMatching) {
    const jsDocs = node.jsDoc;
    if (!jsDocs || jsDocs.length === 0) {
        return [];
    }
    const jsDoc = jsDocs[0];
    if (!jsDoc.tags) {
        return [];
    }
    return jsDoc.tags.filter(isMatching);
}
function commentToString(comment) {
    if (typeof comment === 'string') {
        return comment;
    }
    else if (comment) {
        return comment.map((node) => node.text).join(' ');
    }
    return undefined;
}
function getModelReference(typeChecker, modelType, name) {
    const example = getNodeExample(modelType);
    const description = getNodeDescription(typeChecker, modelType);
    // const deprecated = isExistJSDocTag(modelType, tag => tag.tagName.text === 'deprecated') || isDecorator(modelType, identifier => identifier.text === 'Deprecated');
    const deprecated = false;
    // Handle toJSON methods
    if (!modelType.name) {
        throw new Error("Can't get Symbol from anonymous class");
    }
    const type = typeChecker.getTypeAtLocation(modelType.name);
    const toJSON = typeChecker.getPropertyOfType(type, 'toJSON');
    if (toJSON &&
        toJSON.valueDeclaration &&
        (typescript_1.default.isMethodDeclaration(toJSON.valueDeclaration) ||
            typescript_1.default.isMethodSignature(toJSON.valueDeclaration))) {
        let nodeType = toJSON.valueDeclaration.type;
        if (!nodeType) {
            const signature = typeChecker.getSignatureFromDeclaration(toJSON.valueDeclaration);
            const implicitType = typeChecker.getReturnTypeOfSignature(signature);
            nodeType = typeChecker.typeToTypeNode(implicitType, undefined, typescript_1.default.NodeBuilderFlags.NoTruncation);
        }
        // const type = new TypeResolver(nodeType, this.current).resolve();
        const type = _resolve(typeChecker, nodeType);
        const referenceType = {
            refName: getRefTypeName(name),
            dataType: 'refAlias',
            description,
            type,
            validators: {},
            deprecated,
            ...(example && { example }),
        };
        return referenceType;
    }
    const properties = getModelProperties(modelType);
    const additionalProperties = getModelAdditionalProperties(modelType);
    const inheritedProperties = getModelInheritedProperties(modelType) || [];
    const referenceType = {
        additionalProperties,
        dataType: 'refObject',
        description,
        properties: inheritedProperties,
        refName: getRefTypeName(name),
        deprecated,
        ...(example && { example }),
    };
    referenceType.properties = referenceType.properties.concat(properties);
    return referenceType;
}
// function getNodeExample(typeChecker:ts.TypeChecker, node: UsableDeclaration | ts.PropertyDeclaration | ts.ParameterDeclaration | ts.EnumDeclaration) {
function getNodeExample(node) {
    const exampleJSDoc = getJSDocComment(node, 'example');
    if (exampleJSDoc) {
        return safeFromJson(exampleJSDoc);
    }
    // return getNodeFirstDecoratorValue(node, typeChecker, dec => dec.text === 'Example');
    // TODO
    return {};
}
function getNodeDescription(typeChecker, node) {
    const symbol = getSymbolAtLocation(node.name, typeChecker);
    if (!symbol) {
        return undefined;
    }
    /**
     * TODO: Workaround for what seems like a bug in the compiler
     * Warrants more investigation and possibly a PR against typescript
     */
    if (node.kind === typescript_1.default.SyntaxKind.Parameter) {
        // TypeScript won't parse jsdoc if the flag is 4, i.e. 'Property'
        symbol.flags = 0;
    }
    const comments = symbol.getDocumentationComment(typeChecker);
    if (comments.length) {
        return typescript_1.default.displayPartsToString(comments);
    }
    return undefined;
}
function safeFromJson(json) {
    try {
        return JSON.parse(json);
    }
    catch (_a) {
        return undefined;
    }
}
// function getNodeFirstDecoratorValue(node: ts.Node, typeChecker: ts.TypeChecker, isMatching: (identifier: ts.Identifier) => boolean) {
//   const decorators = getDecorators(node, isMatching);
//   if (!decorators || !decorators.length) {
//     return;
//   }
//   const values = getDecoratorValues(decorators[0], typeChecker);
//   return values && values[0];
// }
// function getDecorators(node: ts.Node, isMatching: (identifier: ts.Identifier) => boolean) {
//   // beginning in ts4.8 node.decorator is undefined, use getDecorators instead.
//   const decorators = tsHasDecorators(ts) && ts.canHaveDecorators(node) ? ts.getDecorators(node) : [];
//   if (!decorators || !decorators.length) {
//     return [];
//   }
//   return decorators
//     .map((e: any) => {
//       while (e.expression !== undefined) {
//         e = e.expression;
//       }
//       return e as ts.Identifier;
//     })
//     .filter(isMatching);
// }
// function getDecoratorValues(decorator: ts.Identifier, typeChecker: ts.TypeChecker): any[] {
//   const expression = decorator.parent as ts.CallExpression;
//   const expArguments = expression.arguments;
//   if (!expArguments || !expArguments.length) {
//     return [];
//   }
//   return expArguments.map(a => getInitializerValue(a, typeChecker));
// }
// function tsHasDecorators(tsNamespace: typeof ts): tsNamespace is typeof ts & {
//   canHaveDecorators(node: ts.Node): node is any;
//   getDecorators(node: ts.Node): readonly ts.Decorator[] | undefined;
// } {
//   return typeof tsNamespace.canHaveDecorators === 'function';
// }
//
function getModelProperties(node, overrideToken) {
    const isIgnored = (e) => {
        return isExistJSDocTag(e, (tag) => tag.tagName.text === 'ignore');
    };
    // Interface model
    if (typescript_1.default.isInterfaceDeclaration(node)) {
        return node.members
            .filter((member) => !isIgnored(member) && typescript_1.default.isPropertySignature(member))
            .map((member) => propertyFromSignature(member, overrideToken));
    }
    const properties = [];
    for (const member of node.members) {
        if (!isIgnored(member) &&
            typescript_1.default.isPropertyDeclaration(member) &&
            !this.hasStaticModifier(member) &&
            this.hasPublicModifier(member)) {
            properties.push(member);
        }
    }
    const classConstructor = node.members.find((member) => typescript_1.default.isConstructorDeclaration(member));
    if (classConstructor && classConstructor.parameters) {
        const constructorProperties = classConstructor.parameters.filter((parameter) => this.isAccessibleParameter(parameter));
        properties.push(...constructorProperties);
    }
    return properties.map((property) => propertyFromDeclaration(property, overrideToken));
}
function propertyFromSignature(propertySignature, overrideToken) {
    const identifier = propertySignature.name;
    if (!propertySignature.type) {
        throw new Error(`No valid type found for property declaration.`);
    }
    let required = !propertySignature.questionToken;
    if (overrideToken && overrideToken.kind === typescript_1.default.SyntaxKind.MinusToken) {
        required = true;
    }
    else if (overrideToken &&
        overrideToken.kind === typescript_1.default.SyntaxKind.QuestionToken) {
        required = false;
    }
    const property = {
        default: getJSDocComment(propertySignature, 'default'),
        description: this.getNodeDescription(propertySignature),
        example: this.getNodeExample(propertySignature),
        format: this.getNodeFormat(propertySignature),
        name: identifier.text,
        required,
        type: new TypeResolver(propertySignature.type, this.current, propertySignature.type.parent, this.context, propertySignature.type).resolve(),
        validators: getPropertyValidators(propertySignature) || {},
        deprecated: isExistJSDocTag(propertySignature, (tag) => tag.tagName.text === 'deprecated'),
        extensions: this.getNodeExtension(propertySignature),
    };
    return property;
}
function propertyFromDeclaration(checker, propertyDeclaration, overrideToken) {
    const identifier = propertyDeclaration.name;
    let typeNode = propertyDeclaration.type;
    if (!typeNode) {
        const tsType = this.current.typeChecker.getTypeAtLocation(propertyDeclaration);
        typeNode = this.current.typeChecker.typeToTypeNode(tsType, undefined, typescript_1.default.NodeBuilderFlags.NoTruncation);
    }
    if (!typeNode) {
        throw new Error(`No valid type found for property declaration.`);
    }
    // const type = new TypeResolver(typeNode, this.current, propertyDeclaration, this.context, typeNode).resolve();
    const type = _resolve(checker, typeNode.elementType, parent_node);
    let required = !propertyDeclaration.questionToken && !propertyDeclaration.initializer;
    if (overrideToken && overrideToken.kind === typescript_1.default.SyntaxKind.MinusToken) {
        required = true;
    }
    else if (overrideToken &&
        overrideToken.kind === typescript_1.default.SyntaxKind.QuestionToken) {
        required = false;
    }
    const property = {
        default: getInitializerValue(propertyDeclaration.initializer, this.current.typeChecker),
        description: this.getNodeDescription(propertyDeclaration),
        example: this.getNodeExample(propertyDeclaration),
        format: this.getNodeFormat(propertyDeclaration),
        name: identifier.text,
        required,
        type,
        validators: getPropertyValidators(propertyDeclaration) || {},
        // class properties and constructor parameters may be deprecated either via jsdoc annotation or decorator
        deprecated: isExistJSDocTag(propertyDeclaration, (tag) => tag.tagName.text === 'deprecated') ||
            isDecorator(propertyDeclaration, (identifier) => identifier.text === 'Deprecated'),
        extensions: this.getNodeExtension(propertyDeclaration),
    };
    return property;
}
function getModelAdditionalProperties(node) {
    if (node.kind === typescript_1.default.SyntaxKind.InterfaceDeclaration) {
        const interfaceDeclaration = node;
        const indexMember = interfaceDeclaration.members.find((member) => member.kind === typescript_1.default.SyntaxKind.IndexSignature);
        if (!indexMember) {
            return undefined;
        }
        const indexSignatureDeclaration = indexMember;
        // const indexType = new TypeResolver(indexSignatureDeclaration.parameters[0].type as ts.TypeNode, this.current, this.parentNode, this.context).resolve();
        const indexType = _resolve(checker, typeNode.elementType, parent_node);
        if (indexType.dataType !== 'string') {
            throw new Error(`Only string indexers are supported.`, this.typeNode);
        }
        // return new TypeResolver(indexSignatureDeclaration.type, this.current, this.parentNode, this.context).resolve();
        return _resolve(checker, typeNode.elementType, parent_node);
    }
    return undefined;
}
function getModelInheritedProperties(modelTypeDeclaration) {
    let properties = [];
    const heritageClauses = modelTypeDeclaration.heritageClauses;
    if (!heritageClauses) {
        return properties;
    }
    for (const clause of heritageClauses) {
        if (!clause.types) {
            continue;
        }
        for (const t of clause.types) {
            const baseEntityName = t.expression;
            // create subContext
            const resetCtx = this.typeArgumentsToContext(t, baseEntityName, this.context);
            const referenceType = this.getReferenceType(t, false);
            if (referenceType) {
                if (referenceType.dataType === 'refEnum') {
                    // since it doesn't have properties to iterate over, then we don't do anything with it
                }
                else if (referenceType.dataType === 'refAlias') {
                    let type = referenceType;
                    while (type.dataType === 'refAlias') {
                        type = type.type;
                    }
                    if (type.dataType === 'refObject') {
                        properties = [...properties, ...type.properties];
                    }
                    else if (type.dataType === 'nestedObjectLiteral') {
                        properties = [...properties, ...type.properties];
                    }
                }
                else if (referenceType.dataType === 'refObject') {
                    (referenceType.properties || []).forEach((property) => properties.push(property));
                }
                else {
                    assertNever(referenceType);
                }
            }
            // reset subContext
            this.context = resetCtx;
        }
    }
    return properties;
}
//# sourceMappingURL=index.js.map