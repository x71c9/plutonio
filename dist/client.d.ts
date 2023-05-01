/**
 *
 * Client class
 *
 */
import { ConnectionClient } from './connection';
import { DataAccessLayer } from './dal';
import { User } from './types';
export declare class PlutonioClient extends ConnectionClient {
    user: DataAccessLayer<User>;
    constructor();
}
