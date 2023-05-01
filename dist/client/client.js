"use strict";
/**
 *
 * Client class
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlutonioClient = void 0;
const connection_1 = require("./connection");
const dal_1 = require("./dal");
class PlutonioClient extends connection_1.ConnectionClient {
    constructor() {
        super();
        this._connection = this.connect();
        this.user = new dal_1.DataAccessLayer({
            connection: this._connection,
            atom_name: 'user',
        });
    }
}
exports.PlutonioClient = PlutonioClient;
//# sourceMappingURL=client.js.map