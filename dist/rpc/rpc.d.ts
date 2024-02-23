import { Data } from "../hbuf/data";
export declare enum RpcType {
    Request = 0,
    Response = 1,
    Broadcast = 2,
    Heartbeat = 3
}
export declare class Context {
}
export declare class Result implements Data {
    constructor(code: number, msg: string);
    code: number;
    msg: string;
    data?: Data | void;
    toData(): BinaryData;
    toJson(): Record<string, any>;
}
export declare class RpcData {
    constructor(type: RpcType, id: number, path: string, status: number);
    type: RpcType;
    header: Record<string, string[]>;
    data?: Data | null;
    id: number;
    path: string;
    status: number;
    toJson(): Record<string, any>;
}
export interface Client {
    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: ((json: {}) => T) | null, fromData: ((json: BinaryData) => T) | null): Promise<T>;
}
export declare abstract class ServerClient {
    get client(): Client;
    abstract get name(): string;
    abstract get id(): number;
    private readonly _client;
    protected invoke<T>(name: string, id: number, req: Data, fromJson: ((json: {}) => T) | null, fromData: ((json: BinaryData) => T) | null): Promise<T>;
    protected constructor(client: Client);
}
export interface ServerInvoke {
    formData(buf: BinaryData | Record<string, any>): Data;
    toData(data: Data): BinaryData | Record<string, any>;
    invoke(data: Data, ctx?: Context): Promise<Data | void>;
}
export interface ServerRouter {
    getName(): string;
    getId(): number;
    getInvoke(): Record<string, ServerInvoke>;
}
export declare class Server {
    protected router: Record<string, ServerInvoke>;
    addRouter(router: ServerRouter): void;
    deleteRouter(router: ServerRouter): void;
    invoke(request: RpcData): Promise<RpcData>;
}
