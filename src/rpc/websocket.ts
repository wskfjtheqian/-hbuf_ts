import {Client, Result, RpcData, RpcType, Server} from "./rpc";
import {Data} from "../hbuf/data";

type SocketInvoke = (data: RpcData, next?: SocketInterceptor) => Promise<RpcData>


export class SocketInterceptor {
    constructor(invoke: SocketInvoke, next?: SocketInterceptor) {
        this.invoke = invoke;
        this.next = next;
    }

    invoke: SocketInvoke;

    next?: SocketInterceptor;
}


class PromiseCall {
    resolve: (value: RpcData | PromiseLike<RpcData>) => void
    reject: (reason?: any) => void

    constructor(resolve: (value: (PromiseLike<RpcData> | RpcData)) => void, reject: (reason?: any) => void) {
        this.resolve = resolve;
        this.reject = reject;
    }
}


export class WebsocketClientJson implements Client {
    protected baseUrl: string;
    protected socket?: WebSocket;
    protected requestId: number = 0
    protected requestMap: Map<number, PromiseCall> = new Map<number, PromiseCall>()
    protected decoder: TextDecoder = new TextDecoder()
    protected encoder: TextEncoder = new TextEncoder()
    public readTimeout: number = 30000;
    protected server?: Server

    constructor(baseUrl: string, server?: Server) {
        this.baseUrl = baseUrl;
        this.server = server;
        this.interceptor = new SocketInterceptor((data, next) => this.socketInvoke(data, next));
    }

    protected interceptor: SocketInterceptor

    public addInterceptor(invoke: SocketInvoke) {
        let temp: SocketInterceptor | undefined = this.interceptor
        while (undefined != temp?.next) {
            temp = temp.next
        }
        temp.next = new SocketInterceptor(invoke);
    }

    public insertInterceptor(invoke: SocketInvoke) {
        this.interceptor = new SocketInterceptor(invoke, this.interceptor)
    }

    private socketInvoke(data: RpcData, next?: SocketInterceptor): Promise<RpcData> {
        const ret = new Promise<RpcData>((resolve, reject) => {
            let promise = new PromiseCall((value) => {
                if (this.requestMap.delete(this.requestId)) {
                    resolve(value)
                }
            }, (e) => {
                if (this.requestMap.delete(this.requestId)) {
                    reject(e)
                }
            })
            setTimeout(() => {
                reject("timeout")
            }, this.readTimeout)
            this.requestMap.set(this.requestId, promise)
        }).then((value: RpcData) => {
            if (next != null) {
                return next.invoke(value, next.next)
            } else {
                return value
            }
        });

        this.socket?.send(this.encoder.encode(JSON.stringify(data.toJson())).buffer)
        return ret
    }


    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T> {
        this.requestId++
        let header = new Map();
        let data = new RpcData(
            RpcType.Request,
            this.requestId,
            "/" + serverName + "/" + name,
            0,
        )
        data.data = req
        return this.interceptor.invoke(data, this.interceptor.next).then((value): T => {
            let result = value.data as Result
            if (0 == result.code) {
                return fromJson(result.data || {})
            }
            throw result
        })
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.baseUrl)
                this.socket.onclose = (event) => this.onClose(event)
                this.socket.onerror = (event) => {
                    reject(event)
                }
                this.socket.onmessage = (event) => this.onMessage(event)
                this.socket.onopen = (event) => {
                    resolve()
                }
            } catch (e) {
                reject(e)
            }
        })
    }

    private onClose(event: CloseEvent) {

    }

    private onMessage(event: MessageEvent) {
        event.data.arrayBuffer().then((value: ArrayBuffer) => {
            let response = JSON.parse(this.decoder.decode(value)) as RpcData
            if (response.type == RpcType.Request) {
                this.onRequest(response)
            } else if (response.type == RpcType.Response) {
                if (response.status == 200) {
                    this.requestMap.get(response.id)?.resolve(response)
                } else {
                    this.requestMap.get(response.id)?.reject(response)
                }
            }

        }).catch((e: any) => {
            console.log(e)
        })
    }

    private async onRequest(request: RpcData) {
        let data: RpcData
        if (this.server) {
            data = await this.server.invoke(request)
        } else {
            data = new RpcData(
                RpcType.Response,
                request.id,
                "",
                404,
            )
        }
        this.socket?.send(this.encoder.encode(JSON.stringify(data.toJson())).buffer)
    }
}

