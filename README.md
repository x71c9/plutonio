# Plutonio

Plutonio is a Typescript library that scans your typescript project and generate
a schema of all types and interfaces of the project.

The schema is the following:

```typescript
type Schema = {
  [file_path: string]: {
    imports?: Import[];
    interfaces?: {
      [name: string]: {
        extends: string[];
        full_text: string;
        properties: Properties;
        type: Primitive;
      };
    };
    types?: {
      [name: string]: {
        full_text: string;
        properties: Properties;
        type: Primitive;
      };
    };
  };
};

type Import = {
  clause: string;
  module: string;
  specifiers: string[];
  text: string;
};

type Properties = {
  [k: string]: {
    enum?: string[];
    original?: string;
    properties?: Properties;
    type: Primitive;
  };
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
  'src/index.ts': {
    interfaces: {
      Product: {
        full_text:
          'export interface Product extends Foo.Boo {title: string, price: number}',
        properties: {
          title: {
            type: 'string',
          },
          price: {
            type: 'number',
          },
        },
        type: 'object',
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
