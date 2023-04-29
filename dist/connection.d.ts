import mongoose from 'mongoose';
export declare class ClientConnection {
    connection_ready_state: number;
    private _database_url;
    protected _connection: mongoose.Connection | undefined;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private _on_connecting;
    private _on_connected;
    private _on_disconnecting;
    private _on_disconnected;
    private _on_close;
    private _on_reconnected;
    private _on_error;
    private _on_reconnect_failed;
    private _on_reconnect_tries;
}
