/**
 *
 * Utils module
 *
 * @packageDocumentation
 *
 */
type NoUndefinedProperties<T> = {
    [P in keyof T]: NonNullable<T[P]>;
};
export declare function no_undefined<T extends object>(obj: T): NoUndefinedProperties<T>;
export {};
