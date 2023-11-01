/**
 *
 * Scanner index module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
export declare function scanner(): void;
export declare function _get_name(node: ts.Node & {
    name: ts.Node;
}): string;
export declare function _get_nested_children<T extends ts.Node>(node: ts.Node, kind: ts.SyntaxKind): T[];
export declare function _has_first_level_child(node: ts.Node, kind: ts.SyntaxKind): boolean;
export declare function _get_first_level_child<T extends ts.Node>(node: ts.Node, kind: ts.SyntaxKind): T | undefined;
export declare function _get_first_level_children<T extends ts.Node>(node: ts.Node, kind: ts.SyntaxKind): T[];
