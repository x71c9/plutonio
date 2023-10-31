/**
 *
 * Generate type module
 *
 * @packageDocumentation
 *
 */
import ts from 'typescript';
export type GenerateParams = {
    tsconfig_path: string;
    source_file_path: string;
    type_name: string;
};
export type NodeWrap = {
    type: 'type' | 'interface';
    node: ts.Node;
};
export type Import = {
    clause: string;
    module: string;
    specifiers: string[];
    text: string;
};
export type TypeSchema = Property & {
    name: string;
    imports: Import[];
};
export type Properties = {
    [k: string]: Property;
};
export type Property = {
    type: Primitive;
    original?: string;
    enum?: Primitive[];
    properties?: Properties;
};
export type Primitive = 'any' | 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string' | 'undefined';
