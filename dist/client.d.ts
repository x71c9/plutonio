/**
 *
 * Client class
 *
 */
import { ClientConnection } from './connection';
import { DataAccessLayer } from './dal';
import { User } from './types';
export declare class PlutonioClient extends ClientConnection {
    user: DataAccessLayer<User>;
    constructor();
}
