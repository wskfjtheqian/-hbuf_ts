export interface Data {
    toData(): BinaryData

    toJson(): Record<string, any>
}