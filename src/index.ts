
export namespace uranio {
	export namespace security {
		export enum structure {
			uniform = 'UNIFORM',
			granular = 'GRANULAR'
		}
		export enum permission {
			public = 'PUBLIC',
			nobody = 'NOBODY'
		}
	}
	export type text = string;
	export type long_text = string;
	export type float = number;
	export namespace float {
		export type price = number;
	}
	export type set<E> = typeof Set<E>
}

export interface book {
	security: {
		type: uranio.security.structure.uniform
		_r: uranio.security.permission.public
		_w: uranio.security.permission.nobody
	}
	unique: 'title' | 'isbn'
	search: 'title' | 'description'
	properties: {
		title: uranio.text
		description?: uranio.long_text
		price: uranio.float.price
		author: uranio.text
		isbn: uranio.text
		category: uranio.set<'horror' | 'classic'>
	}
	validation: {
		title: {
			alphanum: true
			regex: '/[a-z]/'
			max: 20
		}
	}
}
