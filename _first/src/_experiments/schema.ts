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
	
	// export type key = string & {__type: 'key'}
	export type key = string
	
	export type primary_key = string
	export type email = string
	export type unique<T> = T
	export abstract class Atom {
		// public abstract properties: {[k:string]: any}
	}
	
	export type Validation = {
		[k:string]: AttributeValidation
	}
	
	type AttributeValidation = {
		alphanum?: boolean
		length?: number
		reg_ex?: string
	}
	
	export type PickSubType<Base, Condition> = Pick<Base, {
		[Key in keyof Base]: Base[Key] extends Condition ? Key : never
	}[keyof Base]>;
	
	export type OmitSubType<Base, Condition> = Omit<Base, {
		[Key in keyof Base]: Base[Key] extends Condition ? Key : never
	}[keyof Base]>;
	
	
	// type ExtractLogAtom<P> = PickSubType<P, {connection: 'log'}>;
	
	// type ExtractOptional<P> = PickSubType<P, {optional: true}>;
	
	// type ExcludeOptional<P> = OmitSubType<P, {optional: true}>;
	
	type keys<T extends Atom> = keyof PickSubType<T, key>
	
	// export type one_to_one<T extends Atom,_A_ extends keys<T>> = T | undefined
	// export type one_to_many<T extends Atom,_A_ extends keys<T>> = T[] | undefined
	// export type many_to_many<T extends Atom> = T | undefined

	export type relation<T extends Atom, _A_ extends keys<T>> = T | undefined
	
	export type Unique<T> = T
	
	export type SubAtom = {}
	
	// export type f<T> = ReturnType<(a:T) => T>
	// export type f<T> = (a:T) => T
	
}

export interface User extends uranio.Atom{
	id: uranio.primary_key
	name: string
	email: uranio.unique<uranio.email>
	age: number
	// thumb: uranio.one_to_one<Thumb, 'user'>
	// addresses: uranio.one_to_many<Address, 'user'>
	// orders: uranio.one_to_many<Order, 'user'>
	orders: Order[]
	contacts: Contact
	salary: {
		amount: number
	}
}

type Contact = {
	phone: string
}

export interface Order extends uranio.Atom {
	id: uranio.primary_key
	total: number
	// user: uranio.key
	user: uranio.relation<User, 'id'>
}

export interface Thumb extends uranio.Atom {
	src: string
	user: uranio.key
}

export interface Address extends uranio.Atom{
	id: uranio.primary_key
	street: string
	user: uranio.key
	// city: uranio.many_to_many<City>
	city: uranio.relation<City,'id'>
}

export interface City extends uranio.Atom, uranio.SubAtom{
	id: uranio.primary_key
	name: string
	address: string
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
