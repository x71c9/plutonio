# Plutonio

Plutonio is a Typescript library that scans your typescript project and generate
a schema of all types and interfaces of the project.

The schema is the following:

```typescript
type Schema = {
    name: string;
    category: Category;
    type: Primitive;
    original?: string;
    enum?: string[];
    imports: Import[];
    properties?: {
        [k:string]: Schema
    }
};

type Category = 'type' | 'interface';

type Import = {
  clause: string;
  module: string;
  specifiers: string[];
  text: string;
};

type Primitive =
  | 'any';
  | 'boolean'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'undefined'

```

An example of a schema is the following:

```js
const schema = {
    name: 'Product',
    category: 'interface',
    type: 'object',
    original: 'export interface Product extends Foo.Boo {title: string, price: number}',
    properties: {
        title: {
            type: 'string',
        },
        price: {
            type: 'number',
        },
    },
    imports: [
        {
            text: 'import Foo from "foo"',
            module: 'foo',
            clause: 'Foo',
            specifiers: [],
        },
    ],
},
};
```
