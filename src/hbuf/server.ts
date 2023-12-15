import {Data} from "./data";


export class Context {
}

export class Result {
    code?: number
    msg?: string
    data?: any
}

export interface Client {
    invoke<T>(
        serverName: string,
        serverId: number,
        name: string,
        id: number,
        req: Data,
        fromJson: (json: {}) => T,
        fromData: (json: BinaryData) => T,
    ): Promise<T>;
}


export abstract class ServerClient {
    get client(): Client {
        return this._client;
    }

    abstract get name(): string

    abstract get id(): number

    private readonly _client: Client

    protected invoke<T>(
        name: string,
        id: number,
        req: Data,
        fromJson: (json: {}) => T,
        fromData: (json: BinaryData) => T,
    ): Promise<T> {
        return this._client.invoke(
            this.name,
            this.id,
            name,
            id,
            req,
            fromJson,
            fromData
        )
    }

    protected constructor(client: Client) {
        this._client = client;
    }
}


