"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClientJson = exports.HttpResponseInterceptor = exports.HttpRequestInterceptor = void 0;
var HttpRequestInterceptor = /** @class */ (function () {
    function HttpRequestInterceptor(invoke, next) {
        this.invoke = invoke;
        this.next = next;
    }
    return HttpRequestInterceptor;
}());
exports.HttpRequestInterceptor = HttpRequestInterceptor;
var HttpResponseInterceptor = /** @class */ (function () {
    function HttpResponseInterceptor(invoke, next) {
        this.invoke = invoke;
        this.next = next;
    }
    return HttpResponseInterceptor;
}());
exports.HttpResponseInterceptor = HttpResponseInterceptor;
var HttpClientJson = /** @class */ (function () {
    function HttpClientJson(baseUrl) {
        this.baseUrl = baseUrl;
        this.requestInterceptor = new HttpRequestInterceptor(this.request);
        this.responseInterceptor = new HttpResponseInterceptor(this.response);
    }
    HttpClientJson.prototype.addRequestInterceptor = function (invoke) {
        var temp = this.requestInterceptor;
        while (undefined != (temp === null || temp === void 0 ? void 0 : temp.next)) {
            temp = temp.next;
        }
        temp.next = new HttpRequestInterceptor(invoke);
    };
    HttpClientJson.prototype.insertRequestInterceptor = function (invoke) {
        this.requestInterceptor = new HttpRequestInterceptor(invoke, this.requestInterceptor);
    };
    HttpClientJson.prototype.addResponseInterceptor = function (invoke) {
        var temp = this.responseInterceptor;
        while (undefined != (temp === null || temp === void 0 ? void 0 : temp.next)) {
            temp = temp.next;
        }
        temp.next = new HttpResponseInterceptor(invoke);
    };
    HttpClientJson.prototype.insertResponseInterceptor = function (invoke) {
        this.responseInterceptor = new HttpResponseInterceptor(invoke, this.responseInterceptor);
    };
    HttpClientJson.prototype.invoke = function (serverName, serverId, name, id, req, fromJson, fromData) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("POST", _this.baseUrl + "/" + serverName + "/" + name, true);
            request.setRequestHeader('Content-Type', 'application/json');
            _this.requestInterceptor.invoke(request, JSON.stringify(req.toJson()), _this.requestInterceptor.next);
            request.onreadystatechange = function () {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status !== 200) {
                        reject(request.responseText);
                    }
                    var data = _this.responseInterceptor.invoke(request, null, _this.responseInterceptor.next);
                    var result = JSON.parse(data);
                    if (0 != result.code) {
                        reject(result);
                    }
                    else {
                        resolve(fromJson(result.data || {}));
                    }
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
var URLParams = /** @class */ (function () {
    function URLParams() {
    }
    return URLParams;
}());
