import {Client, Result, RpcData, RpcType, Server} from "./rpc";
import {Data} from "../hbuf/data";

type SocketInvoke = (data: RpcData, next?: SocketInterceptor) => Promise<RpcData | void>


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
    private interval: number | null = null;
    private heartbeat: number = 30000;
    private headTimeout: boolean = false;
    public onclose?: ((this: WebsocketClientJson, code: string) => any) | null;

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

    private socketInvoke(data: RpcData, next?: SocketInterceptor): Promise<RpcData | void> {
        var ret: Promise<any> = Promise.resolve()
        if (data.type == RpcType.Request) {
            ret = new Promise<RpcData>((resolve, reject) => {
                let promise = new PromiseCall((value) => {
                    if (this.requestMap.delete(data.id)) {
                        resolve(value)
                    }
                }, (e) => {
                    if (this.requestMap.delete(data.id)) {
                        reject(e)
                    }
                })
                setTimeout(() => {
                    reject("timeout")
                }, this.readTimeout)
                this.requestMap.set(data.id, promise)
            }).then((value: RpcData) => {
                if (next != null) {
                    return next.invoke(value, next.next)
                } else {
                    return value
                }
            });
        }
        this.socket?.send(this.encoder.encode(JSON.stringify(data.toJson())).buffer)
        return ret
    }


    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: ((json: {}) => T) | null, fromData: ((json: BinaryData) => T) | null): Promise<T> {
        this.requestId++
        let header = new Map();
        let data = new RpcData(
            fromJson ? RpcType.Request : RpcType.Broadcast,
            this.requestId,
            "/" + serverName + "/" + name,
            0,
        )
        data.data = req
        return this.interceptor.invoke(data, this.interceptor.next).then((value): T => {
            if (fromJson) {
                let result = (value as RpcData).data as Result
                if (0 == result.code) {
                    return fromJson(result.data || {})
                }
                throw result
            }
            return null as T
        })
    }

    public connect(prams?: Record<string, string[]>): Promise<void> {
        let url = this.baseUrl
        let temp = ""
        if (prams) {
            for (const key in prams) {
                for (const index in prams[key]) {
                    temp += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(prams[key][index])
                }
            }
        }
        return new Promise((resolve, reject) => {
            clearInterval(this.interval ?? 0)
            try {
                this.socket = new WebSocket(url, [encodeURIComponent(temp)])
                this.socket.onclose = (event) => {
                    clearInterval(this.interval ?? 0)
                    this.onclose?.call(this, event.code == 4401 ? "auth failed" : "close")
                }
                this.socket.onerror = (event) => reject(event)
                this.socket.onmessage = (event) => this.onMessage(event)
                this.socket.onopen = (event) => {
                    resolve()
                }
                this.interval = setInterval(() => this.onHeartbeat(), this.heartbeat)
            } catch (e) {
                reject(e)
            }
        })
    }

    public close() {
        clearInterval(this.interval ?? 0)
        this.socket?.close()
    }

    private async onMessage(event: MessageEvent) {
        try {
            this.headTimeout = false

            let value: ArrayBuffer
            if (event.data instanceof Blob) {
                value = await (event.data as Blob).arrayBuffer();
            } else {
                value = event.data
            }

            let response = JSON.parse(this.decoder.decode(new Uint8Array(value))) as RpcData
            if (response.type == RpcType.Request || response.type == RpcType.Broadcast) {
                await this.onRequest(response, response.type == RpcType.Broadcast)
            } else if (response.type == RpcType.Response) {
                if (response.status == 200) {
                    this.requestMap.get(response.id)?.resolve(response)
                } else {
                    this.requestMap.get(response.id)?.reject(response)
                }
            }
        } catch (e) {
            console.log(e)
        }
    }

    private async onRequest(request: RpcData, broadcast: boolean) {
        if (broadcast) {
            this.server?.invoke(request)
            return
        }
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

    private onHeartbeat() {
        if (this.socket?.OPEN) {
            if (this.headTimeout) {
                this.socket.close()
                clearInterval(this.interval ?? 0)
                this.onclose?.call(this, "timeout")
                return
            }
            this.socket.send(this.encoder.encode(JSON.stringify({
                type: RpcType.Heartbeat
            })))
            this.headTimeout = true
        }
    }
}

