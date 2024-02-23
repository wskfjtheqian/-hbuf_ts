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
exports.Server = exports.ServerClient = exports.RpcData = exports.Result = exports.Context = exports.RpcType = void 0;
var RpcType;
(function (RpcType) {
    RpcType[RpcType["Request"] = 0] = "Request";
    RpcType[RpcType["Response"] = 1] = "Response";
    RpcType[RpcType["Broadcast"] = 2] = "Broadcast";
    RpcType[RpcType["Heartbeat"] = 3] = "Heartbeat";
    RpcType[RpcType["AuthSuccess"] = 4] = "AuthSuccess";
    RpcType[RpcType["AuthFailure"] = 5] = "AuthFailure";
})(RpcType || (exports.RpcType = RpcType = {}));
var Context = /** @class */ (function () {
    function Context() {
    }
    return Context;
}());
exports.Context = Context;
var Result = /** @class */ (function () {
    function Result(code, msg) {
        this.code = code;
        this.msg = msg;
    }
    Result.prototype.toData = function () {
        return new ArrayBuffer(0);
    };
    Result.prototype.toJson = function () {
        var _a;
        return {
            code: this.code,
            msg: this.msg,
            data: (_a = this.data) === null || _a === void 0 ? void 0 : _a.toJson(),
        };
    };
    return Result;
}());
exports.Result = Result;
var RpcData = /** @class */ (function () {
    function RpcData(type, id, path, status) {
        this.header = {};
        this.type = type;
        this.id = id;
        this.path = path;
        this.status = status;
    }
    RpcData.prototype.toJson = function () {
        var _a;
        return {
            type: this.type,
            header: this.header,
            data: (_a = this.data) === null || _a === void 0 ? void 0 : _a.toJson(),
            id: this.id,
            path: this.path,
            status: this.status,
        };
    };
    return RpcData;
}());
exports.RpcData = RpcData;
var ServerClient = /** @class */ (function () {
    function ServerClient(client) {
        this._client = client;
    }
    Object.defineProperty(ServerClient.prototype, "client", {
        get: function () {
            return this._client;
        },
        enumerable: false,
        configurable: true
    });
    ServerClient.prototype.invoke = function (name, id, req, fromJson, fromData) {
        return this._client.invoke(this.name, this.id, name, id, req, fromJson, fromData);
    };
    return ServerClient;
}());
exports.ServerClient = ServerClient;
var Server = /** @class */ (function () {
    function Server() {
        this.router = {};
    }
    Server.prototype.addRouter = function (router) {
        for (var routerKey in router.getInvoke()) {
            this.router["/" + router.getName() + "/" + routerKey] = router.getInvoke()[routerKey];
        }
    };
    Server.prototype.deleteRouter = function (router) {
        for (var routerKey in router.getInvoke()) {
            delete this.router["/" + router.getName() + "/" + routerKey];
        }
    };
    Server.prototype.invoke = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var data, router, result, _a, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        data = new RpcData(RpcType.Response, request.id, "", 200);
                        router = this.router[request.path];
                        if (!(null == router)) return [3 /*break*/, 1];
                        data.status = 404;
                        return [3 /*break*/, 6];
                    case 1:
                        result = new Result(0, "ok");
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        _a = result;
                        return [4 /*yield*/, router.invoke(router.formData(request.data))];
                    case 3:
                        _a.data = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        if (Object.is(e_1, Result)) {
                            result = e_1;
                        }
                        else {
                            result.code = -1;
                            result.msg = "Client error";
                            console.log(e_1);
                        }
                        return [3 /*break*/, 5];
                    case 5:
                        data.data = result;
                        _b.label = 6;
                    case 6: return [2 /*return*/, data];
                }
            });
        });
    };
    return Server;
}());
exports.Server = Server;
