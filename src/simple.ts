
namespace uranio {
	export type id = string
	export type email = string
	
	export type unique<T> = T;
	export type default_value<T, _D_> = T
	
	export type atom = {
		_id: uranio.id
	}
	
	// export type uniques<T> = {
	// 	[k in keyof T]: boolean
	// }
	// export type defaults<T> = {
	// 	[k in keyof T]?: any
	// }
}

interface common {
	_date: uranio.default_value<Date, 'NOW()'>
}

// export const CommonDefaults:uranio.defaults<common> = {
// 	_date: 'NOW()',
// }

// export interface CommondDefaults extends uranio.defaults<common>{
// 	_date: 'NOW()'
// }

export interface Product extends uranio.atom, common{
	title: string
	collections?: Collection[]
	variants: Variant[]
	medias?: Media[]
	tags?: Tag[]
}

export interface Collection extends uranio.atom, common{
	title: string
	products: Product[]
	media: Media
	tags: Tag[]
}

export interface Variant extends uranio.atom, common{
	price: number
	product: Product
	medias: Media[]
	tags: Tag[]
}

export interface Media extends uranio.atom, common{
	src: string
}

export interface Tag extends uranio.atom, common{
	name: string
}

export interface User extends uranio.atom, common{
	name: string
	email: uranio.unique<uranio.email>
	username: uranio.unique<string>
	media?: Media
}

// export interface UserUniques extends uranio.uniques<User>{
// 	email: true
// 	ursername: true
// }

export const p:Product = {
	_id: '',
	_date: new Date(),
	title: '',
	variants: []
}

