# A NEW URANIO

## Things that URANIO does right now

- It creates relations on a database.
- It creates data access layer (DAL).
- It creates access control layer (ACL).
- It creates business logic layer (BLL).
- It creates the authentication methods.
- It validates the object and the fields when accessing the database.
- It creates a web serivce for the API.
- It creates the SDK for querying the Web Service API.
- It creates an Admin Panel that uses the SDK.
- It creates custom BLL methods.
- It creates custom API methods.
- It needs the `uranio` CLI for generating the types and the SDK.

## Things that the NEW URANIO will do

- It creates relations on a database.
- It creates data access layer (DAL).
- It validates the object and the fields when accessing the database.

## How the NEW URANIO works

A typescript framework that creates tables on a database by reading directly
the typescript types.

For example:

```
export type book {
	title: string
	description?: string
	price: number
	author: string
}
```

it create a Book relation in a database with the same fields.

```
// uranio-plural: books
export interface book extends uranio.atom {
	security: {
		type: uranio.security.uniform
		_r: uranio.security.public
		_w: uranio.security.nobody
	}
	unique: 'title' | 'isbn'
	search: 'title' | 'description'
	properties: {
		title: uranio.text
		description?: uranio.long_text
		price: uranio.float.price
		author: uranio.text
		isbn: uranio.text
	}
	validation: {
		title: {
			alphanum: true
			contain_digit: true
			contain_lowercase: true
			contain_uppercase: true
			length: 10
			lowercase: true
			max: 20
			min: 2
			only_letters: true
			only_numbers: true
			reg_ex: /[a-Z]/
			uppercase: true
		}
	}
}
```

```
const books = await uranio.book.find({author: 'Pippo'});
```

It doesn't need `uranio-cli`? How creates the relations?
If you run:
```
uranio.init();
```
Can it look for types? Maybe in a certain directory?


```
const books = await uranio.find('book', {author: 'Pippo'});
const books = await uranio.find<'book'>('book', {author: 'Pippo'});
```

Custom validation

No Custom bll?

**It must allow the compilation to one JS file only**

It must work on Serverless Lambda functions.


