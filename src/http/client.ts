import {Client, Result} from "../hbuf/server"
import {Data} from "../hbuf/data";

type RequestInvoke = (request: XMLHttpRequest, data: any, next?: RequestInterceptor) => void
type ResponseInvoke = (request: XMLHttpRequest, data: any, next?: ResponseInterceptor) => any

export class RequestInterceptor {
    constructor(invoke: RequestInvoke, next?: RequestInterceptor) {
        this.invoke = invoke;
        this.next = next;
    }

    invoke: RequestInvoke;

    next?: RequestInterceptor;
}

export class ResponseInterceptor {
    constructor(invoke: ResponseInvoke, next?: ResponseInterceptor) {
        this.invoke = invoke;
        this.next = next;
    }

    invoke: ResponseInvoke

    next?: ResponseInterceptor
}


export class HttpClientJson implements Client {
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.requestInterceptor = new RequestInterceptor(this.request);
        this.responseInterceptor = new ResponseInterceptor(this.response);
    }

    protected baseUrl: string;

    protected requestInterceptor: RequestInterceptor

    protected responseInterceptor: ResponseInterceptor

    public addRequestInterceptor(invoke: RequestInvoke) {
        let temp: RequestInterceptor | undefined = this.requestInterceptor
        while (undefined != temp?.next) {
            temp = temp.next
        }
        temp.next = new RequestInterceptor(invoke);
    }

    public insertRequestInterceptor(invoke: RequestInvoke) {
        this.requestInterceptor = new RequestInterceptor(invoke, this.requestInterceptor)
    }

    public addResponseInterceptor(invoke: ResponseInvoke) {
        let temp: ResponseInterceptor | undefined = this.responseInterceptor
        while (undefined != temp?.next) {
            temp = temp.next
        }
        temp.next = new ResponseInterceptor(invoke);
    }

    public insertResponseInterceptor(invoke: ResponseInvoke) {
        this.responseInterceptor = new ResponseInterceptor(invoke, this.responseInterceptor)
    }

    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T> {
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
                    let result = JSON.parse(data) as Result
                    if (0 != result.code) {
                        reject(result)
                    }
                    resolve(fromJson(result.data))

                }
            }
        });
    }


    private request(request: XMLHttpRequest, data: any, next?: RequestInterceptor) {
        request.send(data)
    }

    private response(request: XMLHttpRequest, data: any, next?: ResponseInterceptor): any {
        return request.responseText
    }
}