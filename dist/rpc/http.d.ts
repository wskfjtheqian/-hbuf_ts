import { Client } from "./rpc";
import { Data } from "../hbuf/data";
type HttpRequestInvoke = (request: XMLHttpRequest, data: any, next?: HttpRequestInterceptor) => void;
type HttpResponseInvoke = (request: XMLHttpRequest, data: any, next?: HttpResponseInterceptor) => any;
export declare class HttpRequestInterceptor {
    constructor(invoke: HttpRequestInvoke, next?: HttpRequestInterceptor);
    invoke: HttpRequestInvoke;
    next?: HttpRequestInterceptor;
}
export declare class HttpResponseInterceptor {
    constructor(invoke: HttpResponseInvoke, next?: HttpResponseInterceptor);
    invoke: HttpResponseInvoke;
    next?: HttpResponseInterceptor;
}
export declare class HttpClientJson implements Client {
    constructor(baseUrl: string);
    protected baseUrl: string;
    protected requestInterceptor: HttpRequestInterceptor;
    protected responseInterceptor: HttpResponseInterceptor;
    addRequestInterceptor(invoke: HttpRequestInvoke): void;
    insertRequestInterceptor(invoke: HttpRequestInvoke): void;
    addResponseInterceptor(invoke: HttpResponseInvoke): void;
    insertResponseInterceptor(invoke: HttpResponseInvoke): void;
    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: Record<string, any>) => T, fromData: (json: BinaryData) => T): Promise<T>;
    private request;
    private response;
}
export {};
