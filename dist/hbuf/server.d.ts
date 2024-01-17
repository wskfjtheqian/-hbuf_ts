import { Data } from "./data";
export declare class Context {
}
export declare class Result {
    code?: number;
    msg?: string;
    data?: any;
}
export interface Client {
    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T>;
}
export declare abstract class ServerClient {
    get client(): Client;
    abstract get name(): string;
    abstract get id(): number;
    private readonly _client;
    protected invoke<T>(name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T>;
    protected constructor(client: Client);
}
