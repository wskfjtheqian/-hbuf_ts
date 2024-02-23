import { Client, RpcData, Server } from "./rpc";
import { Data } from "../hbuf/data";
type SocketInvoke = (data: RpcData, next?: SocketInterceptor) => Promise<RpcData | void>;
export declare class SocketInterceptor {
    constructor(invoke: SocketInvoke, next?: SocketInterceptor);
    invoke: SocketInvoke;
    next?: SocketInterceptor;
}
declare class PromiseCall {
    resolve: (value: RpcData | PromiseLike<RpcData>) => void;
    reject: (reason?: any) => void;
    constructor(resolve: (value: (PromiseLike<RpcData> | RpcData)) => void, reject: (reason?: any) => void);
}
export declare class WebsocketClientJson implements Client {
    protected baseUrl: string;
    protected socket?: WebSocket;
    protected requestId: number;
    protected requestMap: Map<number, PromiseCall>;
    protected decoder: TextDecoder;
    protected encoder: TextEncoder;
    readTimeout: number;
    protected server?: Server;
    private interval;
    private heartbeat;
    private headTimeout;
    onclose?: ((this: WebsocketClientJson, code: string) => any) | null;
    constructor(baseUrl: string, server?: Server);
    protected interceptor: SocketInterceptor;
    addInterceptor(invoke: SocketInvoke): void;
    insertInterceptor(invoke: SocketInvoke): void;
    private socketInvoke;
    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: ((json: {}) => T) | null, fromData: ((json: BinaryData) => T) | null): Promise<T>;
    connect(prams?: Record<string, string[]>): Promise<void>;
    close(): void;
    private onMessage;
    private onRequest;
    private onHeartbeat;
}
export {};
