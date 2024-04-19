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
exports.formatDate = exports.isArray = exports.isRecord = exports.convertRecord = exports.RecordEntry = exports.convertArray = exports.waiting = void 0;
//等待指定时间 （毫秒）
function waiting(time) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    setTimeout(function () { return resolve(); }, Math.max(time, 0));
                })];
        });
    });
}
exports.waiting = waiting;
function convertArray(list, call) {
    if (null == list) {
        return null;
    }
    var ret = new Array(list.length);
    for (var key in list) {
        ret[key] = call(list[key]);
    }
    return ret;
}
exports.convertArray = convertArray;
var RecordEntry = /** @class */ (function () {
    function RecordEntry(key, val) {
        this._key = key;
        this._val = val;
    }
    Object.defineProperty(RecordEntry.prototype, "val", {
        get: function () {
            return this._val;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RecordEntry.prototype, "key", {
        get: function () {
            return this._key;
        },
        enumerable: false,
        configurable: true
    });
    return RecordEntry;
}());
exports.RecordEntry = RecordEntry;
function convertRecord(record, call) {
    if (null == record) {
        return null;
    }
    var ret = {};
    for (var key in record) {
        var val = call(key, record[key]);
        ret[val.key] = val.val;
    }
    return ret;
}
exports.convertRecord = convertRecord;
function isRecord(o) {
    return Object.getPrototypeOf({}) === Object.getPrototypeOf(o);
}
exports.isRecord = isRecord;
function isArray(o) {
    return Object.getPrototypeOf([]) === Object.getPrototypeOf(o);
}
exports.isArray = isArray;
function formatDate(date, format) {
    if (!format)
        format = "yyyy-MM-dd";
    switch (typeof date) {
        case "string":
            date = new Date(date.replace(/-/g, "/"));
            break;
        case "number":
            date = new Date(date);
            break;
    }
    if (date instanceof Date) {
        var dict_1 = {
            yyyy: date.getFullYear(),
            M: date.getMonth() + 1,
            d: date.getDate(),
            H: date.getHours(),
            m: date.getMinutes(),
            s: date.getSeconds(),
            MM: ("" + (date.getMonth() + 101)).substr(1),
            dd: ("" + (date.getDate() + 100)).substr(1),
            HH: ("" + (date.getHours() + 100)).substr(1),
            mm: ("" + (date.getMinutes() + 100)).substr(1),
            ss: ("" + (date.getSeconds() + 100)).substr(1)
        };
        return format.replace(/(yyyy|MM?|dd?|HH?|ss?|mm?)/g, function () {
            return dict_1[arguments[0]];
        });
    }
    return "" + date;
}
exports.formatDate = formatDate;
