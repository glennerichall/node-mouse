import crypto from "node:crypto";
import {clamp} from "../../utils/shared/math.js";

export function createRandomToken(length) {
    const safeLength = clamp(Math.floor(length), 8, 128);
    let token = '';
    while (token.length < safeLength) {
        token += crypto.randomBytes(24).toString('base64url');
    }
    return token.slice(0, safeLength);
}