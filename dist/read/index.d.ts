/**
 *
 * Generate module
 *
 */
type ReadOption = {
    tsconfig_path?: string;
};
export declare function read(options?: ReadOption): Map<string, Schemas>;
type Schema = {
    [k: string]: any;
};
type Schemas = {
    [k: string]: Schema;
};
export {};
