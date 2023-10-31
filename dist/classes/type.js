/**
 *
 * Type class module
 *
 * @packageDocumentation
 *
 */
import { ion } from '../log/index.js';
export class Type {
    constructor(name, source_file) {
        this.name = name;
        this.source_file = source_file;
        ion.trace(`Creating Type ${name} ...`);
        this.tjsg_type_schema = this._resolve_tjsg_schema();
        this.tjsg_type_definition = this._resolve_tjsg_definition();
        this.node = this._resolve_node();
    }
    generate_schema() {
        const text = this.node.node.getText();
        const original = typeof text === 'string' && text !== '' ? text : undefined;
        const type_schema = {
            name: this.name,
            type: _resolve_type(this.tjsg_type_definition, this.name),
            original,
            enum: this._resolve_enum(),
            imports: this._resolve_imports(),
            properties: _resolve_all_properties(this.tjsg_type_definition, this.node.node, this.name, this.source_file),
        };
        return utils.no_undefined(type_schema);
    }
    _resolve_tjsg_schema() {
        const tjsg_type_schema = this.source_file.tjsg_generator.createSchema(this.name);
        // console.log(JSON.stringify(tjsg_type_schema, null, 2));
        ion.debug(tjsg_type_schema);
        return tjsg_type_schema;
    }
    _resolve_tjsg_definition() {
        const definitions = this.tjsg_type_schema.definitions;
        if (!definitions || typeof definitions !== 'object') {
            throw new Error(`Missing tjsg definitions`);
        }
        const main_definition = definitions[this.name];
        if (!main_definition || typeof main_definition === 'boolean') {
            throw new Error(`Missing tjsg definition for ${this.name}`);
        }
        return main_definition;
    }
    _resolve_node() {
        if (this.source_file.nodes.has(this.name)) {
            return this.source_file.nodes.get(this.name);
        }
        console.log(this.source_file.imports);
        throw new Error(`Cannot resolve node`);
    }
    _resolve_imports() {
        return this.source_file.imports;
    }
    _resolve_enum() {
        return undefined;
    }
}
//# sourceMappingURL=type.js.map