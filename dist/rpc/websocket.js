"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketClientJson = exports.SocketInterceptor = void 0;
var rpc_1 = require("./rpc");
var SocketInterceptor = /** @class */ (function () {
    function SocketInterceptor(invoke, next) {
        this.invoke = invoke;
        this.next = next;
    }
    return SocketInterceptor;
}());
exports.SocketInterceptor = SocketInterceptor;
var PromiseCall = /** @class */ (function () {
    function PromiseCall(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
    }
    return PromiseCall;
}());
var WebsocketClientJson = /** @class */ (function () {
    function WebsocketClientJson(baseUrl, server) {
        var _this = this;
        this.requestId = 0;
        this.requestMap = new Map();
        this.decoder = new TextDecoder();
        this.encoder = new TextEncoder();
        this.readTimeout = 30000;
        this.interval = null;
        this.heartbeat = 30000;
        this.headTimeout = false;
        this.isOpen = false;
        this.baseUrl = baseUrl;
        this.server = server;
        this.interceptor = new SocketInterceptor(function (data, next) { return _this.socketInvoke(data, next); });
    }
    WebsocketClientJson.prototype.addInterceptor = function (invoke) {
        var temp = this.interceptor;
        while (undefined != (temp === null || temp === void 0 ? void 0 : temp.next)) {
            temp = temp.next;
        }
        temp.next = new SocketInterceptor(invoke);
    };
    WebsocketClientJson.prototype.insertInterceptor = function (invoke) {
        this.interceptor = new SocketInterceptor(invoke, this.interceptor);
    };
    WebsocketClientJson.prototype.socketInvoke = function (data, next) {
        var _this = this;
        var _a;
        var ret = new Promise(function (resolve, reject) {
            var promise = new PromiseCall(function (value) {
                if (_this.requestMap.delete(data.id)) {
                    resolve(value);
                }
            }, function (e) {
                if (_this.requestMap.delete(data.id)) {
                    reject(e);
                }
            });
            setTimeout(function () {
                reject("timeout");
            }, _this.readTimeout);
            _this.requestMap.set(data.id, promise);
        }).then(function (value) {
            if (next != null) {
                return next.invoke(value, next.next);
            }
            else {
                return value;
            }
        });
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(this.encoder.encode(JSON.stringify(data.toJson())).buffer);
        return ret;
    };
    WebsocketClientJson.prototype.invoke = function (serverName, serverId, name, id, req, fromJson, fromData) {
        this.requestId++;
        var header = new Map();
        var data = new rpc_1.RpcData(rpc_1.RpcType.Request, this.requestId, "/" + serverName + "/" + name, 0);
        data.data = req;
        return this.interceptor.invoke(data, this.interceptor.next).then(function (value) {
            var result = value.data;
            if (0 == result.code) {
                return fromJson(result.data || {});
            }
            throw result;
        });
    };
    WebsocketClientJson.prototype.connect = function (prams) {
        var _this = this;
        this.prams = prams;
        var url = this.baseUrl;
        if (prams) {
            var temp = "";
            for (var key in prams) {
                for (var index in prams[key]) {
                    temp += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(prams[key][index]);
                }
            }
            if (temp.length > 0) {
                url += (-1 == url.indexOf("?") ? "?" : "&") + temp.substring(1);
            }
        }
        return new Promise(function (resolve, reject) {
            try {
                _this.socket = new WebSocket(url);
                _this.socket.onclose = function (event) { return _this.onClose(event); };
                _this.socket.onerror = function (event) { return reject(event); };
                _this.socket.onmessage = function (event) { return _this.onMessage(event); };
                _this.socket.onopen = function (event) { return resolve(); };
                _this.interval = setInterval(function () { return _this.onHeartbeat(); }, _this.heartbeat);
            }
            catch (e) {
                reject(e);
            }
        });
    };
    WebsocketClientJson.prototype.close = function () {
        var _a;
        this.isOpen = false;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.close();
    };
    WebsocketClientJson.prototype.onClose = function (event) {
        if (this.isOpen) {
            this.connect(this.prams);
        }
    };
    WebsocketClientJson.prototype.onMessage = function (event) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var value, response, e_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 7, , 8]);
                        value = void 0;
                        if (!(event.data instanceof Blob)) return [3 /*break*/, 2];
                        return [4 /*yield*/, event.data.arrayBuffer()];
                    case 1:
                        value = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        value = event.data;
                        _c.label = 3;
                    case 3:
                        response = JSON.parse(this.decoder.decode(new Uint8Array(value)));
                        if (!(response.type == rpc_1.RpcType.Request)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.onRequest(response)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        if (response.type == rpc_1.RpcType.Response) {
                            if (response.status == 200) {
                                (_a = this.requestMap.get(response.id)) === null || _a === void 0 ? void 0 : _a.resolve(response);
                            }
                            else {
                                (_b = this.requestMap.get(response.id)) === null || _b === void 0 ? void 0 : _b.reject(response);
                            }
                        }
                        _c.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        e_1 = _c.sent();
                        console.log(e_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    WebsocketClientJson.prototype.onRequest = function (request) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.headTimeout = true;
                        if (!this.server) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.server.invoke(request)];
                    case 1:
                        data = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        data = new rpc_1.RpcData(rpc_1.RpcType.Response, request.id, "", 404);
                        _b.label = 3;
                    case 3:
                        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(this.encoder.encode(JSON.stringify(data.toJson())).buffer);
                        return [2 /*return*/];
                }
            });
        });
    };
    WebsocketClientJson.prototype.onHeartbeat = function () {
        var _a;
        if ((_a = this.socket) === null || _a === void 0 ? void 0 : _a.OPEN) {
            if (!this.headTimeout) {
                this.socket.close();
                this.connect(this.prams);
            }
            this.socket.send(this.encoder.encode(JSON.stringify({
                type: rpc_1.RpcType.Heartbeat
            })));
            this.headTimeout = false;
        }
    };
    return WebsocketClientJson;
}());
exports.WebsocketClientJson = WebsocketClientJson;
