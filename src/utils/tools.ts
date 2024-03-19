//等待指定时间 （毫秒）
export async function waiting(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), Math.max(time, 0))
    })
}

export function convertArray<T>(list: [], call: (item: any) => T): T[] {
    let ret: T[] = new Array(list.length)
    for (const key in list) {
        ret[key] = call(list[key])
    }
    return ret
}

export class RecordEntry<T extends keyof any, E> {
    get val(): E {
        return this._val;
    }

    get key(): T {
        return this._key;
    }

    private _key: T
    private _val: E

    constructor(key: T, val: E) {
        this._key = key
        this._val = val
    }
}

export function convertRecord<T extends keyof any, E, A extends keyof any, B, >(record: Record<T, E>, call: (key: T, val: E) => RecordEntry<A, B>): Record<A, B> {
    let ret: Record<A, B> = {} as Record<A, B>
    for (const key in record) {
        let val = call(key, record [key])
        ret[val.key] = val.val
    }
    return ret
}

export function isRecord(o: any) {
    return Object.getPrototypeOf({}) === Object.getPrototypeOf(o)
}

export function isArray(o: any) {
    return Object.getPrototypeOf([]) === Object.getPrototypeOf(o)
}

