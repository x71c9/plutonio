/**
 *
 * Client class
 *
 */

import {ConnectionClient} from './connection';
import {DataAccessLayer} from './dal';
import {User} from './types';

export class PlutonioClient extends ConnectionClient {
  public user: DataAccessLayer<User>;
  constructor() {
    super();
    this._connection = this.connect();
    this.user = new DataAccessLayer<User>({
      connection: this._connection,
      atom_name: 'user',
    });
  }
}
