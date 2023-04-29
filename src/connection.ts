import mongoose from 'mongoose';

import * as log from './log/index';

export class ClientConnection {
  public connection_ready_state: number;
  private _database_url: string;
  protected _connection: mongoose.Connection | undefined;
  constructor() {
    log.trace(`Initializing Plutonio...`);
    this.connection_ready_state = 0;
    this._database_url = process.env.DATABASE_URL || '';
  }
  async connect(): Promise<void> {
    log.trace(`Connecting...`);
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
    log.debug(`Connecting ...`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_connected(): void {
    log.success(`Connected`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_disconnecting(): void {
    log.warn(`Disconnecting...`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_disconnected(): void {
    log.warn(`Disconnected`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_close(): void {
    log.debug(`Connection closed`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_reconnected(): void {
    log.debug(`Reconnected`);
    if (this._connection) {
      this.connection_ready_state = this._connection.readyState;
    }
  }
  private _on_error(e: Error): void {
    throw e;
  }
  private _on_reconnect_failed(): void {
    log.debug(`Reconnect Failed`);
  }
  private _on_reconnect_tries(): void {
    log.debug(`Reconnect Tries`);
  }
}
