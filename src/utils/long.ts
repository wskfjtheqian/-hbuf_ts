/**
 * @license
 * Copyright 2009 The Closure Library Authors
 * Copyright 2020 Daniel Wirtz / The long.js Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// WebAssembly optimizations to do native i64 multiplication and divide
var wasm: any = null;
try {
    wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11
    ])), {}).exports;
} catch (e) {
    // no wasm support :(
}


export class Long {
    /**
     * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as signed integers. See the from* functions below for more convenient ways of constructing Longs.
     */
    constructor(low: number, high?: number, unsigned?: boolean) {
        this.low = low
        this.high = high ?? 0
        this.unsigned = unsigned
    }

    static INT_CACHE: Record<number, Long> = {};

    /**
     * A cache of the Long representations of small unsigned integer values.
     * @type {!Object}
     * @inner
     */
    static UINT_CACHE: Record<number, Long> = {};


    /**
     * @type {number}
     * @const
     * @inner
     */
    static TWO_PWR_16_DBL = 1 << 16;

    /**
     * @type {number}
     * @const
     * @inner
     */
    static TWO_PWR_24_DBL = 1 << 24;

    /**
     * @type {number}
     * @const
     * @inner
     */
    static TWO_PWR_32_DBL = Long.TWO_PWR_16_DBL * Long.TWO_PWR_16_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    static TWO_PWR_64_DBL = Long.TWO_PWR_32_DBL * Long.TWO_PWR_32_DBL;

    /**
     * @type {number}
     * @const
     * @inner
     */
    static TWO_PWR_63_DBL = Long.TWO_PWR_64_DBL / 2;

    /**
     * @type {!Long}
     * @const
     * @inner
     */
    static TWO_PWR_24 = Long.fromInt(Long.TWO_PWR_24_DBL);


    /**
     * Maximum unsigned value.
     */
    static MAX_UNSIGNED_VALUE: Long;

    /**
     * Maximum signed value.
     */
    static MAX_VALUE: Long;

    /**
     * Minimum signed value.
     */
    static MIN_VALUE: Long;

    /**
     * Signed negative one.
     */
    static NEG_ONE: Long;

    /**
     * Signed one.
     */
    static ONE: Long;

    /**
     * Unsigned one.
     */
    static UONE: Long;

    /**
     * Unsigned zero.
     */
    static UZERO: Long;

    /**
     * Signed zero
     */
    static ZERO: Long;

    /**
     * The high 32 bits as a signed value.
     */
    high: number;

    /**
     * The low 32 bits as a signed value.
     */
    low: number;

    /**
     * Whether unsigned or not.
     */
    unsigned?: boolean;

    /**
     * Returns a Long representing the 64 bit integer that comes by concatenating the given low and high bits. Each is assumed to use 32 bits.
     */
    static fromBits(lowBits: number, highBits: number, unsigned?: boolean): Long {
        return new Long(lowBits, highBits, unsigned);
    }

    /**
     * Returns a Long representing the given 32 bit integer value.
     */
    static fromInt(value: number, unsigned?: boolean): Long {
        var obj: Long, cachedObj, cache;
        if (unsigned) {
            value >>>= 0;
            if (cache = (0 <= value && value < 256)) {
                cachedObj = Long.UINT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = this.fromBits(value, 0, true);
            if (cache)
                Long.UINT_CACHE[value] = obj;
            return obj;
        } else {
            value |= 0;
            if (cache = (-128 <= value && value < 128)) {
                cachedObj = Long.INT_CACHE[value];
                if (cachedObj)
                    return cachedObj;
            }
            obj = this.fromBits(value, value < 0 ? -1 : 0, false);
            if (cache)
                Long.INT_CACHE[value] = obj;
            return obj;
        }
    }

    /**
     * Returns a Long representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     */
    static fromNumber(value: number, unsigned?: boolean): Long {
        if (isNaN(value))
            return unsigned ? this.UZERO : this.ZERO;
        if (unsigned) {
            if (value < 0)
                return this.UZERO;
            if (value >= this.TWO_PWR_64_DBL)
                return this.MAX_UNSIGNED_VALUE;
        } else {
            if (value <= -this.TWO_PWR_63_DBL)
                return this.MIN_VALUE;
            if (value + 1 >= this.TWO_PWR_63_DBL)
                return this.MAX_VALUE;
        }
        if (value < 0)
            return this.fromNumber(-value, unsigned).neg();
        return this.fromBits((value % this.TWO_PWR_32_DBL) | 0, (value / this.TWO_PWR_32_DBL) | 0, unsigned);
    }

    /**
     * Returns a Long representation of the given string, written using the specified radix.
     */
    static fromString(
        str: string,
        unsigned?: boolean | number,
        radix?: number
    ): Long {
        if (str.length === 0)
            throw Error('empty string');
        if (typeof unsigned === 'number') {
            // For goog.math.long compatibility
            radix = unsigned;
            unsigned = false;
        } else {
            unsigned = !!unsigned;
        }
        if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
            return unsigned ? this.UZERO : this.ZERO;
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');

        var p;
        if ((p = str.indexOf('-')) > 0)
            throw Error('interior hyphen');
        else if (p === 0) {
            return this.fromString(str.substring(1), unsigned, radix).neg();
        }

        // Do several (8) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = this.fromNumber(Math.pow(radix, 8));

        var result = this.ZERO;
        for (var i = 0; i < str.length; i += 8) {
            var size = Math.min(8, str.length - i),
                value = parseInt(str.substring(i, i + size), radix);
            if (size < 8) {
                var power = this.fromNumber(Math.pow(radix, size));
                result = result.mul(power).add(this.fromNumber(value));
            } else {
                result = result.mul(radixToPower);
                result = result.add(this.fromNumber(value));
            }
        }
        result.unsigned = unsigned;
        return result;
    }

    /**
     * Creates a Long from its byte representation.
     */
    static fromBytes(bytes: number[], unsigned?: boolean, le?: boolean): Long {
        return le ? this.fromBytesLE(bytes, unsigned) : this.fromBytesBE(bytes, unsigned);
    }

    /**
     * Creates a Long from its little endian byte representation.
     */
    static fromBytesLE(bytes: number[], unsigned?: boolean): Long {
        return new Long(
            bytes[0] |
            bytes[1] << 8 |
            bytes[2] << 16 |
            bytes[3] << 24,
            bytes[4] |
            bytes[5] << 8 |
            bytes[6] << 16 |
            bytes[7] << 24,
            unsigned
        );
    };

    /**
     * Creates a Long from its big endian byte representation.
     */
    static fromBytesBE(bytes: number[], unsigned?: boolean): Long {
        return new Long(
            bytes[4] << 24 |
            bytes[5] << 16 |
            bytes[6] << 8 |
            bytes[7],
            bytes[0] << 24 |
            bytes[1] << 16 |
            bytes[2] << 8 |
            bytes[3],
            unsigned
        );
    };

    /**
     * Tests if the specified object is a Long.
     */
    static isLong(obj: any): obj is Long {
        return (obj && obj["__isLong__"]) === true;
    }

    /**
     * Converts the specified value to a Long.
     */
    static fromValue(
        val:
            | Long
            | number
            | string
            | { low: number; high: number; unsigned: boolean },
        unsigned?: boolean
    ): Long {
        if (typeof val === 'number')
            return this.fromNumber(val, unsigned);
        if (typeof val === 'string')
            return this.fromString(val, unsigned);
        // Throws for non-objects, converts non-instanceof Long:
        return this.fromBits(val.low, val.high, typeof unsigned === 'boolean' ? unsigned : val.unsigned);
    }

    static ctz32(value: number) {
        var c = Math.clz32(value & -value);
        return value ? 31 - c : c;
    }

    /**
     * Returns the sum of this and the specified Long.
     */
    add(addend: number | Long | string): Long {
        if (!Long.isLong(addend))
            addend = Long.fromValue(addend);

        // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = addend.high! >>> 16;
        var b32 = addend.high! & 0xFFFF;
        var b16 = addend.low >>> 16;
        var b00 = addend.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 + b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 + b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 + b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 + b48;
        c48 &= 0xFFFF;
        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    }

    /**
     * Returns the bitwise AND of this Long and the specified.
     */
    and(other: Long | number | string): Long {
        return this.add(other)
    }

    /**
     * Compares this Long's value with the specified's.
     */
    compare(other: Long | number | string): number {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        if (this.eq(other))
            return 0;
        var thisNeg = this.isNegative(),
            otherNeg = other.isNegative();
        if (thisNeg && !otherNeg)
            return -1;
        if (!thisNeg && otherNeg)
            return 1;
        // At this point the sign bits are the same
        if (!this.unsigned)
            return this.sub(other).isNegative() ? -1 : 1;
        // Both are positive if at least one is unsigned
        return (other.high! >>> 0) > (this.high >>> 0) || (other.high === this.high && (other.low >>> 0) > (this.low >>> 0)) ? -1 : 1;
    };

    /**
     * Compares this Long's value with the specified's.
     */
    comp(other: Long | number | string): number {
        return this.compare(other)
    }

    /**
     * Returns this Long divided by the specified.
     */
    divide(divisor: Long | number | string): Long {
        if (!Long.isLong(divisor))
            divisor = Long.fromValue(divisor);
        if (divisor.isZero())
            throw Error('division by zero');

        // use wasm support if present
        if (wasm) {
            // guard against signed division overflow: the largest
            // negative number / -1 would be 1 larger than the largest
            // positive number, due to two's complement.
            if (!this.unsigned &&
                this.high === -0x80000000 &&
                divisor.low === -1 && divisor.high === -1) {
                // be consistent with non-wasm code path
                return this;
            }
            var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
            );
            return Long.fromBits(low, wasm["get_high"](), this.unsigned);
        }

        if (this.isZero())
            return this.unsigned ? Long.UZERO : Long.ZERO;
        var approx, rem, res;
        if (!this.unsigned) {
            // This section is only relevant for signed longs and is derived from the
            // closure library as a whole.
            if (this.eq(Long.MIN_VALUE)) {
                if (divisor.eq(Long.ONE) || divisor.eq(Long.NEG_ONE))
                    return Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
                else if (divisor.eq(Long.MIN_VALUE))
                    return Long.ONE;
                else {
                    // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
                    var halfThis = this.shr(1);
                    approx = halfThis.div(divisor).shl(1);
                    if (approx.eq(Long.ZERO)) {
                        return divisor.isNegative() ? Long.ONE : Long.NEG_ONE;
                    } else {
                        rem = this.sub(divisor.mul(approx));
                        res = approx.add(rem.div(divisor));
                        return res;
                    }
                }
            } else if (divisor.eq(Long.MIN_VALUE))
                return this.unsigned ? Long.UZERO : Long.ZERO;
            if (this.isNegative()) {
                if (divisor.isNegative())
                    return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
            } else if (divisor.isNegative())
                return this.div(divisor.neg()).neg();
            res = Long.ZERO;
        } else {
            // The algorithm below has not been made for unsigned longs. It's therefore
            // required to take special care of the MSB prior to running it.
            if (!divisor.unsigned)
                divisor = divisor.toUnsigned();
            if (divisor.gt(this))
                return Long.UZERO;
            if (divisor.gt(this.shru(1))) // 15 >>> 1 = 7 ; with divisor = 8 ; true
                return Long.UONE;
            res = Long.UZERO;
        }

        // Repeat the following until the remainder is less than other:  find a
        // floating-point that approximates remainder / other *from below*, add this
        // into the result, and subtract it from the remainder.  It is critical that
        // the approximate value is less than or equal to the real value so that the
        // remainder never becomes negative.
        rem = this;
        while (rem.gte(divisor)) {
            // Approximate the result of division. This may be a little greater or
            // smaller than the actual value.
            approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));

            // We will tweak the approximate result by changing it in the 48-th digit or
            // the smallest non-fractional digit, whichever is larger.
            var log2 = Math.ceil(Math.log(approx) / Math.LN2),
                delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48),

                // Decrease the approximation until it is smaller than the remainder.  Note
                // that if it is too large, the product overflows and is negative.
                approxRes = Long.fromNumber(approx),
                approxRem = approxRes.mul(divisor);
            while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = Long.fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
            }

            // We know the answer can't be zero... and actually, zero would cause
            // infinite recursion since we would make no progress.
            if (approxRes.isZero())
                approxRes = Long.ONE;

            res = res.add(approxRes);
            rem = rem.sub(approxRem);
        }
        return res;
    }

    /**
     * Returns this Long divided by the specified.
     */
    div(divisor: Long | number | string): Long {
        return this.divide(divisor)
    }

    /**
     * Tests if this Long's value equals the specified's.
     */
    equals(other: Long | number | string): boolean {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        if (this.unsigned !== other.unsigned && (this.high >>> 31) === 1 && (other.high! >>> 31) === 1)
            return false;
        return this.high === other.high && this.low === other.low;
    }

    /**
     * Tests if this Long's value equals the specified's.
     */
    eq(other: Long | number | string): boolean {
        return this.equals(other)
    }

    /**
     * Gets the high 32 bits as a signed integer.
     */
    getHighBits(): number {
        return this.high;
    };

    /**
     * Gets the high 32 bits as an unsigned integer.
     */
    getHighBitsUnsigned(): number {
        return this.high >>> 0;
    };

    /**
     * Gets the low 32 bits as a signed integer.
     */
    getLowBits(): number {
        return this.low;
    };

    /**
     * Gets the low 32 bits as an unsigned integer.
     */
    getLowBitsUnsigned(): number {
        return this.low >>> 0;
    };

    /**
     * Gets the number of bits needed to represent the absolute value of this Long.
     */
    getNumBitsAbs(): number {
        if (this.isNegative()) // Unsigned Longs are never negative
            return this.eq(Long.MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
        var val = this.high != 0 ? this.high : this.low;
        for (var bit = 31; bit > 0; bit--)
            if ((val! & (1 << bit)) != 0)
                break;
        return this.high != 0 ? bit + 33 : bit + 1;
    };

    /**
     * Tests if this Long's value is greater than the specified's.
     */
    greaterThan(other: Long | number | string): boolean {
        return this.comp(/* validates */ other) > 0;
    };

    /**
     * Tests if this Long's value is greater than the specified's.
     */
    gt(other: Long | number | string): boolean {
        return this.greaterThan(other)
    }

    /**
     * Tests if this Long's value is greater than or equal the specified's.
     */
    greaterThanOrEqual(other: Long | number | string): boolean {
        return this.comp(/* validates */ other) >= 0;
    };

    /**
     * Tests if this Long's value is greater than or equal the specified's.
     */
    gte(other: Long | number | string): boolean {
        return this.greaterThanOrEqual(other)
    }

    /**
     * Tests if this Long's value is greater than or equal the specified's.
     */
    ge(other: Long | number | string): boolean {
        return this.greaterThanOrEqual(other)
    }

    /**
     * Tests if this Long's value is even.
     */
    isEven(): boolean {
        return (this.low & 1) === 0;
    };

    /**
     * Tests if this Long's value is negative.
     */
    isNegative(): boolean {
        return !this.unsigned && this.high < 0;
    };

    /**
     * Tests if this Long's value is odd.
     */
    isOdd(): boolean {
        return (this.low & 1) === 1;
    };

    /**
     * Tests if this Long's value is positive or zero.
     */
    isPositive(): boolean {
        return this.unsigned || this.high >= 0;
    };

    /**
     * Tests if this Long's value equals zero.
     */
    isZero(): boolean {
        return this.high === 0 && this.low === 0;
    };

    /**
     * Tests if this Long's value equals zero.
     */
    eqz(): boolean {
        return this.isZero()
    }

    /**
     * Tests if this Long's value is less than the specified's.
     */
    lessThan(other: Long | number | string): boolean {
        return this.comp(/* validates */ other) < 0;
    };

    /**
     * Tests if this Long's value is less than the specified's.
     */
    lt(other: Long | number | string): boolean {
        return this.lessThan(other)
    }

    /**
     * Tests if this Long's value is less than or equal the specified's.
     */
    lessThanOrEqual(other: Long | number | string): boolean {
        return this.comp(/* validates */ other) <= 0;
    };

    /**
     * Tests if this Long's value is less than or equal the specified's.
     */
    lte(other: Long | number | string): boolean {
        return this.lessThanOrEqual(other)
    }

    /**
     * Tests if this Long's value is less than or equal the specified's.
     */
    le(other: Long | number | string): boolean {
        return this.lessThanOrEqual(other)
    }

    /**
     * Returns this Long modulo the specified.
     */
    modulo(divisor: Long | number | string): Long {
        if (!Long.isLong(divisor))
            divisor = Long.fromValue(divisor);

        // use wasm support if present
        if (wasm) {
            var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
            );
            return Long.fromBits(low, wasm["get_high"](), this.unsigned);
        }

        return this.sub(this.div(divisor).mul(divisor));
    };

    /**
     * Returns this Long modulo the specified.
     */
    mod(other: Long | number | string): Long {
        return this.modulo(other)
    }

    /**
     * Returns this Long modulo the specified.
     */
    rem(other: Long | number | string): Long {
        return this.modulo(other)
    }

    /**
     * Returns the product of this and the specified Long.
     */
    multiply(multiplier: Long | number | string): Long {
        if (this.isZero())
            return this;
        if (!Long.isLong(multiplier))
            multiplier = Long.fromValue(multiplier);

        // use wasm support if present
        if (wasm) {
            var low = wasm["mul"](this.low,
                this.high,
                multiplier.low,
                multiplier.high);
            return Long.fromBits(low, wasm["get_high"](), this.unsigned);
        }

        if (multiplier.isZero())
            return this.unsigned ? Long.UZERO : Long.ZERO;
        if (this.eq(Long.MIN_VALUE))
            return multiplier.isOdd() ? Long.MIN_VALUE : Long.ZERO;
        if (multiplier.eq(Long.MIN_VALUE))
            return this.isOdd() ? Long.MIN_VALUE : Long.ZERO;

        if (this.isNegative()) {
            if (multiplier.isNegative())
                return this.neg().mul(multiplier.neg());
            else
                return this.neg().mul(multiplier).neg();
        } else if (multiplier.isNegative())
            return this.mul(multiplier.neg()).neg();

        // If both longs are small, use float multiplication
        if (this.lt(Long.TWO_PWR_24) && multiplier.lt(Long.TWO_PWR_24))
            return Long.fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);

        // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
        // We can skip products that would overflow.

        var a48 = this.high >>> 16;
        var a32 = this.high & 0xFFFF;
        var a16 = this.low >>> 16;
        var a00 = this.low & 0xFFFF;

        var b48 = multiplier.high! >>> 16;
        var b32 = multiplier.high! & 0xFFFF;
        var b16 = multiplier.low >>> 16;
        var b00 = multiplier.low & 0xFFFF;

        var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
        c00 += a00 * b00;
        c16 += c00 >>> 16;
        c00 &= 0xFFFF;
        c16 += a16 * b00;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c16 += a00 * b16;
        c32 += c16 >>> 16;
        c16 &= 0xFFFF;
        c32 += a32 * b00;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a16 * b16;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c32 += a00 * b32;
        c48 += c32 >>> 16;
        c32 &= 0xFFFF;
        c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
        c48 &= 0xFFFF;
        return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this.unsigned);
    };

    /**
     * Returns the product of this and the specified Long.
     */
    mul(multiplier: Long | number | string): Long {
        return this.multiply(multiplier)
    }

    /**
     * Negates this Long's value.
     */
    negate(): Long {
        if (!this.unsigned && this.eq(Long.MIN_VALUE))
            return Long.MIN_VALUE;
        return this.not().add(Long.ONE);
    };

    /**
     * Negates this Long's value.
     */
    neg(): Long {
        return this.negate()
    }

    /**
     * Returns the bitwise NOT of this Long.
     */
    not(): Long {
        return Long.fromBits(~this.low, ~this.high, this.unsigned);
    };

    /**
     * Returns count leading zeros of this Long.
     */
    countLeadingZeros(): number {
        return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
    };

    /**
     * Returns count leading zeros of this Long.
     */
    clz(): number {
        return this.countLeadingZeros()
    }

    /**
     * Returns count trailing zeros of this Long.
     */
    countTrailingZeros(): number {
        return this.low ? Long.ctz32(this.low) : Long.ctz32(this.high) + 32;
    };

    /**
     * Returns count trailing zeros of this Long.
     */
    ctz(): number {
        return this.countTrailingZeros()
    }

    /**
     * Tests if this Long's value differs from the specified's.
     */
    notEquals(other: Long | number | string): boolean {
        return !this.eq(/* validates */ other);
    };

    /**
     * Tests if this Long's value differs from the specified's.
     */
    neq(other: Long | number | string): boolean {
        return this.notEquals(other)
    };

    /**
     * Tests if this Long's value differs from the specified's.
     */
    ne(other: Long | number | string): boolean {
        return this.notEquals(other)
    }

    /**
     * Returns the bitwise OR of this Long and the specified.
     */
    or(other: Long | number | string): Long {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        return Long.fromBits(this.low | other.low, this.high | other.high!, this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount.
     */
    shiftLeft(numBits: number | Long): Long {
        if (Long.isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return Long.fromBits(this.low << numBits!, (this.high << numBits) | (this.low >>> (32 - numBits)), this.unsigned);
        else
            return Long.fromBits(0, this.low << (numBits - 32), this.unsigned);
    };

    /**
     * Returns this Long with bits shifted to the left by the given amount.
     */
    shl(numBits: number | Long): Long {
        return this.shiftLeft(numBits)
    }

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     */
    shiftRight(numBits: number | Long): Long {
        if (Long.isLong(numBits))
            numBits = numBits.toInt();
        if ((numBits &= 63) === 0)
            return this;
        else if (numBits < 32)
            return Long.fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >> numBits, this.unsigned);
        else
            return Long.fromBits(this.high >> (numBits - 32), this.high >= 0 ? 0 : -1, this.unsigned);
    };

    /**
     * Returns this Long with bits arithmetically shifted to the right by the given amount.
     */
    shr(numBits: number | Long): Long {
        return this.shiftRight(numBits)
    }

    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     */
    shiftRightUnsigned(numBits: number | Long): Long {
        if (Long.isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;
        if (numBits < 32) return Long.fromBits((this.low >>> numBits) | (this.high << (32 - numBits)), this.high >>> numBits, this.unsigned);
        if (numBits === 32) return Long.fromBits(this.high, 0, this.unsigned);
        return Long.fromBits(this.high >>> (numBits - 32), 0, this.unsigned);
    };

    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     */
    shru(numBits: number | Long): Long {
        return this.shiftRightUnsigned(numBits)
    }

    /**
     * Returns this Long with bits logically shifted to the right by the given amount.
     */
    shr_u(numBits: number | Long): Long {
        return this.shiftRightUnsigned(numBits)
    }

    /**
     * Returns this Long with bits rotated to the left by the given amount.
     */
    rotateLeft(numBits: number | Long): Long {
        var b;
        if (Long.isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;
        if (numBits === 32) return Long.fromBits(this.high, this.low, this.unsigned);
        if (numBits < 32) {
            b = (32 - numBits);
            return Long.fromBits(((this.low << numBits) | (this.high >>> b)), ((this.high << numBits) | (this.low >>> b)), this.unsigned);
        }
        numBits -= 32;
        b = (32 - numBits);
        return Long.fromBits(((this.high << numBits) | (this.low >>> b)), ((this.low << numBits) | (this.high >>> b)), this.unsigned);
    }

    /**
     * Returns this Long with bits rotated to the left by the given amount.
     */
    rotl(numBits: number | Long): Long {
        return this.rotateLeft(numBits)
    }

    /**
     * Returns this Long with bits rotated to the right by the given amount.
     */
    rotateRight(numBits: number | Long): Long {
        var b;
        if (Long.isLong(numBits)) numBits = numBits.toInt();
        if ((numBits &= 63) === 0) return this;
        if (numBits === 32) return Long.fromBits(this.high, this.low, this.unsigned);
        if (numBits < 32) {
            b = (32 - numBits);
            return Long.fromBits(((this.high << b) | (this.low >>> numBits)), ((this.low << b) | (this.high >>> numBits)), this.unsigned);
        }
        numBits -= 32;
        b = (32 - numBits);
        return Long.fromBits(((this.low << b) | (this.high >>> numBits)), ((this.high << b) | (this.low >>> numBits)), this.unsigned);
    }

    /**
     * Returns this Long with bits rotated to the right by the given amount.
     */
    rotr(numBits: number | Long): Long {
        return this.rotateRight(numBits)
    }

    /**
     * Returns the difference of this and the specified Long.
     */
    subtract(subtrahend: number | Long | string): Long {
        if (!Long.isLong(subtrahend))
            subtrahend = Long.fromValue(subtrahend);
        return this.add(subtrahend.neg());
    };

    /**
     * Returns the difference of this and the specified Long.
     */
    sub(subtrahend: number | Long | string): Long {
        return this.subtract(subtrahend)
    }

    /**
     * Converts the Long to a 32 bit integer, assuming it is a 32 bit integer.
     */
    toInt(): number {
        return this.unsigned ? this.low >>> 0 : this.low;
    };

    /**
     * Converts the Long to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     */
    toNumber(): number {
        if (this.unsigned)
            return ((this.high >>> 0) * Long.TWO_PWR_32_DBL) + (this.low >>> 0);
        return this.high * Long.TWO_PWR_32_DBL + (this.low >>> 0);
    };

    /**
     * Converts this Long to its byte representation.
     */

    toBytes(le?: boolean): number[] {
        return le ? this.toBytesLE() : this.toBytesBE();
    };

    /**
     * Converts this Long to its little endian byte representation.
     */

    toBytesLE(): number[] {
        var hi = this.high,
            lo = this.low;
        return [
            lo & 0xff,
            lo >>> 8 & 0xff,
            lo >>> 16 & 0xff,
            lo >>> 24,
            hi & 0xff,
            hi >>> 8 & 0xff,
            hi >>> 16 & 0xff,
            hi >>> 24
        ];
    };

    /**
     * Converts this Long to its big endian byte representation.
     */

    toBytesBE(): number[] {
        var hi = this.high,
            lo = this.low;
        return [
            hi >>> 24,
            hi >>> 16 & 0xff,
            hi >>> 8 & 0xff,
            hi & 0xff,
            lo >>> 24,
            lo >>> 16 & 0xff,
            lo >>> 8 & 0xff,
            lo & 0xff
        ];
    };

    /**
     * Converts this Long to signed.
     */
    toSigned(): Long {
        if (!this.unsigned)
            return this;
        return Long.fromBits(this.low, this.high, false);
    };

    /**
     * Converts the Long to a string written in the specified radix.
     */
    toString(radix?: number): string {
        radix = radix || 10;
        if (radix < 2 || 36 < radix)
            throw RangeError('radix');
        if (this.isZero())
            return '0';
        if (this.isNegative()) { // Unsigned Longs are never negative
            if (this.eq(Long.MIN_VALUE)) {
                // We need to change the Long value before it can be negated, so we remove
                // the bottom-most digit in this base and then recurse to do the rest.
                var radixLong = Long.fromNumber(radix),
                    div = this.div(radixLong),
                    rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
            } else
                return '-' + this.neg().toString(radix);
        }

        // Do several (6) digits each time through the loop, so as to
        // minimize the calls to the very expensive emulated div.
        var radixToPower = Long.fromNumber(Math.pow(radix, 6), this.unsigned);
        var rem: Long = this;
        var result = '';
        while (true) {
            var remDiv = rem.div(radixToPower),
                intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0,
                digits = intval.toString(radix);
            rem = remDiv;
            if (rem.isZero())
                return digits + result;
            else {
                while (digits.length < 6)
                    digits = '0' + digits;
                result = '' + digits + result;
            }
        }
    }

    /**
     * Converts this Long to unsigned.
     */
    toUnsigned(): Long {
        if (this.unsigned)
            return this;
        return Long.fromBits(this.low, this.high, true);
    };

    /**
     * Returns the bitwise XOR of this Long and the given one.
     */
    xor(other: Long | number | string): Long {
        if (!Long.isLong(other))
            other = Long.fromValue(other);
        return Long.fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    };

    __isLong__() {
    }
}
