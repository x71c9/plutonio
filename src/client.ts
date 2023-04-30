/**
 *
 * Client class
 *
 */

import {ClientConnection} from './connection';
import {DataAccessLayer} from './dal';
import {User} from './types';

export class PlutonioClient extends ClientConnection {
  public user: DataAccessLayer<User>;
  constructor() {
    super();
    this.connect();
    // TODO: Connection undefined
    this.user = new DataAccessLayer<User>({
      connection: this._connection!,
      atom_name: 'user',
    });
  }
}
