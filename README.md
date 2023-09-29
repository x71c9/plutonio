# Plutonio

Plutonio is a Typescript library that scan your typescript project and generate
a schema of all types and interfaces of the project.

The schema is in the following format:

```typescript
type Primitive =
  | 'boolean'
  | 'number'
  | 'string'
  | 'object'
  | 'undefined'
  | 'null'
  | 'any';

type Properties = {
  [k: string]: {
    type: Primitive;
    text: string;
    properties?: Properties;
  };
};

type Import = {
  text: string;
  module: string;
  clause: string;
  specifiers: string[];
};

type Schema = {
  [file_path: string]: {
    types?: {
      [name: string]: {
        type: Primitive;
        full_text: string;
        properties: Properties;
      };
    };
    interfaces?: {
      [name: string]: {
        type: Primitive;
        full_text: string;
        properties: Properties;
        extends: string[];
      };
    };
    imports?: Import[];
  };
};
```

An example of a schema is the following:

```js
const schema = {
  'src/index.ts': {
    interfaces: {
      Product: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
          price: {
            type: 'number',
          },
        },
        full_text:
          'export interface Product extends Foo.Boo {title: string, price: number}',
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
