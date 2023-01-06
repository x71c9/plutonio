namespace uranio {
	export type atom = {
		unique?: string[]
		search?: string[]
		properties: {
			[k:string]: any
		}
		validation: {
			[k:string]: validation
		}
	}
	export type validation = {
		
	}
	export type id = string
	export type email = string
	export type unique<T> = T
	export abstract class Atom {
		public abstract properties: {[k:string]: any}
	}
	
	export type Validation = {
		[k:string]: AttributeValidation
	}
	
	type AttributeValidation = {
		alphanum?: boolean
		length?: number
		reg_ex?: string
	}
	
	export type one_to_one<T,_A_> = T;
	export type one_to_many<T,_A_> = T;
	export type many_to_many<T> = T;
	
	export type Unique<T> = T
	
	export type SubAtom = {}
	
	// export type f<T> = ReturnType<(a:T) => T>
	// export type f<T> = (a:T) => T
	
}

export interface User extends uranio.Atom{
	id: uranio.id
	name: string
	email: uranio.unique<uranio.email>
	age: number
	thumb: uranio.one_to_one<Thumb, 'user'>
	addresses?: uranio.one_to_many<Address[], 'user'>
	
	contacts: Contact
	salary: {
		amount: number
	}
}

type Contact = {
	phone: string
}

export interface Thumb extends uranio.Atom {
	src: string
	user: string
}

export interface Address extends uranio.Atom{
	id: uranio.id
	street: string
	city: uranio.many_to_many<City>
}

export interface City extends uranio.Atom, uranio.SubAtom{
	id: uranio.id
	name: string
}

export interface UserValidation extends uranio.Validation{
	email: {
		alphanum: true
		length: 10
		reg_ex: '/[a-Z]/'
	}
}


export interface book extends uranio.atom {
	unique: ['title'],
	validation: {
		title: {
			
		}
	}
}

// export class Book implements uranio.Atom {
// 	public properties 
// }
