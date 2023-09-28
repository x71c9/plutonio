/**
 *
 * Resolve module
 *
 */

import ts from 'typescript';
import path from 'path';

import * as log from '../log/index';
import * as c from '../config/index';

export const atom_heritage_clause = 'plutonio.atom';

const localReferenceTypeCache: {[typeName: string]: ReferenceType} = {};
const inProgressTypes: {[typeName: string]: boolean} = {};

type OverrideToken =
  | ts.Token<ts.SyntaxKind.QuestionToken>
  | ts.Token<ts.SyntaxKind.PlusToken>
  | ts.Token<ts.SyntaxKind.MinusToken>
  | undefined;

export type Type = any;
// | PrimitiveType
// | ObjectsNoPropsType
// | EnumType
// | ArrayType
// | FileType
// | DateTimeType
// | DateType
// | BinaryType
// | BufferType
// | ByteType
// | AnyType
// | RefEnumType
// | RefObjectType
// | RefAliasType
// | NestedObjectLiteralType
// | UnionType
// | IntersectionType;

// export type Validator =
//   | IntegerValidator
//   | FloatValidator
//   | DateValidator
//   | DateTimeValidator
//   | StringValidator
//   | BooleanValidator
//   | ArrayValidator;
export interface Extension {
  key: `x-${string}`;
  // value: ExtensionType | ExtensionType[];
  value: any;
}
export type Validator = any;
type AllKeys<T> = T extends any ? keyof T : never;
export type ValidatorKey = AllKeys<Validator>;
export type Validators = Partial<
  Record<ValidatorKey, {value?: unknown; errorMsg?: string}>
>;

export interface Property {
  default?: unknown;
  description?: string;
  format?: string;
  example?: unknown;
  name: string;
  type: Type;
  required: boolean;
  validators: Validators;
  deprecated: boolean;
  extensions?: Extension[];
}

export type GenerateOptions = {
  tsconfig_path?: string;
};

export type AtomSchemaAttributeType = keyof typeof c.primitive_types;

export type AtomSchemaAttribute = {
  type: AtomSchemaAttributeType;
  optional?: boolean;
  unique?: boolean;
  array?: boolean;
};

export type AtomSchema = {
  [k: string]: AtomSchemaAttribute;
};

export type AtomSchemas = {
  [k: string]: AtomSchema;
};

// type Import = {
//   text: string;
//   module: string;
//   clause?: string;
// };

// type Type = {
//   text: string;
//   name: string;
//   properties: Property[];
// };

// type Interface = Type;

// type Property = {
//   name: string;
//   value: string;
//   type: string;
//   optional?: boolean;
// };

// type SourceFileSchema = {
//   imports: Import[];
//   types: Type[];
//   interfaces: Interface[];
// };

interface Context {
  [name: string]: ts.TypeReferenceNode | ts.TypeNode;
}

// const valid_kind_name = ['InterfaceDeclaration', 'TypeAliasDeclaration'];

export function resolve(options?: GenerateOptions) {
  log.trace('Resolving...');
  const {program, checker} = _create_ts_program(options);
  const schemas = _scan_all_files(program, checker);
  // for (const [key, schema] of schemas) {
  //   console.log(key);
  //   log.info(schema);
  // }
  return schemas;
}

