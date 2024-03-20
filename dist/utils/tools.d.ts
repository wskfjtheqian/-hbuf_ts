export declare function waiting(time: number): Promise<void>;
export declare function convertArray<T, E>(list: T[] | null, call: (item: T) => E): E[] | null;
export declare class RecordEntry<T extends keyof any, E> {
    get val(): E;
    get key(): T;
    private _key;
    private _val;
    constructor(key: T, val: E);
}
export declare function convertRecord<T extends keyof any, E, A extends keyof any, B>(record: Record<T, E> | null, call: (key: T, val: E) => RecordEntry<A, B>): Record<A, B> | null;
export declare function isRecord(o: any): boolean;
export declare function isArray(o: any): boolean;
