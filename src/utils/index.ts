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

export function no_undefined<T extends object>(
  obj: T
): NoUndefinedProperties<T> {
  return JSON.parse(JSON.stringify(obj));
}
