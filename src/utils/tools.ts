//等待指定时间 （毫秒）
export async function waiting(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), Math.max(time, 0))
    })
}

export function arrayMap<T>(list: [], call: (item: any) => T): T[] {
    let ret: T[] = new Array(list.length)
    for (const key in list) {
        ret[key] = call(list[key])
    }
    return ret
}

export function mapMap<T, E>(list: [], call: (item: any) => T): T[] {
    let ret: T[] = new Array(list.length)
    for (const key in list) {
        ret[key] = call(list[key])
    }
    return ret
}