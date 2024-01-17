"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientJson = exports.ResponseInterceptor = exports.RequestInterceptor = void 0;
var RequestInterceptor = /** @class */ (function () {
    function RequestInterceptor(invoke, next) {
        this.invoke = invoke;
        this.next = next;
    }
    return RequestInterceptor;
}());
exports.RequestInterceptor = RequestInterceptor;
var ResponseInterceptor = /** @class */ (function () {
    function ResponseInterceptor(invoke, next) {
        this.invoke = invoke;
        this.next = next;
    }
    return ResponseInterceptor;
}());
exports.ResponseInterceptor = ResponseInterceptor;
var HttpClientJson = /** @class */ (function () {
    function HttpClientJson(baseUrl) {
        this.baseUrl = baseUrl;
        this.requestInterceptor = new RequestInterceptor(this.request);
        this.responseInterceptor = new ResponseInterceptor(this.response);
    }
    HttpClientJson.prototype.addRequestInterceptor = function (invoke) {
        var temp = this.requestInterceptor;
        while (undefined != (temp === null || temp === void 0 ? void 0 : temp.next)) {
            temp = temp.next;
        }
        temp.next = new RequestInterceptor(invoke);
    };
    HttpClientJson.prototype.insertRequestInterceptor = function (invoke) {
        this.requestInterceptor = new RequestInterceptor(invoke, this.requestInterceptor);
    };
    HttpClientJson.prototype.addResponseInterceptor = function (invoke) {
        var temp = this.responseInterceptor;
        while (undefined != (temp === null || temp === void 0 ? void 0 : temp.next)) {
            temp = temp.next;
        }
        temp.next = new ResponseInterceptor(invoke);
    };
    HttpClientJson.prototype.insertResponseInterceptor = function (invoke) {
        this.responseInterceptor = new ResponseInterceptor(invoke, this.responseInterceptor);
    };
    HttpClientJson.prototype.invoke = function (serverName, serverId, name, id, req, fromJson, fromData) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("POST", _this.baseUrl + "/" + serverName + "/" + name, true);
            request.setRequestHeader('Content-Type', 'application/json');
            _this.requestInterceptor.invoke(request, JSON.stringify(req.toJson()), _this.requestInterceptor.next);
            request.onreadystatechange = function () {
                if (request.readyState === 4) {
                    if (request.status !== 200) {
                        reject(request.responseText);
                    }
                    var data = _this.responseInterceptor.invoke(request, null, _this.responseInterceptor.next);
                    var result = JSON.parse(data);
                    if (0 != result.code) {
                        reject(result);
                    }
                    resolve(fromJson(result.data));
                }
            };
        });
    };
    HttpClientJson.prototype.request = function (request, data, next) {
        request.send(data);
    };
    HttpClientJson.prototype.response = function (request, data, next) {
        return request.responseText;
    };
    return HttpClientJson;
}());
exports.HttpClientJson = HttpClientJson;
