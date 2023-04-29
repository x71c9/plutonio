export declare class PlutonioClient {
    ready_state: number;
    private _database_url;
    private _connection;
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
