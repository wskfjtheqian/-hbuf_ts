"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerClient = exports.Result = exports.Context = void 0;
var Context = /** @class */ (function () {
    function Context() {
    }
    return Context;
}());
exports.Context = Context;
var Result = /** @class */ (function () {
    function Result() {
    }
    return Result;
}());
exports.Result = Result;
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
