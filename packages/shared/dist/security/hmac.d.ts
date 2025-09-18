export type HmacAlgo = 'sha256';
export interface HmacOptions {
    algo?: HmacAlgo;
    secret: string;
}
export declare function sha256Hex(value: string, key: string): string;
export declare function hmacSign(timestampSec: string, rawBody: string, opts: HmacOptions): string;
export declare function hmacVerify(timestampSec: string, rawBody: string, signatureHeader: string, opts: HmacOptions, windowSec?: number): boolean;
export declare const verifyHmacSignature: (timestampSec: string, rawBody: string, signatureHeader: string, secretOrOpts: string | HmacOptions, windowSec?: number) => boolean;
//# sourceMappingURL=hmac.d.ts.map