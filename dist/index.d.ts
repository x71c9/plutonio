/**
 *
 * Index module
 *
 */
export type unique<T> = T;
export type atom = {
    _id: string;
};
export type key = string;
export type mine<T> = Other<T>
type Other<T> = Omit<MediaE,T>
interface MediaE {
  this?: number
}

export type your<R> = {
  this: R
}







