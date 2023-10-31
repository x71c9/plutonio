/**
 *
 * Utils module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
type NoUndefinedProperties<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};
export declare function no_undefined<T extends object>(obj: T): NoUndefinedProperties<T>;
export declare function get_nested_of_type<T extends ts.Node>(node: ts.Node, kind: ts.SyntaxKind): T[];
export {};
