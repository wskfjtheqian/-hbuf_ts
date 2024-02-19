import {Client, Result} from "./rpc"
import {Data} from "../hbuf/data";

type HttpRequestInvoke = (request: XMLHttpRequest, data: any, next?: HttpRequestInterceptor) => void
type HttpResponseInvoke = (request: XMLHttpRequest, data: any, next?: HttpResponseInterceptor) => any

export class HttpRequestInterceptor {
    constructor(invoke: HttpRequestInvoke, next?: HttpRequestInterceptor) {
        this.invoke = invoke;
        this.next = next;
    }

    invoke: HttpRequestInvoke;

    next?: HttpRequestInterceptor;
}

export class HttpResponseInterceptor {
    constructor(invoke: HttpResponseInvoke, next?: HttpResponseInterceptor) {
        this.invoke = invoke;
        this.next = next;
    }

    invoke: HttpResponseInvoke

    next?: HttpResponseInterceptor
}


export class HttpClientJson implements Client {
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.requestInterceptor = new HttpRequestInterceptor(this.request);
        this.responseInterceptor = new HttpResponseInterceptor(this.response);
    }

    protected baseUrl: string;

    protected requestInterceptor: HttpRequestInterceptor

    protected responseInterceptor: HttpResponseInterceptor

    public addRequestInterceptor(invoke: HttpRequestInvoke) {
        let temp: HttpRequestInterceptor | undefined = this.requestInterceptor
        while (undefined != temp?.next) {
            temp = temp.next
        }
        temp.next = new HttpRequestInterceptor(invoke);
    }

    public insertRequestInterceptor(invoke: HttpRequestInvoke) {
        this.requestInterceptor = new HttpRequestInterceptor(invoke, this.requestInterceptor)
    }

    public addResponseInterceptor(invoke: HttpResponseInvoke) {
        let temp: HttpResponseInterceptor | undefined = this.responseInterceptor
        while (undefined != temp?.next) {
            temp = temp.next
        }
        temp.next = new HttpResponseInterceptor(invoke);
    }

    public insertResponseInterceptor(invoke: HttpResponseInvoke) {
        this.responseInterceptor = new HttpResponseInterceptor(invoke, this.responseInterceptor)
    }

    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: Record<string, any>) => T, fromData: (json: BinaryData) => T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let request = new XMLHttpRequest()
            request.open("POST", this.baseUrl + "/" + serverName + "/" + name, true)
            request.setRequestHeader('Content-Type', 'application/json');

            this.requestInterceptor.invoke(request, JSON.stringify(req.toJson()), this.requestInterceptor.next)

            request.onreadystatechange = () => {
                if (request.readyState === 4) {
                    if (request.status !== 200) {
                        reject(request.responseText)
                    }
                    let data = this.responseInterceptor.invoke(request, null, this.responseInterceptor.next)
                    if (null == fromJson) {
                        resolve(null as T)
                    }
                    let result = JSON.parse(data) as Result
                    if (0 != result.code) {
                        reject(result)
                    } else {
                        resolve(fromJson(result.data || {}))
                    }
                }
            }
        });
    }


    private request(request: XMLHttpRequest, data: any, next?: HttpRequestInterceptor) {
        request.send(data)
    }

    private response(request: XMLHttpRequest, data: any, next?: HttpResponseInterceptor): any {
        return request.responseText
    }
}

class URLParams {

}