function _scan_all_files(program: ts.Program, checker: ts.TypeChecker) {
  // const schema_map = new Map<string, SourceFileSchema>();
  const all_map: Map<ts.TypeNode, ts.Node> = new Map();
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

function _resolve(
  checker: ts.TypeChecker,
  typeNode: ts.TypeNode,
  parent_node?: ts.Node,
  referencer?: ts.TypeNode,
  addToRefTypeMap: boolean = true
) {
  console.log(`-------------------------------------------------------------`);
  console.log(typeNode.getText());
  const primitiveType = _get_primitive_type(typeNode);
  if (primitiveType) {
    console.log(`Primitive Type: ${primitiveType}`);
    return primitiveType;
  }
  if (typeNode.kind === ts.SyntaxKind.NullKeyword) {
    console.log('NULL', ts.SyntaxKind[typeNode.kind]);
    const enumType = {
      dataType: 'enum',
      enums: [null],
    };
    return enumType;
  }
  if (typeNode.kind === ts.SyntaxKind.UndefinedKeyword) {
    console.log('UNDEFINED', ts.SyntaxKind[typeNode.kind]);
    const undefinedType = {
      dataType: 'undefined',
    };
    return undefinedType;
  }
  if (ts.isArrayTypeNode(typeNode)) {
    console.log('ARRAY TYPE NODE', ts.SyntaxKind[typeNode.kind]);
    const arrayMetaType: any = {
      dataType: 'array',
      elementType: _resolve(checker, typeNode.elementType, parent_node),
    };
    return arrayMetaType;
  }

  if (ts.isUnionTypeNode(typeNode)) {
    console.log('UNION TYPE NODE', ts.SyntaxKind[typeNode.kind]);
    const types: any = typeNode.types.map((type) => {
      return _resolve(checker, type, parent_node);
    });
    const unionMetaType = {
      dataType: 'union',
      types,
    };
    return unionMetaType;
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    console.log('INTERSECTION TYPE NODE', typeNode.kind);
    const types: any = typeNode.types.map((type) => {
      return _resolve(checker, type, parent_node);
    });
    const intersectionMetaType = {
      dataType: 'intersection',
      types,
    };
    return intersectionMetaType;
  }

  if (
    typeNode.kind === ts.SyntaxKind.AnyKeyword ||
    typeNode.kind === ts.SyntaxKind.UnknownKeyword
  ) {
    console.log('ANY UNKNOWN', ts.SyntaxKind[typeNode.kind]);
    const literallyAny = {
      dataType: 'any',
    };
    return literallyAny;
  }

  if (ts.isLiteralTypeNode(typeNode)) {
    console.log('LITERAL TYPE NODE', ts.SyntaxKind[typeNode.kind]);
    const enumType = {
      dataType: 'enum',
      enums: [getLiteralValue(typeNode)],
    };
    return enumType;
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    console.log('TYPE LITERAL', ts.SyntaxKind[typeNode.kind]);
    const properties = typeNode.members
      .filter(ts.isPropertySignature)
      .reduce<any>((res, propertySignature) => {
        const type = _resolve(
          checker,
          propertySignature.type as ts.TypeNode,
          propertySignature
        );
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
    const indexMember = typeNode.members.find((member) =>
      ts.isIndexSignatureDeclaration(member)
    );
    let additionalType;
    if (indexMember) {
      const indexSignatureDeclaration =
        indexMember as ts.IndexSignatureDeclaration;
      const indexType = _resolve(
        checker,
        indexSignatureDeclaration.parameters[0].type as ts.TypeNode,
        parent_node
      );
      if (indexType.dataType !== 'string') {
        throw new Error(`Only string indexers are supported.`);
      }
      additionalType = _resolve(
        checker,
        indexSignatureDeclaration.type,
        parent_node
      );
    }
    const objLiteral: any = {
      additionalProperties: indexMember && additionalType,
      dataType: 'nestedObjectLiteral',
      properties,
    };
    return objLiteral;
  }

  if (ts.isMappedTypeNode(typeNode)) {
    console.log('MAPPED TYPE NODE', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'mapped'};
  }

  if (
    ts.isConditionalTypeNode(typeNode) &&
    referencer &&
    ts.isTypeReferenceNode(referencer)
  ) {
    console.log('CONDITIONAL TYPE NODE', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'conditional'};
  }

  //keyof
  if (
    ts.isTypeOperatorNode(typeNode) &&
    typeNode.operator === ts.SyntaxKind.KeyOfKeyword
  ) {
    console.log('TYPE OPERATOR keyof', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'keyof'};
  }

  // Handle `readonly` arrays
  if (
    ts.isTypeOperatorNode(typeNode) &&
    typeNode.operator === ts.SyntaxKind.ReadonlyKeyword
  ) {
    console.log('TYPE OPERATION READONLY', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'readonly'};
  }

  // Indexed by keyword
  if (
    ts.isIndexedAccessTypeNode(typeNode) &&
    (typeNode.indexType.kind === ts.SyntaxKind.NumberKeyword ||
      typeNode.indexType.kind === ts.SyntaxKind.StringKeyword)
  ) {
    console.log('INDEXED ACCESS', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'index by keyword'};
  }

  // Indexed by literal
  if (
    ts.isIndexedAccessTypeNode(typeNode) &&
    ts.isLiteralTypeNode(typeNode.indexType) &&
    (ts.isStringLiteral(typeNode.indexType.literal) ||
      ts.isNumericLiteral(typeNode.indexType.literal))
  ) {
    console.log('INDEXED ACCESS BY LITERAL', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'index by literal'};
  }

  // Indexed by keyof typeof value
  if (
    ts.isIndexedAccessTypeNode(typeNode) &&
    ts.isTypeOperatorNode(typeNode.indexType) &&
    typeNode.indexType.operator === ts.SyntaxKind.KeyOfKeyword
  ) {
    console.log('INDEXED KEYOF TYPEOF', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'indexed keyof typeof'};
  }

  if (ts.isTemplateLiteralTypeNode(typeNode)) {
    console.log('TEMPLATE LITERAL', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'template'};
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    console.log('PARENHESIZED', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'parenth'};
  }

  if (typeNode.kind !== ts.SyntaxKind.TypeReference) {
    console.log('NO REFERENCE', ts.SyntaxKind[typeNode.kind]);
    return {typenode: 'no ref'};
  }

  const typeReference = typeNode as ts.TypeReferenceNode;

  if (typeReference?.typeName?.kind === ts.SyntaxKind.Identifier) {
    console.log('REFERENCE IDENTIFIER', ts.SyntaxKind[typeNode.kind]);
    // return {typenode: 'ref'};
  }

  const referenceType = getReferenceType(checker, typeReference, parent_node);

  if (addToRefTypeMap) {
    AddReferenceType(referenceType);
  }

  return referenceType;
  // console.log('******MISSING******', typeNode.kind);
}

function _get_type_nodes(source_file: ts.Node): Map<ts.TypeNode, ts.Node> {
  const children = source_file.getChildren();
  const map: Map<ts.TypeNode, ts.Node> = new Map();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (ts.isTypeNode(child)) {
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

function _get_primitive_type(node: ts.TypeNode): string | undefined {
  const resolution = attemptToResolveKindToPrimitive(node.kind);
  if (!resolution.foundMatch) {
    return undefined;
  }
  if (resolution.resolvedType === 'number') {
    return 'number';
  } else if (resolution.resolvedType === 'string') {
    return 'string';
  } else if (resolution.resolvedType === 'boolean') {
    return 'boolean';
  } else if (resolution.resolvedType === 'void') {
    return 'void';
  } else if (resolution.resolvedType === 'undefined') {
    return 'undefined';
  } else {
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

function attemptToResolveKindToPrimitive(syntaxKind: ts.SyntaxKind) {
  if (syntaxKind === ts.SyntaxKind.NumberKeyword) {
    return {
      foundMatch: true,
      resolvedType: 'number',
    };
  } else if (syntaxKind === ts.SyntaxKind.StringKeyword) {
    return {
      foundMatch: true,
      resolvedType: 'string',
    };
  } else if (syntaxKind === ts.SyntaxKind.BooleanKeyword) {
    return {
      foundMatch: true,
      resolvedType: 'boolean',
    };
  } else if (syntaxKind === ts.SyntaxKind.VoidKeyword) {
    return {
      foundMatch: true,
      resolvedType: 'void',
    };
  } else if (syntaxKind === ts.SyntaxKind.UndefinedKeyword) {
    return {
      foundMatch: true,
      resolvedType: 'undefined',
    };
  } else {
    return {
      foundMatch: false,
    };
  }
}

function _create_ts_program(options?: GenerateOptions) {
  log.trace('Creating Typescript program...');
  let tsconfig_path = _get_default_tsconfig_path();
  if (
    typeof options?.tsconfig_path === 'string' &&
    options?.tsconfig_path !== ''
  ) {
    tsconfig_path = options.tsconfig_path;
  }
  const config_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile);
  const config_object = config_file.config;
  const parse_result = ts.parseJsonConfigFileContent(
    config_object,
    ts.sys,
    path.dirname(tsconfig_path)
  );
  const compilerOptions = parse_result.options;
  const rootNames = parse_result.fileNames;
  const create_program_options = {
    rootNames: rootNames,
    options: compilerOptions,
  };
  const program = ts.createProgram(create_program_options);
  const checker = program.getTypeChecker();
  return {program, checker};
}

function _get_default_tsconfig_path() {
  return './tsconfig.json';
}

export function printObjectWithCircular(
  obj: any,
  maxDepth: number = 8,
  currentDepth: number = 0,
  seen: Set<any> = new Set(),
  indent: number = 2
) {
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
        printObjectWithCircular(
          obj[key],
          maxDepth,
          currentDepth + 1,
          seen,
          indent
        );
      }
    }

    seen.delete(obj);
  } else {
    if (typeof obj === 'function') {
      console.log(`${' '.repeat(indent * currentDepth)}[FUNCTION]`);
    } else {
      console.log(`${' '.repeat(indent * currentDepth)}${obj}`);
    }
  }
}

export function assertNever(value: any): never {
  throw new Error(
    `Unhandled discriminated union member: ${JSON.stringify(value)}`
  );
}

function getLiteralValue(
  typeNode: ts.LiteralTypeNode
): string | number | boolean | null {
  let value: boolean | number | string | null;
  switch (typeNode.literal.kind) {
    case ts.SyntaxKind.TrueKeyword:
      value = true;
      break;
    case ts.SyntaxKind.FalseKeyword:
      value = false;
      break;
    case ts.SyntaxKind.StringLiteral:
      value = typeNode.literal.text;
      break;
    case ts.SyntaxKind.NumericLiteral:
      value = parseFloat(typeNode.literal.text);
      break;
    case ts.SyntaxKind.NullKeyword:
      value = null;
      break;
    default:
      if (Object.prototype.hasOwnProperty.call(typeNode.literal, 'text')) {
        value = (typeNode.literal as ts.LiteralExpression).text;
      } else {
        throw new Error(
          `Couldn't resolve literal node: ${typeNode.literal.getText()}`
        );
      }
  }
  return value;
}

function getReferenceType(
  checker: ts.TypeChecker,
  node: ts.TypeReferenceType,
  parent_node?: ts.Node,
  addToRefTypeMap = true,
  context: Context = {}
) {
  let type: ts.EntityName;
  if (ts.isTypeReferenceNode(node)) {
    type = node.typeName;
  } else if (ts.isExpressionWithTypeArguments(node)) {
    type = node.expression as ts.EntityName;
  } else {
    throw new Error(`Can't resolve Reference type.`);
  }

  // Can't invoke getText on Synthetic Nodes
  let resolvableName =
    node.pos !== -1 ? node.getText() : (type as ts.Identifier).text;
  console.log(`resolvableName:`, resolvableName);
  if (
    node.pos === -1 &&
    'typeArguments' in node &&
    Array.isArray(node.typeArguments)
  ) {
    // Add typearguments for Synthetic nodes (e.g. Record<> in TestClassModel.indexedResponse)
    const argumentsString = node.typeArguments.map((arg) => {
      if (ts.isLiteralTypeNode(arg)) {
        return `'${String(getLiteralValue(arg))}'`;
      }
      const resolved = attemptToResolveKindToPrimitive(arg.kind);
      if (resolved.foundMatch === false) return 'any';
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
    if (ts.isTypeAliasDeclaration(declaration)) {
      console.log(`isTypeAliasDeclaration TRUE`);
      referenceType = getTypeAliasReference(
        checker,
        declaration,
        name,
        node,
        parent_node,
        addToRefTypeMap
      );
      console.log(`type ALIAS REFERENCE: `, referenceType);
    } else if (ts.isEnumMember(declaration)) {
      referenceType = {
        dataType: 'refEnum',
        // refName: getRefTypeName(name),
        // enums: [current.typeChecker.getConstantValue(declaration)!],
        enumVarnames: [declaration.name.getText()],
        deprecated: isExistJSDocTag(
          declaration,
          (tag) => tag.tagName.text === 'deprecated'
        ),
      };
      console.log(`REFERENCE TYPE: `, referenceType);
    } else {
      referenceType = getModelReference(checker, declaration, name);
    }

    // localReferenceTypeCache[name] = referenceType;

    return referenceType;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`There was a problem resolving type of '${name}'.`);
    throw err;
  }
}

function contextualizedName(name: string, context: Context): string {
  return Object.entries(context).reduce((acc, [key, entry]) => {
    return acc
      .replace(
        new RegExp(`<\\s*([^>]*\\s)*\\s*(${key})(\\s[^>]*)*\\s*>`, 'g'),
        `<$1${entry.getText()}$3>`
      )
      .replace(
        new RegExp(`<\\s*([^,]*\\s)*\\s*(${key})(\\s[^,]*)*\\s*,`, 'g'),
        `<$1${entry.getText()}$3,`
      )
      .replace(
        new RegExp(`,\\s*([^>]*\\s)*\\s*(${key})(\\s[^>]*)*\\s*>`, 'g'),
        `,$1${entry.getText()}$3>`
      )
      .replace(
        new RegExp(`<\\s*([^<]*\\s)*\\s*(${key})(\\s[^<]*)*\\s*<`, 'g'),
        `<$1${entry.getText()}$3<`
      );
  }, name);
}

export type ReferenceType = {};

export interface ReferenceTypeMap {
  [refName: string]: ReferenceType;
}

const referenceTypeMap: any = {};

function AddReferenceType(referenceType: any) {
  if (!referenceType.refName) {
    return;
  }
  referenceTypeMap[referenceType.refName] = referenceType;
}

function typeArgumentsToContext(
  type: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments,
  targetEntity: ts.EntityName,
  context: Context,
  typeChecker: ts.TypeChecker
): Context {
  context = {};

  const declaration = getModelTypeDeclaration(targetEntity, typeChecker);
  const typeParameters =
    'typeParameters' in declaration ? declaration.typeParameters : undefined;

  if (typeParameters) {
    for (let index = 0; index < typeParameters.length; index++) {
      const typeParameter = typeParameters[index];
      const typeArg = type.typeArguments && type.typeArguments[index];
      let resolvedType: ts.TypeNode;

      // Argument may be a forward reference from context
      if (
        typeArg &&
        ts.isTypeReferenceNode(typeArg) &&
        ts.isIdentifier(typeArg.typeName) &&
        context[typeArg.typeName.text]
      ) {
        resolvedType = context[typeArg.typeName.text];
      } else if (typeArg) {
        resolvedType = typeArg;
      } else if (typeParameter.default) {
        resolvedType = typeParameter.default;
      } else {
        throw new Error(
          `Could not find a value for type parameter ${typeParameter.name.text}`
        );
      }

      context = {
        ...context,
        [typeParameter.name.text]: resolvedType,
      };
    }
  }
  return context;
}

type UsableDeclaration =
  | ts.InterfaceDeclaration
  | ts.ClassDeclaration
  | ts.PropertySignature
  | ts.TypeAliasDeclaration
  | ts.EnumMember;
type UsableDeclarationWithoutPropertySignature = Exclude<
  UsableDeclaration,
  ts.PropertySignature
>;

function getModelTypeDeclaration(type: ts.EntityName, checker: ts.TypeChecker) {
  let typeName: string =
    type.kind === ts.SyntaxKind.Identifier ? type.text : type.right.text;

  const symbol = getSymbolAtLocation(type, checker);
  const declarations = symbol?.getDeclarations();

  if (!declarations) {
    throw new Error(`No declarations found for referenced type ${typeName}.`);
  }

  if (symbol.escapedName !== typeName && symbol.escapedName !== 'default') {
    typeName = symbol.escapedName as string;
  }

  let modelTypes = declarations.filter(
    (node): node is UsableDeclarationWithoutPropertySignature => {
      return nodeIsUsable(node) && (node as any).name?.getText() === typeName;
    }
  );

  if (!modelTypes.length) {
    throw new Error(`No matching model found for referenced type ${typeName}.`);
  }

  if (modelTypes.length > 1) {
    // remove types that are from typescript e.g. 'Account'
    modelTypes = modelTypes.filter((modelType) => {
      return (
        modelType
          .getSourceFile()
          .fileName.replace(/\\/g, '/')
          .toLowerCase()
          .indexOf('node_modules/typescript') <= -1
      );
    });

    modelTypes = getDesignatedModels(modelTypes, typeName);
  }
  if (modelTypes.length > 1) {
    const conflicts = modelTypes
      .map((modelType) => modelType.getSourceFile().fileName)
      .join('"; "');
    throw new Error(
      `Multiple matching models found for referenced type ${typeName}; please make model names unique. Conflicts found: "${conflicts}".`
    );
  }

  return modelTypes[0];
}

function getSymbolAtLocation(type: ts.Node, typeChecker: ts.TypeChecker) {
  const symbol =
    typeChecker.getSymbolAtLocation(type) ||
    ((type as any).symbol as ts.Symbol);
  // resolve alias if it is an alias, otherwise take symbol directly
  return (
    (symbol &&
      hasFlag(symbol, ts.SymbolFlags.Alias) &&
      typeChecker.getAliasedSymbol(symbol)) ||
    symbol
  );
}

function hasFlag(
  type: ts.Symbol | ts.Declaration,
  flag: ts.NodeFlags | ts.SymbolFlags
) {
  return (type.flags & flag) === flag;
}

function getDesignatedModels<T extends ts.Node>(
  nodes: T[],
  typeName: string
): T[] {
  /**
   * Model is marked with '@tsoaModel', indicating that it should be the 'canonical' model used
   */
  const designatedNodes = nodes.filter((enumNode) => {
    return isExistJSDocTag(enumNode, (tag) => tag.tagName.text === 'tsoaModel');
  });
  if (designatedNodes.length > 0) {
    if (designatedNodes.length > 1) {
      throw new Error(
        `Multiple models for ${typeName} marked with '@tsoaModel'; '@tsoaModel' should only be applied to one model.`
      );
    }

    return designatedNodes;
  }
  return nodes;
}

function isExistJSDocTag(
  _node: ts.Node,
  _isMatching: (tag: ts.JSDocTag) => boolean
) {
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

function getEnumerateType(
  typeName: ts.EntityName,
  typeChecker: ts.TypeChecker
): any | undefined {
  const enumName = (typeName as ts.Identifier).text;

  const symbol = getSymbolAtLocation(typeName, typeChecker);

  // resolve value
  let declaredType = (typeChecker.getDeclaredTypeOfSymbol(symbol)?.symbol ||
    symbol) as ts.Symbol & {parent?: ts.Symbol};

  // if we are a EnumMember, return parent instead (this happens if a enum has only one entry, not quite sure why though...)
  if (
    hasFlag(declaredType, ts.SymbolFlags.EnumMember) &&
    declaredType.parent?.valueDeclaration?.kind ===
      ts.SyntaxKind.EnumDeclaration
  ) {
    declaredType = declaredType.parent;
  }

  const declarations = declaredType.getDeclarations();

  if (!declarations) {
    return;
  }

  let enumNodes = declarations.filter((node): node is ts.EnumDeclaration => {
    return ts.isEnumDeclaration(node) && node.name.getText() === enumName;
  });

  if (!enumNodes.length) {
    return;
  }

  enumNodes = getDesignatedModels(enumNodes, enumName);

  if (enumNodes.length > 1) {
    throw new Error(
      `Multiple matching enum found for enum ${enumName}; please make enum names unique.`
    );
  }

  const enumDeclaration = enumNodes[0];

  const isNotUndefined = <T>(item: T): item is Exclude<T, undefined> => {
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
    deprecated: isExistJSDocTag(
      enumDeclaration,
      (tag) => tag.tagName.text === 'deprecated'
    ),
  };
}

function nodeIsUsable(node: ts.Node): node is any {
  switch (node.kind) {
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.EnumMember:
      return true;
    default:
      return false;
  }
}

function createCircularDependencyResolver(refName: string) {
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

const circularDependencyResolvers = new Array<
  (referenceTypes: ReferenceTypeMap) => void
>();

function OnFinish(callback: (referenceTypes: ReferenceTypeMap) => void) {
  circularDependencyResolvers.push(callback);
}

function getTypeAliasReference(
  checker: ts.TypeChecker,
  declaration: ts.TypeAliasDeclaration,
  name: string,
  referencer: ts.TypeReferenceType,
  parent_node?: ts.Node,
  addToRefTypeMap = true
): ReferenceType {
  const example = getNodeExample(declaration);

  return {
    dataType: 'refAlias',
    // default: getJSDocComment(declaration, 'default'),
    // description: getNodeDescription(declaration),
    refName: getRefTypeName(name),
    format: getNodeFormat(declaration),
    type: _resolve(
      checker,
      declaration.type,
      parent_node,
      referencer,
      addToRefTypeMap
    ),
    // validators: getPropertyValidators(declaration) || {},
    ...(example && {example}),
  };
}

function getRefTypeName(name: string): string {
  return encodeURIComponent(
    name
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

function getNodeFormat(
  node:
    | UsableDeclaration
    | ts.PropertyDeclaration
    | ts.ParameterDeclaration
    | ts.EnumDeclaration
) {
  return getJSDocComment(node, 'format');
}

function getJSDocComment(node: ts.Node, tagName: string) {
  const comments = getJSDocComments(node, tagName);
  if (comments && comments.length !== 0) {
    return comments[0];
  }
  return;
}

function getJSDocComments(node: ts.Node, tagName: string) {
  const tags = getJSDocTags(
    node,
    (tag) => tag.tagName.text === tagName || tag.tagName.escapedText === tagName
  );
  if (tags.length === 0) {
    return;
  }
  const comments: string[] = [];
  tags.forEach((tag) => {
    const comment = commentToString(tag.comment);
    if (comment) comments.push(comment);
  });
  return comments;
}

function getJSDocTags(
  node: ts.Node,
  isMatching: (tag: ts.JSDocTag) => boolean
) {
  const jsDocs = (node as any).jsDoc as ts.JSDoc[];
  if (!jsDocs || jsDocs.length === 0) {
    return [];
  }
  const jsDoc = jsDocs[0];
  if (!jsDoc.tags) {
    return [];
  }
  return jsDoc.tags.filter(isMatching);
}

function commentToString(
  comment?: string | ts.NodeArray<ts.JSDocText | ts.JSDocLink | ts.JSDocComment>
): string | undefined {
  if (typeof comment === 'string') {
    return comment;
  } else if (comment) {
    return comment.map((node) => node.text).join(' ');
  }
  return undefined;
}

function getModelReference(
  typeChecker: ts.TypeChecker,
  modelType: ts.InterfaceDeclaration | ts.ClassDeclaration,
  name: string
) {
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
  if (
    toJSON &&
    toJSON.valueDeclaration &&
    (ts.isMethodDeclaration(toJSON.valueDeclaration) ||
      ts.isMethodSignature(toJSON.valueDeclaration))
  ) {
    let nodeType = toJSON.valueDeclaration.type;
    if (!nodeType) {
      const signature = typeChecker.getSignatureFromDeclaration(
        toJSON.valueDeclaration
      );
      const implicitType = typeChecker.getReturnTypeOfSignature(signature!);
      nodeType = typeChecker.typeToTypeNode(
        implicitType,
        undefined,
        ts.NodeBuilderFlags.NoTruncation
      ) as ts.TypeNode;
    }
    // const type = new TypeResolver(nodeType, this.current).resolve();
    const type = _resolve(typeChecker, nodeType);
    const referenceType: ReferenceType = {
      refName: getRefTypeName(name),
      dataType: 'refAlias',
      description,
      type,
      validators: {},
      deprecated,
      ...(example && {example}),
    };
    return referenceType;
  }

  const properties = getModelProperties(modelType);
  const additionalProperties = getModelAdditionalProperties(modelType);
  const inheritedProperties = getModelInheritedProperties(modelType) || [];

  const referenceType: ReferenceType & {properties: Property[]} = {
    additionalProperties,
    dataType: 'refObject',
    description,
    properties: inheritedProperties,
    refName: getRefTypeName(name),
    deprecated,
    ...(example && {example}),
  };

  referenceType.properties = referenceType.properties.concat(properties);

  return referenceType;
}

// function getNodeExample(typeChecker:ts.TypeChecker, node: UsableDeclaration | ts.PropertyDeclaration | ts.ParameterDeclaration | ts.EnumDeclaration) {
function getNodeExample(
  node:
    | UsableDeclaration
    | ts.PropertyDeclaration
    | ts.ParameterDeclaration
    | ts.EnumDeclaration
) {
  const exampleJSDoc = getJSDocComment(node, 'example');
  if (exampleJSDoc) {
    return safeFromJson(exampleJSDoc);
  }

  // return getNodeFirstDecoratorValue(node, typeChecker, dec => dec.text === 'Example');
  // TODO
  return {};
}

function getNodeDescription(
  typeChecker: ts.TypeChecker,
  node:
    | UsableDeclaration
    | ts.PropertyDeclaration
    | ts.ParameterDeclaration
    | ts.EnumDeclaration
) {
  const symbol = getSymbolAtLocation(node.name as ts.Node, typeChecker);
  if (!symbol) {
    return undefined;
  }

  /**
   * TODO: Workaround for what seems like a bug in the compiler
   * Warrants more investigation and possibly a PR against typescript
   */
  if (node.kind === ts.SyntaxKind.Parameter) {
    // TypeScript won't parse jsdoc if the flag is 4, i.e. 'Property'
    symbol.flags = 0;
  }

  const comments = symbol.getDocumentationComment(typeChecker);
  if (comments.length) {
    return ts.displayPartsToString(comments);
  }

  return undefined;
}

function safeFromJson(json: string) {
  try {
    return JSON.parse(json);
  } catch {
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

function getModelProperties(
  node: ts.InterfaceDeclaration | ts.ClassDeclaration,
  overrideToken?: OverrideToken
): Property[] {
  const isIgnored = (e: ts.TypeElement | ts.ClassElement) => {
    return isExistJSDocTag(e, (tag) => tag.tagName.text === 'ignore');
  };

  // Interface model
  if (ts.isInterfaceDeclaration(node)) {
    return node.members
      .filter(
        (member): member is ts.PropertySignature =>
          !isIgnored(member) && ts.isPropertySignature(member)
      )
      .map((member: ts.PropertySignature) =>
        propertyFromSignature(member, overrideToken)
      );
  }

  const properties: Array<ts.PropertyDeclaration | ts.ParameterDeclaration> =
    [];

  for (const member of node.members) {
    if (
      !isIgnored(member) &&
      ts.isPropertyDeclaration(member) &&
      !this.hasStaticModifier(member) &&
      this.hasPublicModifier(member)
    ) {
      properties.push(member);
    }
  }

  const classConstructor = node.members.find((member) =>
    ts.isConstructorDeclaration(member)
  ) as ts.ConstructorDeclaration;

  if (classConstructor && classConstructor.parameters) {
    const constructorProperties = classConstructor.parameters.filter(
      (parameter) => this.isAccessibleParameter(parameter)
    );

    properties.push(...constructorProperties);
  }

  return properties.map((property) =>
    propertyFromDeclaration(property, overrideToken)
  );
}

function propertyFromSignature(
  propertySignature: ts.PropertySignature,
  overrideToken?: OverrideToken
) {
  const identifier = propertySignature.name as ts.Identifier;

  if (!propertySignature.type) {
    throw new Error(`No valid type found for property declaration.`);
  }

  let required = !propertySignature.questionToken;
  if (overrideToken && overrideToken.kind === ts.SyntaxKind.MinusToken) {
    required = true;
  } else if (
    overrideToken &&
    overrideToken.kind === ts.SyntaxKind.QuestionToken
  ) {
    required = false;
  }

  const property: Property = {
    default: getJSDocComment(propertySignature, 'default'),
    description: this.getNodeDescription(propertySignature),
    example: this.getNodeExample(propertySignature),
    format: this.getNodeFormat(propertySignature),
    name: identifier.text,
    required,
    type: new TypeResolver(
      propertySignature.type,
      this.current,
      propertySignature.type.parent,
      this.context,
      propertySignature.type
    ).resolve(),
    validators: getPropertyValidators(propertySignature) || {},
    deprecated: isExistJSDocTag(
      propertySignature,
      (tag) => tag.tagName.text === 'deprecated'
    ),
    extensions: this.getNodeExtension(propertySignature),
  };
  return property;
}

function propertyFromDeclaration(
  checker: ts.TypeChecker,
  propertyDeclaration: ts.PropertyDeclaration | ts.ParameterDeclaration,
  overrideToken?: OverrideToken
) {
  const identifier = propertyDeclaration.name as ts.Identifier;
  let typeNode = propertyDeclaration.type;

  if (!typeNode) {
    const tsType =
      this.current.typeChecker.getTypeAtLocation(propertyDeclaration);
    typeNode = this.current.typeChecker.typeToTypeNode(
      tsType,
      undefined,
      ts.NodeBuilderFlags.NoTruncation
    );
  }

  if (!typeNode) {
    throw new Error(`No valid type found for property declaration.`);
  }

  // const type = new TypeResolver(typeNode, this.current, propertyDeclaration, this.context, typeNode).resolve();
  const type = _resolve(checker, typeNode.elementType, parent_node);

  let required =
    !propertyDeclaration.questionToken && !propertyDeclaration.initializer;
  if (overrideToken && overrideToken.kind === ts.SyntaxKind.MinusToken) {
    required = true;
  } else if (
    overrideToken &&
    overrideToken.kind === ts.SyntaxKind.QuestionToken
  ) {
    required = false;
  }

  const property: Property = {
    default: getInitializerValue(
      propertyDeclaration.initializer,
      this.current.typeChecker
    ),
    description: this.getNodeDescription(propertyDeclaration),
    example: this.getNodeExample(propertyDeclaration),
    format: this.getNodeFormat(propertyDeclaration),
    name: identifier.text,
    required,
    type,
    validators: getPropertyValidators(propertyDeclaration) || {},
    // class properties and constructor parameters may be deprecated either via jsdoc annotation or decorator
    deprecated:
      isExistJSDocTag(
        propertyDeclaration,
        (tag) => tag.tagName.text === 'deprecated'
      ) ||
      isDecorator(
        propertyDeclaration,
        (identifier) => identifier.text === 'Deprecated'
      ),
    extensions: this.getNodeExtension(propertyDeclaration),
  };
  return property;
}

function getModelAdditionalProperties(node: UsableDeclaration) {
  if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
    const interfaceDeclaration = node;
    const indexMember = interfaceDeclaration.members.find(
      (member) => member.kind === ts.SyntaxKind.IndexSignature
    );
    if (!indexMember) {
      return undefined;
    }

    const indexSignatureDeclaration =
      indexMember as ts.IndexSignatureDeclaration;
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

function getModelInheritedProperties(
  modelTypeDeclaration: Exclude<
    UsableDeclaration,
    ts.PropertySignature | ts.TypeAliasDeclaration | ts.EnumMember
  >
): Property[] {
  let properties: Property[] = [];

  const heritageClauses = modelTypeDeclaration.heritageClauses;
  if (!heritageClauses) {
    return properties;
  }

  for (const clause of heritageClauses) {
    if (!clause.types) {
      continue;
    }

    for (const t of clause.types) {
      const baseEntityName = t.expression as ts.EntityName;

      // create subContext
      const resetCtx = this.typeArgumentsToContext(
        t,
        baseEntityName,
        this.context
      );

      const referenceType = this.getReferenceType(t, false);
      if (referenceType) {
        if (referenceType.dataType === 'refEnum') {
          // since it doesn't have properties to iterate over, then we don't do anything with it
        } else if (referenceType.dataType === 'refAlias') {
          let type: Tsoa.Type = referenceType;
          while (type.dataType === 'refAlias') {
            type = type.type;
          }

          if (type.dataType === 'refObject') {
            properties = [...properties, ...type.properties];
          } else if (type.dataType === 'nestedObjectLiteral') {
            properties = [...properties, ...type.properties];
          }
        } else if (referenceType.dataType === 'refObject') {
          (referenceType.properties || []).forEach((property) =>
            properties.push(property)
          );
        } else {
          assertNever(referenceType);
        }
      }

      // reset subContext
      this.context = resetCtx;
    }
  }

  return properties;
}
