import {Data} from "../hbuf/data";

export enum RpcType {
    Request = 0,
    Response = 1,
    Broadcast = 2,
    Heartbeat = 3,
}

export class Context {
}

export class Result implements Data {
    constructor(code: number, msg: string) {
        this.code = code;
        this.msg = msg;
    }

    code: number
    msg: string
    data?: Data

    toData(): BinaryData {
        return new ArrayBuffer(0);
    }

    toJson(): Record<string, any> {
        return {
            code: this.code,
            msg: this.msg,
            data: this.data?.toJson(),
        };
    }
}

export class RpcData {
    constructor(type: RpcType, id: number, path: string, status: number) {
        this.type = type;
        this.id = id;
        this.path = path;
        this.status = status;
    }

    type: RpcType
    header: Record<string, string[]> = {}
    data?: Data | null
    id: number
    path: string
    status: number

    toJson(): Record<string, any> {
        return {
            type: this.type,
            header: this.header,
            data: this.data?.toJson(),
            id: this.id,
            path: this.path,
            status: this.status,
        }
    }
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


export interface ServerInvoke {
    formData(buf: BinaryData | Record<string, any>): Data

    toData(data: Data): BinaryData | Record<string, any>

    invoke(data: Data, ctx?: Context): Promise<Data>
}

export interface ServerRouter {
    getName(): string

    getId(): number

    getInvoke(): Record<string, ServerInvoke>

}

export class Server {
    protected router: Record<string, ServerInvoke> = {}

    public addRouter(router: ServerRouter) {
        for (const routerKey in router.getInvoke()) {
            this.router["/" + router.getName() + "/" + routerKey] = router.getInvoke()[routerKey]
        }
    }

    public deleteRouter(router: ServerRouter) {
        for (const routerKey in router.getInvoke()) {
            delete this.router["/" + router.getName() + "/" + routerKey]
        }
    }

    public async invoke(request: RpcData): Promise<RpcData> {
        let data = new RpcData(
            RpcType.Response,
            request.id,
            "",
            200,
        )
        let router = this.router[request.path]
        if (null == router) {
            data.status = 404
        } else {
            let result = new Result(0, "ok")
            try {
                result.data = await router.invoke(router.formData(request.data!))
            } catch (e) {
                if (Object.is(e, Result)) {
                    result = e as Result
                } else {
                    result.code = -1
                    result.msg = "Client error"
                    console.log(e)
                }
            }
            data.data = result
        }
        return data
    }
}
