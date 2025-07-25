// Fallback TextEncoder implementation for environments that don't have it
export function stringToBytes(str: string): Uint8Array {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).TextEncoder !== 'undefined') {
        return new (globalThis as any).TextEncoder().encode(str);
    } else {
        const bytes: number[] = [];
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xc0 | (code >> 6));
                bytes.push(0x80 | (code & 0x3f));
            } else if (code < 0xd800 || code >= 0xe000) {
                bytes.push(0xe0 | (code >> 12));
                bytes.push(0x80 | ((code >> 6) & 0x3f));
                bytes.push(0x80 | (code & 0x3f));
            } else {
                i++;
                const hi = code;
                const lo = str.charCodeAt(i);
                const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
                bytes.push(0xf0 | (codePoint >> 18));
                bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
                bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                bytes.push(0x80 | (codePoint & 0x3f));
            }
        }
        return new Uint8Array(bytes);
    }
}

// Base58 decode using bs58
export function base58ToBytes(str: string): Uint8Array {
    // @ts-ignore
    const bs58 = require('bs58');
    return bs58.decode(str);
}

// Base64 encode using base64-js
export function bytesToBase64(bytes: Uint8Array): string {
    // @ts-ignore
    const base64js = require('base64-js');
    return base64js.fromByteArray(bytes);
}

export function borshSerializeString(str: string, buffer: Uint8Array, offset: number): number {
    const strBytes = stringToBytes(str)
    const len = strBytes.length

    buffer[offset++] = len & 0xff
    buffer[offset++] = (len >> 8) & 0xff
    buffer[offset++] = (len >> 16) & 0xff
    buffer[offset++] = (len >> 24) & 0xff

    for (let i = 0; i < len; i++) {
        buffer[offset++] = strBytes[i]
    }
    return offset
}

export function encodeLength(buffer: number[], length: number): void {
    // Encode length as compact-u16 (same as Solana)
    while (length >= 0x80) {
      buffer.push((length & 0x7f) | 0x80)
      length >>= 7
    }
    buffer.push(length)
}
