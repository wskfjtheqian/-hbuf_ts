import {Client, Result} from "../hbuf/server"
import {Data} from "../hbuf/data";

type RequestInterceptor = Function

export class HttpClientJson implements Client {
    protected baseUrl: string;

    invoke<T>(serverName: string, serverId: number, name: string, id: number, req: Data, fromJson: (json: {}) => T, fromData: (json: BinaryData) => T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let request = new XMLHttpRequest()
            request.open("POST", this.baseUrl + "/" + serverName + name, false)
            request.setRequestHeader('Content-Type', 'application/json');

            request.send(JSON.stringify(req.toJson()))

            if (request.status != 200) {
                reject(request.responseText)
            }

            let result = JSON.parse(request.responseText) as Result
            if (0 != result.code) {
                reject(result)
            }
            resolve(fromJson(result.data))
        });
    }

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

}