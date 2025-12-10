// Type declarations for @agungjsp/qris-dinamis
declare module '@agungjsp/qris-dinamis' {
    export function makeFile(
        qrisStatic: string,
        options: { nominal: number; base64: boolean }
    ): Promise<string | Buffer>

    export function makeString(
        qrisStatic: string,
        options: { nominal: number }
    ): string
}

