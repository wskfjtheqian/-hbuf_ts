import { Client } from "../hbuf/server";
import { Data } from "../hbuf/data";
type RequestInvoke = (request: XMLHttpRequest, data: any, next?: RequestInterceptor) => void;
type ResponseInvoke = (request: XMLHttpRequest, data: any, next?: ResponseInterceptor) => any;
export declare class RequestInterceptor {
    constructor(invoke: RequestInvoke, next?: RequestInterceptor);
    invoke: RequestInvoke;
    next?: RequestInterceptor;
}
export declare class ResponseInterceptor {
    constructor(invoke: ResponseInvoke, next?: ResponseInterceptor);
    invoke: ResponseInvoke;
    next?: ResponseInterceptor;
}
export declare class HttpClientJson implements Client {
    constructor(baseUrl: string);
    protected baseUrl: string;
    protected requestInterceptor: RequestInterceptor;
    protected responseInterceptor: ResponseInterceptor;
    addRequestInterceptor(invoke: RequestInvoke): void;
    insertRequestInterceptor(invoke: RequestInvoke): void;
    addResponseInterceptor(invoke: ResponseInvoke): void;
    insertResponseInterceptor(invoke: ResponseInvoke): void;
    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T>;
    private request;
    private response;
}
export {};
