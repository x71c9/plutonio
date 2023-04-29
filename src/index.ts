import mongoose from 'mongoose';

import * as log from './log/index';

export class PlutonioClient {
  public ready_state: number;
  private _database_url: string;
  private _connection: mongoose.Connection | undefined;
  constructor() {
    this.ready_state = 0;
    this._database_url = process.env.DATABASE_URL || '';
  }
  async connect(): Promise<void> {
    this._connection = mongoose.createConnection(this._database_url);
    this._connection.on('connecting', () => {
      this._on_connecting();
    });
    this._connection.on('connected', () => {
      this._on_connected();
    });
    this._connection.on('disconnecting', () => {
      this._on_disconnecting();
    });
    this._connection.on('disconnected', () => {
      this._on_disconnected();
    });
    this._connection.on('close', () => {
      this._on_close();
    });
    this._connection.on('reconnected', () => {
      this._on_reconnected();
    });
    this._connection.on('error', (err) => {
      this._on_error(err);
    });
    this._connection.on('reconnectFailed', () => {
      this._on_reconnect_failed();
    });
    this._connection.on('reconnectTries', () => {
      this._on_reconnect_tries();
    });
  }
  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  private _on_connecting(): void {
    log.debug(`Connection connecting ...`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_connected(): void {
    log.info(`Connection connected`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_disconnecting(): void {
    log.warn(`Connection disconnecting...`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_disconnected(): void {
    log.warn(`Connection disconnected`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_close(): void {
    log.debug(`Connection closed`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_reconnected(): void {
    log.debug(`Connection reconnected`);
    if (this._connection) {
      this.ready_state = this._connection.readyState;
    }
  }

  private _on_error(e: Error): void {
    throw e;
  }

  private _on_reconnect_failed(): void {
    log.debug(`Connection reconnectFailed`);
  }

  private _on_reconnect_tries(): void {
    log.debug(`Connection reconnectTries`);
  }
}

const main = async () => {
  console.log(process.env.DATABASE_URL);
  const plutonio = new PlutonioClient();
  await plutonio.connect();
  // await plutonio.disconnect();
};

main();
