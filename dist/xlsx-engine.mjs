// ../../../../../../Volumes/File/cortex/node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ (() => BigInt(2 ** 32 - 1))();
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var fromNumH = (n) => n / 2 ** 32 | 0;
var fromNumL = (n) => n >>> 0;
function setU64FromNum(view, byteOffset, n, isLE) {
  const h = fromNumH(n);
  const l = fromNumL(n);
  view.setUint32(byteOffset, isLE ? l : h, isLE);
  view.setUint32(byteOffset + 4, isLE ? h : l, isLE);
}
var shrSH = (h, _l, s) => h >>> s;
var shrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// ../../../../../../Volumes/File/cortex/node_modules/@noble/hashes/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
}
var atitle = (title) => title ? `"${title}" ` : "";
function anumber(n, title = "") {
  if (typeof n !== "number")
    throw new TypeError(atitle(title) + "expected number, got " + typeof n);
  if (!Number.isSafeInteger(n) || n < 0)
    throw new RangeError(atitle(title) + "expected integer >= 0, got " + n);
  return n;
}
function abytes(value, length, title = "") {
  if (isBytes(value) && (length === void 0 || value.length === length))
    return value;
  if (length !== void 0)
    anumber(length, "length");
  const bytes = isBytes(value);
  const ofLen = length !== void 0 ? ` of length ${length}` : "";
  const got = bytes ? `length=${value.length}` : `type=${typeof value}`;
  const message = atitle(title) + "expected Uint8Array" + ofLen + ", got " + got;
  if (!bytes)
    throw new TypeError(message);
  throw new RangeError(message);
}
var aobject = (value, label) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError((label === "object" ? "" : `"${label}" `) + "expected object, got type=" + typeof value);
};
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("hash was destroyed");
  if (checkFinished && instance.finished)
    throw new Error("digest() was already called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "output");
  const min = instance.outputLen;
  if (!(out.length >= min)) {
    throw new RangeError('"output" expected length >= ' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function checkOpts(defaults, opts, title = "opts") {
  aobject(defaults, "defaults");
  if (opts !== void 0)
    aobject(opts, title);
  const merged = Object.assign(defaults, opts);
  return merged;
}
function createHasher(hashCons, info = {}) {
  if (typeof hashCons !== "function")
    throw new TypeError('"hashCons" expected function, got type=' + typeof hashCons);
  info = checkOpts({}, info, "info");
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.canXOF = tmp.canXOF;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
var oidNist = (suffix) => ({
  // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
  // Larger suffix values would need base-128 OID encoding and a different length byte.
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../../../../../../Volumes/File/cortex/node_modules/@noble/hashes/_md.js
var HashMD = class {
  blockLen;
  outputLen;
  canXOF = false;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    let processed = false;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        processed = true;
        continue;
      }
      buffer.set(pos === 0 && take === len ? data : data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
        processed = true;
      }
    }
    this.length += data.length;
    if (processed)
      this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    buffer.fill(0, pos);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      buffer.fill(0);
    }
    setU64FromNum(view, blockLen - 8, this.length * 8, isLE);
    this.process(view, 0);
    this.roundClean();
    const oview = out === buffer ? view : createView(out);
    const len = this.outputLen;
    const outLen = len / 4;
    const state = this.get();
    if (len % 4 || outLen > state.length)
      throw new Error("invalid outputLen");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneIntoMeta(to) {
    const { buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (pos)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/ext-uri-BHBcIrW7.mjs
var stripColorHashPrefix = (color) => color.charAt(0) === "#" ? color.substring(1) : color;
var parseOnOff = (raw) => {
  if (raw === void 0) return void 0;
  if (typeof raw === "boolean") return raw;
  const s = String(raw).toLowerCase();
  if (s === "1" || s === "true" || s === "on" || s === "t") return true;
  if (s === "0" || s === "false" || s === "off" || s === "f") return false;
};
var _polyfill_node_global_default = typeof _polyfill_node_global_default !== "undefined" ? _polyfill_node_global_default : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
var inited = false;
function init() {
  inited = true;
  var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }
  revLookup["-".charCodeAt(0)] = 62;
  revLookup["_".charCodeAt(0)] = 63;
}
function toByteArray(b64) {
  if (!inited) init();
  var i, j, l, tmp, placeHolders, arr;
  var len = b64.length;
  if (len % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
  placeHolders = b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
  arr = new Arr(len * 3 / 4 - placeHolders);
  l = placeHolders > 0 ? len - 4 : len;
  var L = 0;
  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[L++] = tmp >> 16 & 255;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  if (placeHolders === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[L++] = tmp & 255;
  } else if (placeHolders === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[L++] = tmp >> 8 & 255;
    arr[L++] = tmp & 255;
  }
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
    output.push(tripletToBase64(tmp));
  }
  return output.join("");
}
function fromByteArray(uint8) {
  if (!inited) init();
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3;
  var output = "";
  var parts = [];
  var maxChunkLength = 16383;
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    output += lookup[tmp >> 2];
    output += lookup[tmp << 4 & 63];
    output += "==";
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    output += lookup[tmp >> 10];
    output += lookup[tmp >> 4 & 63];
    output += lookup[tmp << 2 & 63];
    output += "=";
  }
  parts.push(output);
  return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) ;
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) ;
  if (e === 0) e = 1 - eBias;
  else if (e === eMax) return m ? NaN : (s ? -1 : 1) * Infinity;
  else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) value += rt / c;
    else value += rt * Math.pow(2, 1 - eBias);
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) ;
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) ;
  buffer[offset + i - d] |= s * 128;
}
var toString = {}.toString;
var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == "[object Array]";
};
Buffer.TYPED_ARRAY_SUPPORT = _polyfill_node_global_default.TYPED_ARRAY_SUPPORT !== void 0 ? _polyfill_node_global_default.TYPED_ARRAY_SUPPORT : true;
kMaxLength();
function kMaxLength() {
  return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
}
function createBuffer(that, length) {
  if (kMaxLength() < length) throw new RangeError("Invalid typed array length");
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    that = new Uint8Array(length);
    that.__proto__ = Buffer.prototype;
  } else {
    if (that === null) that = new Buffer(length);
    that.length = length;
  }
  return that;
}
function Buffer(arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) return new Buffer(arg, encodingOrOffset, length);
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string") throw new Error("If encoding is specified then the first argument must be a string");
    return allocUnsafe(this, arg);
  }
  return from(this, arg, encodingOrOffset, length);
}
Buffer.poolSize = 8192;
Buffer._augment = function(arr) {
  arr.__proto__ = Buffer.prototype;
  return arr;
};
function from(that, value, encodingOrOffset, length) {
  if (typeof value === "number") throw new TypeError('"value" argument must not be a number');
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return fromArrayBuffer(that, value, encodingOrOffset, length);
  if (typeof value === "string") return fromString(that, value, encodingOrOffset);
  return fromObject(that, value);
}
Buffer.from = function(value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length);
};
if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype;
  Buffer.__proto__ = Uint8Array;
  if (typeof Symbol !== "undefined" && Symbol.species && Buffer[Symbol.species] === Buffer) ;
}
function assertSize(size) {
  if (typeof size !== "number") throw new TypeError('"size" argument must be a number');
  else if (size < 0) throw new RangeError('"size" argument must not be negative');
}
function alloc(that, size, fill2, encoding) {
  assertSize(size);
  if (size <= 0) return createBuffer(that, size);
  if (fill2 !== void 0) return typeof encoding === "string" ? createBuffer(that, size).fill(fill2, encoding) : createBuffer(that, size).fill(fill2);
  return createBuffer(that, size);
}
Buffer.alloc = function(size, fill2, encoding) {
  return alloc(null, size, fill2, encoding);
};
function allocUnsafe(that, size) {
  assertSize(size);
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) for (var i = 0; i < size; ++i) that[i] = 0;
  return that;
}
Buffer.allocUnsafe = function(size) {
  return allocUnsafe(null, size);
};
Buffer.allocUnsafeSlow = function(size) {
  return allocUnsafe(null, size);
};
function fromString(that, string, encoding) {
  if (typeof encoding !== "string" || encoding === "") encoding = "utf8";
  if (!Buffer.isEncoding(encoding)) throw new TypeError('"encoding" must be a valid string encoding');
  var length = byteLength(string, encoding) | 0;
  that = createBuffer(that, length);
  var actual = that.write(string, encoding);
  if (actual !== length) that = that.slice(0, actual);
  return that;
}
function fromArrayLike(that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0;
  that = createBuffer(that, length);
  for (var i = 0; i < length; i += 1) that[i] = array[i] & 255;
  return that;
}
function fromArrayBuffer(that, array, byteOffset, length) {
  array.byteLength;
  if (byteOffset < 0 || array.byteLength < byteOffset) throw new RangeError("'offset' is out of bounds");
  if (array.byteLength < byteOffset + (length || 0)) throw new RangeError("'length' is out of bounds");
  if (byteOffset === void 0 && length === void 0) array = new Uint8Array(array);
  else if (length === void 0) array = new Uint8Array(array, byteOffset);
  else array = new Uint8Array(array, byteOffset, length);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    that = array;
    that.__proto__ = Buffer.prototype;
  } else that = fromArrayLike(that, array);
  return that;
}
function fromObject(that, obj) {
  if (internalIsBuffer(obj)) {
    var len = checked(obj.length) | 0;
    that = createBuffer(that, len);
    if (that.length === 0) return that;
    obj.copy(that, 0, 0, len);
    return that;
  }
  if (obj) {
    if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
      if (typeof obj.length !== "number" || isnan(obj.length)) return createBuffer(that, 0);
      return fromArrayLike(that, obj);
    }
    if (obj.type === "Buffer" && isArray(obj.data)) return fromArrayLike(that, obj.data);
  }
  throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
}
function checked(length) {
  if (length >= kMaxLength()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength().toString(16) + " bytes");
  return length | 0;
}
Buffer.isBuffer = isBuffer;
function internalIsBuffer(b) {
  return !!(b != null && b._isBuffer);
}
Buffer.compare = function compare(a, b) {
  if (!internalIsBuffer(a) || !internalIsBuffer(b)) throw new TypeError("Arguments must be Buffers");
  if (a === b) return 0;
  var x = a.length;
  var y = b.length;
  for (var i = 0, len = Math.min(x, y); i < len; ++i) if (a[i] !== b[i]) {
    x = a[i];
    y = b[i];
    break;
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
Buffer.isEncoding = function isEncoding(encoding) {
  switch (String(encoding).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return true;
    default:
      return false;
  }
};
Buffer.concat = function concat(list, length) {
  if (!isArray(list)) throw new TypeError('"list" argument must be an Array of Buffers');
  if (list.length === 0) return Buffer.alloc(0);
  var i;
  if (length === void 0) {
    length = 0;
    for (i = 0; i < list.length; ++i) length += list[i].length;
  }
  var buffer = Buffer.allocUnsafe(length);
  var pos = 0;
  for (i = 0; i < list.length; ++i) {
    var buf = list[i];
    if (!internalIsBuffer(buf)) throw new TypeError('"list" argument must be an Array of Buffers');
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};
function byteLength(string, encoding) {
  if (internalIsBuffer(string)) return string.length;
  if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) return string.byteLength;
  if (typeof string !== "string") string = "" + string;
  var len = string.length;
  if (len === 0) return 0;
  var loweredCase = false;
  for (; ; ) switch (encoding) {
    case "ascii":
    case "latin1":
    case "binary":
      return len;
    case "utf8":
    case "utf-8":
    case void 0:
      return utf8ToBytes(string).length;
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return len * 2;
    case "hex":
      return len >>> 1;
    case "base64":
      return base64ToBytes(string).length;
    default:
      if (loweredCase) return utf8ToBytes(string).length;
      encoding = ("" + encoding).toLowerCase();
      loweredCase = true;
  }
}
Buffer.byteLength = byteLength;
function slowToString(encoding, start, end) {
  var loweredCase = false;
  if (start === void 0 || start < 0) start = 0;
  if (start > this.length) return "";
  if (end === void 0 || end > this.length) end = this.length;
  if (end <= 0) return "";
  end >>>= 0;
  start >>>= 0;
  if (end <= start) return "";
  if (!encoding) encoding = "utf8";
  while (true) switch (encoding) {
    case "hex":
      return hexSlice(this, start, end);
    case "utf8":
    case "utf-8":
      return utf8Slice(this, start, end);
    case "ascii":
      return asciiSlice(this, start, end);
    case "latin1":
    case "binary":
      return latin1Slice(this, start, end);
    case "base64":
      return base64Slice(this, start, end);
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return utf16leSlice(this, start, end);
    default:
      if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
      encoding = (encoding + "").toLowerCase();
      loweredCase = true;
  }
}
Buffer.prototype._isBuffer = true;
function swap(b, n, m) {
  var i = b[n];
  b[n] = b[m];
  b[m] = i;
}
Buffer.prototype.swap16 = function swap16() {
  var len = this.length;
  if (len % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
  for (var i = 0; i < len; i += 2) swap(this, i, i + 1);
  return this;
};
Buffer.prototype.swap32 = function swap32() {
  var len = this.length;
  if (len % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3);
    swap(this, i + 1, i + 2);
  }
  return this;
};
Buffer.prototype.swap64 = function swap64() {
  var len = this.length;
  if (len % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7);
    swap(this, i + 1, i + 6);
    swap(this, i + 2, i + 5);
    swap(this, i + 3, i + 4);
  }
  return this;
};
Buffer.prototype.toString = function toString2() {
  var length = this.length | 0;
  if (length === 0) return "";
  if (arguments.length === 0) return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};
Buffer.prototype.equals = function equals(b) {
  if (!internalIsBuffer(b)) throw new TypeError("Argument must be a Buffer");
  if (this === b) return true;
  return Buffer.compare(this, b) === 0;
};
Buffer.prototype.inspect = function inspect() {
  var str = "";
  var max2 = 50;
  if (this.length > 0) {
    str = this.toString("hex", 0, max2).match(/.{2}/g).join(" ");
    if (this.length > max2) str += " ... ";
  }
  return "<Buffer " + str + ">";
};
Buffer.prototype.compare = function compare2(target, start, end, thisStart, thisEnd) {
  if (!internalIsBuffer(target)) throw new TypeError("Argument must be a Buffer");
  if (start === void 0) start = 0;
  if (end === void 0) end = target ? target.length : 0;
  if (thisStart === void 0) thisStart = 0;
  if (thisEnd === void 0) thisEnd = this.length;
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) throw new RangeError("out of range index");
  if (thisStart >= thisEnd && start >= end) return 0;
  if (thisStart >= thisEnd) return -1;
  if (start >= end) return 1;
  start >>>= 0;
  end >>>= 0;
  thisStart >>>= 0;
  thisEnd >>>= 0;
  if (this === target) return 0;
  var x = thisEnd - thisStart;
  var y = end - start;
  var len = Math.min(x, y);
  var thisCopy = this.slice(thisStart, thisEnd);
  var targetCopy = target.slice(start, end);
  for (var i = 0; i < len; ++i) if (thisCopy[i] !== targetCopy[i]) {
    x = thisCopy[i];
    y = targetCopy[i];
    break;
  }
  if (x < y) return -1;
  if (y < x) return 1;
  return 0;
};
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0) return -1;
  if (typeof byteOffset === "string") {
    encoding = byteOffset;
    byteOffset = 0;
  } else if (byteOffset > 2147483647) byteOffset = 2147483647;
  else if (byteOffset < -2147483648) byteOffset = -2147483648;
  byteOffset = +byteOffset;
  if (isNaN(byteOffset)) byteOffset = dir ? 0 : buffer.length - 1;
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length) {
    if (dir) return -1;
    else byteOffset = buffer.length - 1;
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0;
    else return -1;
  }
  if (typeof val === "string") val = Buffer.from(val, encoding);
  if (internalIsBuffer(val)) {
    if (val.length === 0) return -1;
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    val = val & 255;
    if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
      if (dir) return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      else return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw new TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  var indexSize = 1;
  var arrLength = arr.length;
  var valLength = val.length;
  if (encoding !== void 0) {
    encoding = String(encoding).toLowerCase();
    if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2) return -1;
      indexSize = 2;
      arrLength /= 2;
      valLength /= 2;
      byteOffset /= 2;
    }
  }
  function read2(buf, i2) {
    if (indexSize === 1) return buf[i2];
    else return buf.readUInt16BE(i2 * indexSize);
  }
  var i;
  if (dir) {
    var foundIndex = -1;
    for (i = byteOffset; i < arrLength; i++) if (read2(arr, i) === read2(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i;
      if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
    } else {
      if (foundIndex !== -1) i -= i - foundIndex;
      foundIndex = -1;
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
    for (i = byteOffset; i >= 0; i--) {
      var found = true;
      for (var j = 0; j < valLength; j++) if (read2(arr, i + j) !== read2(val, j)) {
        found = false;
        break;
      }
      if (found) return i;
    }
  }
  return -1;
}
Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  var remaining = buf.length - offset;
  if (!length) length = remaining;
  else {
    length = Number(length);
    if (length > remaining) length = remaining;
  }
  var strLen = string.length;
  if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
  if (length > strLen / 2) length = strLen / 2;
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(parsed)) return i;
    buf[offset + i] = parsed;
  }
  return i;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function latin1Write(buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer.prototype.write = function write2(string, offset, length, encoding) {
  if (offset === void 0) {
    encoding = "utf8";
    length = this.length;
    offset = 0;
  } else if (length === void 0 && typeof offset === "string") {
    encoding = offset;
    length = this.length;
    offset = 0;
  } else if (isFinite(offset)) {
    offset = offset | 0;
    if (isFinite(length)) {
      length = length | 0;
      if (encoding === void 0) encoding = "utf8";
    } else {
      encoding = length;
      length = void 0;
    }
  } else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
  var remaining = this.length - offset;
  if (length === void 0 || length > remaining) length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) throw new RangeError("Attempt to write outside buffer bounds");
  if (!encoding) encoding = "utf8";
  var loweredCase = false;
  for (; ; ) switch (encoding) {
    case "hex":
      return hexWrite(this, string, offset, length);
    case "utf8":
    case "utf-8":
      return utf8Write(this, string, offset, length);
    case "ascii":
      return asciiWrite(this, string, offset, length);
    case "latin1":
    case "binary":
      return latin1Write(this, string, offset, length);
    case "base64":
      return base64Write(this, string, offset, length);
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return ucs2Write(this, string, offset, length);
    default:
      if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
      encoding = ("" + encoding).toLowerCase();
      loweredCase = true;
  }
};
Buffer.prototype.toJSON = function toJSON() {
  return {
    type: "Buffer",
    data: Array.prototype.slice.call(this._arr || this, 0)
  };
};
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length) return fromByteArray(buf);
  else return fromByteArray(buf.slice(start, end));
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  var res = [];
  var i = start;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128) codePoint = firstByte;
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 192) === 128) {
            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
            if (tempCodePoint > 127) codePoint = tempCodePoint;
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) codePoint = tempCodePoint;
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
            if (tempCodePoint > 65535 && tempCodePoint < 1114112) codePoint = tempCodePoint;
          }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
var MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  var len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) return String.fromCharCode.apply(String, codePoints);
  var res = "";
  var i = 0;
  while (i < len) res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  return res;
}
function asciiSlice(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i] & 127);
  return ret;
}
function latin1Slice(buf, start, end) {
  var ret = "";
  end = Math.min(buf.length, end);
  for (var i = start; i < end; ++i) ret += String.fromCharCode(buf[i]);
  return ret;
}
function hexSlice(buf, start, end) {
  var len = buf.length;
  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;
  var out = "";
  for (var i = start; i < end; ++i) out += toHex(buf[i]);
  return out;
}
function utf16leSlice(buf, start, end) {
  var bytes = buf.slice(start, end);
  var res = "";
  for (var i = 0; i < bytes.length; i += 2) res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
  return res;
}
Buffer.prototype.slice = function slice(start, end) {
  var len = this.length;
  start = ~~start;
  end = end === void 0 ? len : ~~end;
  if (start < 0) {
    start += len;
    if (start < 0) start = 0;
  } else if (start > len) start = len;
  if (end < 0) {
    end += len;
    if (end < 0) end = 0;
  } else if (end > len) end = len;
  if (end < start) end = start;
  var newBuf;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end);
    newBuf.__proto__ = Buffer.prototype;
  } else {
    var sliceLen = end - start;
    newBuf = new Buffer(sliceLen, void 0);
    for (var i = 0; i < sliceLen; ++i) newBuf[i] = this[i + start];
  }
  return newBuf;
};
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
  if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
}
Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength2, noAssert) {
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) checkOffset(offset, byteLength2, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength2 && (mul *= 256)) val += this[offset + i] * mul;
  return val;
};
Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength2, noAssert) {
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) checkOffset(offset, byteLength2, this.length);
  var val = this[offset + --byteLength2];
  var mul = 1;
  while (byteLength2 > 0 && (mul *= 256)) val += this[offset + --byteLength2] * mul;
  return val;
};
Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  return this[offset];
};
Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
};
Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer.prototype.readIntLE = function readIntLE(offset, byteLength2, noAssert) {
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) checkOffset(offset, byteLength2, this.length);
  var val = this[offset];
  var mul = 1;
  var i = 0;
  while (++i < byteLength2 && (mul *= 256)) val += this[offset + i] * mul;
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer.prototype.readIntBE = function readIntBE(offset, byteLength2, noAssert) {
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) checkOffset(offset, byteLength2, this.length);
  var i = byteLength2;
  var mul = 1;
  var val = this[offset + --i];
  while (i > 0 && (mul *= 256)) val += this[offset + --i] * mul;
  mul *= 128;
  if (val >= mul) val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length);
  if (!(this[offset] & 128)) return this[offset];
  return (255 - this[offset] + 1) * -1;
};
Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset] | this[offset + 1] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length);
  var val = this[offset + 1] | this[offset] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4);
};
Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4);
};
Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8);
};
Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max2, min) {
  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
  if (value > max2 || value < min) throw new RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
}
Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength2, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  var mul = 1;
  var i = 0;
  this[offset] = value & 255;
  while (++i < byteLength2 && (mul *= 256)) this[offset + i] = value / mul & 255;
  return offset + byteLength2;
};
Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength2, noAssert) {
  value = +value;
  offset = offset | 0;
  byteLength2 = byteLength2 | 0;
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  var i = byteLength2 - 1;
  var mul = 1;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) this[offset + i] = value / mul & 255;
  return offset + byteLength2;
};
Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  this[offset] = value & 255;
  return offset + 1;
};
function objectWriteUInt16(buf, value, offset, littleEndian) {
  if (value < 0) value = 65535 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
}
Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else objectWriteUInt16(this, value, offset, true);
  return offset + 2;
};
Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else objectWriteUInt16(this, value, offset, false);
  return offset + 2;
};
function objectWriteUInt32(buf, value, offset, littleEndian) {
  if (value < 0) value = 4294967295 + value + 1;
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
}
Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 255;
  } else objectWriteUInt32(this, value, offset, true);
  return offset + 4;
};
Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else objectWriteUInt32(this, value, offset, false);
  return offset + 4;
};
Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength2, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  var i = 0;
  var mul = 1;
  var sub = 0;
  this[offset] = value & 255;
  while (++i < byteLength2 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) sub = 1;
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength2, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  var i = byteLength2 - 1;
  var mul = 1;
  var sub = 0;
  this[offset + i] = value & 255;
  while (--i >= 0 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) sub = 1;
    this[offset + i] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
  if (value < 0) value = 255 + value + 1;
  this[offset] = value & 255;
  return offset + 1;
};
Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
  } else objectWriteUInt16(this, value, offset, true);
  return offset + 2;
};
Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
  } else objectWriteUInt16(this, value, offset, false);
  return offset + 2;
};
Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
  } else objectWriteUInt32(this, value, offset, true);
  return offset + 4;
};
Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
  value = +value;
  offset = offset | 0;
  if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (value < 0) value = 4294967295 + value + 1;
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
  } else objectWriteUInt32(this, value, offset, false);
  return offset + 4;
};
function checkIEEE754(buf, value, offset, ext, max2, min) {
  if (offset + ext > buf.length) throw new RangeError("Index out of range");
  if (offset < 0) throw new RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) checkIEEE754(buf, value, offset, 4);
  write(buf, value, offset, littleEndian, 23, 4);
  return offset + 4;
}
Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};
Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) checkIEEE754(buf, value, offset, 8);
  write(buf, value, offset, littleEndian, 52, 8);
  return offset + 8;
}
Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};
Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
};
Buffer.prototype.copy = function copy(target, targetStart, start, end) {
  if (!start) start = 0;
  if (!end && end !== 0) end = this.length;
  if (targetStart >= target.length) targetStart = target.length;
  if (!targetStart) targetStart = 0;
  if (end > 0 && end < start) end = start;
  if (end === start) return 0;
  if (target.length === 0 || this.length === 0) return 0;
  if (targetStart < 0) throw new RangeError("targetStart out of bounds");
  if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
  if (end < 0) throw new RangeError("sourceEnd out of bounds");
  if (end > this.length) end = this.length;
  if (target.length - targetStart < end - start) end = target.length - targetStart + start;
  var len = end - start;
  var i;
  if (this === target && start < targetStart && targetStart < end) for (i = len - 1; i >= 0; --i) target[i + targetStart] = this[i + start];
  else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) for (i = 0; i < len; ++i) target[i + targetStart] = this[i + start];
  else Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
  return len;
};
Buffer.prototype.fill = function fill(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string") {
      encoding = start;
      start = 0;
      end = this.length;
    } else if (typeof end === "string") {
      encoding = end;
      end = this.length;
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0);
      if (code < 256) val = code;
    }
    if (encoding !== void 0 && typeof encoding !== "string") throw new TypeError("encoding must be a string");
    if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) throw new TypeError("Unknown encoding: " + encoding);
  } else if (typeof val === "number") val = val & 255;
  if (start < 0 || this.length < start || this.length < end) throw new RangeError("Out of range index");
  if (end <= start) return this;
  start = start >>> 0;
  end = end === void 0 ? this.length : end >>> 0;
  if (!val) val = 0;
  var i;
  if (typeof val === "number") for (i = start; i < end; ++i) this[i] = val;
  else {
    var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
    var len = bytes.length;
    for (i = 0; i < end - start; ++i) this[i + start] = bytes[i % len];
  }
  return this;
};
var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
function base64clean(str) {
  str = stringtrim(str).replace(INVALID_BASE64_RE, "");
  if (str.length < 2) return "";
  while (str.length % 4 !== 0) str = str + "=";
  return str;
}
function stringtrim(str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, "");
}
function toHex(n) {
  if (n < 16) return "0" + n.toString(16);
  return n.toString(16);
}
function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1) bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) bytes.push(239, 191, 189);
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else throw new Error("Invalid code point");
  }
  return bytes;
}
function asciiToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) byteArray.push(str.charCodeAt(i) & 255);
  return byteArray;
}
function utf16leToBytes(str, units) {
  var c, hi, lo;
  var byteArray = [];
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break;
    c = str.charCodeAt(i);
    hi = c >> 8;
    lo = c % 256;
    byteArray.push(lo);
    byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) break;
    dst[i + offset] = src[i];
  }
  return i;
}
function isnan(val) {
  return val !== val;
}
function isBuffer(obj) {
  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
}
function isFastBuffer(obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
}
function isSlowBuffer(obj) {
  return typeof obj.readFloatLE === "function" && typeof obj.slice === "function" && isFastBuffer(obj.slice(0, 0));
}
function decodeBase64(input) {
  const fromBase64 = Uint8Array.fromBase64;
  if (typeof fromBase64 === "function") return fromBase64.call(Uint8Array, input);
  if (typeof Buffer !== "undefined") return Buffer.from(input, "base64");
  return Uint8Array.from(atob(input), (c) => c.codePointAt(0));
}
function encodeBase64(bytes) {
  const toBase64 = Uint8Array.prototype.toBase64;
  if (typeof toBase64 === "function") return toBase64.call(bytes);
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
var DATA_URL_RE = /^data:([\w.+-]+\/[\w.+-]+)?;base64,/;
function toUint8Array(data, options) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (data instanceof DataView) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data === "string") {
    const match = data.match(DATA_URL_RE);
    if (match) return decodeBase64(data.slice(match[0].length));
    if (options?.encoding === "base64") return decodeBase64(data);
    return new TextEncoder().encode(data);
  }
  if (Array.isArray(data)) return new Uint8Array(data);
  if (data instanceof Blob) throw new TypeError("Blob input requires async processing");
  if (data instanceof ReadableStream) throw new TypeError("ReadableStream input requires async processing");
  throw new TypeError(`Unsupported data type: ${typeof data}`);
}
function invertMap(map) {
  const result = {};
  for (const key of Object.keys(map)) result[map[key]] = key;
  return result;
}
function bidi(forward) {
  const reverse = invertMap(forward);
  return {
    /** User-friendly value → XSD value */
    to: (key) => forward[key] ?? key,
    /** XSD value → user-friendly value */
    from: (xsd) => reverse[xsd] ?? xsd,
    /** The forward map (user → XSD) */
    forward,
    /** The reverse map (XSD → user) */
    reverse
  };
}
var xsdRectAlignment = bidi({
  topLeft: "tl",
  top: "t",
  topRight: "tr",
  left: "l",
  center: "ctr",
  right: "r",
  bottomLeft: "bl",
  bottom: "b",
  bottomRight: "br"
});
var xsdTextAlign = bidi({
  left: "l",
  center: "ctr",
  right: "r",
  justify: "just"
});
var xsdTextAnchor = bidi({
  top: "t",
  center: "ctr",
  bottom: "b",
  justify: "just",
  distribute: "dist"
});
var xsdLineCap = bidi({
  round: "rnd",
  square: "sq",
  flat: "flat"
});
var xsdCompoundLine = bidi({
  single: "sng",
  double: "dbl",
  thickThin: "thickThin",
  thinThick: "thinThick",
  triple: "tri"
});
var xsdPenAlignment = bidi({
  center: "ctr",
  inside: "in"
});
var xsdLineEndSize = bidi({
  small: "sm",
  medium: "med",
  large: "lg"
});
var xsdBlendMode = bidi({
  over: "over",
  multiply: "mult",
  screen: "screen",
  darken: "darken",
  lighten: "lighten"
});
var xsdPathFillMode = bidi({
  none: "none",
  normal: "norm",
  lighten: "lighten",
  lightenLess: "lightenLess",
  darken: "darken",
  darkenLess: "darkenLess"
});
var xsdEffectContainer = bidi({
  sibling: "sib",
  tree: "tree"
});
var xsdPresetShadow = bidi({
  shadow1: "shdw1",
  shadow2: "shdw2",
  shadow3: "shdw3",
  shadow4: "shdw4",
  shadow5: "shdw5",
  shadow6: "shdw6",
  shadow7: "shdw7",
  shadow8: "shdw8",
  shadow9: "shdw9",
  shadow10: "shdw10",
  shadow11: "shdw11",
  shadow12: "shdw12",
  shadow13: "shdw13",
  shadow14: "shdw14",
  shadow15: "shdw15",
  shadow16: "shdw16",
  shadow17: "shdw17",
  shadow18: "shdw18",
  shadow19: "shdw19",
  shadow20: "shdw20"
});
var xsdLightRigDirection = bidi({
  topLeft: "tl",
  top: "t",
  topRight: "tr",
  left: "l",
  right: "r",
  bottomLeft: "bl",
  bottom: "b",
  bottomRight: "br"
});
var xsdMaterialType = bidi({
  legacyMatte: "legacyMatte",
  legacyPlastic: "legacyPlastic",
  legacyMetal: "legacyMetal",
  legacyWireframe: "legacyWireframe",
  matte: "matte",
  plastic: "plastic",
  metal: "metal",
  warmMatte: "warmMatte",
  translucentPowder: "translucentPowder",
  powder: "powder",
  darkEdge: "dkEdge",
  softEdge: "softEdge",
  clear: "clear",
  flat: "flat",
  softMetal: "softmetal"
});
var xsdPattern = bidi({
  percent5: "pct5",
  percent10: "pct10",
  percent20: "pct20",
  percent25: "pct25",
  percent30: "pct30",
  percent40: "pct40",
  percent50: "pct50",
  percent60: "pct60",
  percent70: "pct70",
  percent75: "pct75",
  percent80: "pct80",
  percent90: "pct90",
  horizontal: "horz",
  vertical: "vert",
  lightHorizontal: "ltHorz",
  lightVertical: "ltVert",
  darkHorizontal: "dkHorz",
  darkVertical: "dkVert",
  narrowHorizontal: "narHorz",
  narrowVertical: "narVert",
  dashedHorizontal: "dashHorz",
  dashedVertical: "dashVert",
  cross: "cross",
  downDiagonal: "dnDiag",
  upDiagonal: "upDiag",
  lightDownDiagonal: "ltDnDiag",
  lightUpDiagonal: "ltUpDiag",
  darkDownDiagonal: "dkDnDiag",
  darkUpDiagonal: "dkUpDiag",
  wideDownDiagonal: "wdDnDiag",
  wideUpDiagonal: "wdUpDiag",
  dashedDownDiagonal: "dashDnDiag",
  dashedUpDiagonal: "dashUpDiag",
  diagonalCross: "diagCross",
  smallChecker: "smCheck",
  largeChecker: "lgCheck",
  smallGrid: "smGrid",
  largeGrid: "lgGrid",
  dotGrid: "dotGrid",
  smallConfetti: "smConfetti",
  largeConfetti: "lgConfetti",
  horizontalBrick: "horzBrick",
  diagonalBrick: "diagBrick",
  solidDiamond: "solidDmnd",
  openDiamond: "openDmnd",
  dottedDiamond: "dotDmnd",
  plaid: "plaid",
  sphere: "sphere",
  weave: "weave",
  divot: "divot",
  shingle: "shingle",
  wave: "wave",
  trellis: "trellis",
  zigZag: "zigZag"
});
var xsdVerticalMergeRev = bidi({
  continue: "cont",
  restart: "rest"
});
var xsdUnderlineStyle = bidi({
  single: "sng",
  double: "dbl",
  none: "none"
});
var xsdStrikeStyle = bidi({
  singleStrike: "sngStrike",
  doubleStrike: "dblStrike",
  noStrike: "noStrike"
});
var xsdTextCaps = bidi({
  none: "none",
  all: "all",
  small: "small"
});
var xsdAxisPosition = bidi({
  bottom: "b",
  left: "l",
  right: "r",
  top: "t"
});
var xsdLegendPosition = bidi({
  bottom: "b",
  topRight: "tr",
  left: "l",
  right: "r",
  top: "t"
});
var xsdDataLabelPosition = bidi({
  bottom: "b",
  center: "ctr",
  insideBase: "inBase",
  insideEnd: "inEnd",
  left: "l",
  outsideEnd: "outEnd",
  right: "r",
  top: "t"
});
var xsdAxisCrossBetween = bidi({ middleOfCategory: "midCat" });
var xsdAxisCrosses = bidi({ zero: "autoZero" });
var xsdComments = bidi({
  none: "commNone",
  indicator: "commIndicator",
  comment: "commIndAndComment"
});
var xsdErrorValueType = bidi({
  custom: "cust",
  fixedValue: "fixedVal",
  standardDeviation: "stdDev",
  standardError: "stdErr"
});
var xsdSizeRepresents = bidi({ width: "w" });
var xsdSplitType = bidi({
  custom: "cust",
  position: "pos",
  value: "val"
});
var xsdAxisLabelAlignment = bidi({
  center: "ctr",
  left: "l",
  right: "r"
});
var xsdAxisOrientation = bidi({
  ascending: "minMax",
  descending: "maxMin"
});
var xsdTrendlineType = bidi({
  exponential: "exp",
  logarithmic: "log",
  movingAverage: "movingAvg",
  polynomial: "poly"
});
var xsdTextTabAlignment = bidi({
  left: "l",
  center: "ctr",
  right: "r",
  decimal: "dec"
});
var xsdFontAlignment = bidi({
  top: "t",
  center: "ctr",
  bottom: "b"
});
var xsdAnimLevel = bidi({
  level: "lvl",
  center: "ctr"
});
var xsdHierBranch = bidi({
  left: "l",
  right: "r",
  hanging: "hang",
  standard: "std",
  initial: "init"
});
var xsdHueDirection = bidi({
  clockwise: "cw",
  counterClockwise: "ccw"
});
var xsdDiagramDirection = bidi({
  normal: "norm",
  reversed: "rev"
});
var xsdResizeHandles = bidi({
  exact: "exact",
  relative: "rel"
});
var xsdOnOffStyle = bidi({ default: "def" });
var xsdAnimClass = bidi({
  entrance: "entr",
  emphasis: "emph",
  mediaCall: "mediacall"
});
var xsdAnimCalcMode = bidi({
  linear: "lin",
  formula: "fmla"
});
var xsdAnimValueType = bidi({
  string: "str",
  number: "num",
  color: "clr"
});
var xsdTextBuild = bidi({
  paragraph: "p",
  custom: "cust"
});
var xsdDiagramBuild = bidi({
  clockwise: "cw",
  clockwiseIn: "cwIn",
  clockwiseOut: "cwOut",
  counterclockwise: "ccw",
  counterclockwiseIn: "ccwIn",
  counterclockwiseOut: "ccwOut",
  custom: "cust"
});
var xsdChartBuild = bidi({
  seriesElement: "seriesEl",
  categoryElement: "categoryEl"
});
var xsdAnimationDgmBuild = bidi({
  levelOne: "lvlOne",
  levelAtOnce: "lvlAtOnce"
});
var xsdIterateType = bidi({
  element: "el",
  word: "wd",
  letter: "lt"
});
var xsdSlideLayoutType = bidi({
  text: "tx",
  twoColumnText: "twoColTx",
  object: "obj",
  sectionHeader: "secHead",
  table: "tbl",
  clipArtAndText: "clipArtAndTx",
  pictureText: "picTx",
  twoObjects: "twoObj",
  twoTextAndTwoObjects: "twoTxTwoObj",
  objectAndText: "objTx",
  verticalText: "vertTx",
  verticalTitleAndText: "vertTitleAndTx"
});
var xsdTextVerticalType = bidi({
  horizontal: "horz",
  vertical: "vert",
  vertical270: "vert270",
  wordArtVertical: "wordArtVert",
  eastAsianVertical: "eaVert",
  mongolianVertical: "mongolianVert",
  wordArtVerticalRightToLeft: "wordArtVertRtl"
});
var xsdDashStyle = bidi({
  longDash: "lgDash",
  systemDot: "sysDot",
  systemDash: "sysDash"
});
var xsdOrient = bidi({
  horizontal: "horz",
  vertical: "vert"
});
var xsdPlaceholderType = bidi({
  centerTitle: "ctrTitle",
  date: "dt",
  slideNumber: "sldNum",
  footer: "ftr",
  header: "hdr",
  object: "obj",
  table: "tbl",
  diagram: "dgm",
  slideImage: "sldImg",
  picture: "pic"
});
var xsdMathStyle = bidi({
  plain: "p",
  bold: "b",
  italic: "i",
  boldItalic: "bi"
});
var xsdTableWidthType = bidi({
  twips: "dxa",
  percent: "pct"
});
var xsdJcAlignment = bidi({ numericTab: "numTab" });
var xsdConsolidateFunction = bidi({
  countNumbers: "countNums",
  standardDeviation: "stdDev",
  standardDeviationPopulation: "stdDevp",
  variance: "var",
  variancePopulation: "varp"
});
var xsdShadingPattern = bidi({
  horizontalStripe: "horzStripe",
  verticalStripe: "vertStripe",
  reverseDiagonalStripe: "reverseDiagStripe",
  diagonalStripe: "diagStripe",
  horizontalCross: "horzCross",
  diagonalCross: "diagCross",
  thinHorizontalStripe: "thinHorzStripe",
  thinVerticalStripe: "thinVertStripe",
  thinReverseDiagonalStripe: "thinReverseDiagStripe",
  thinDiagonalStripe: "thinDiagStripe",
  thinHorizontalCross: "thinHorzCross",
  thinDiagonalCross: "thinDiagCross",
  percent5: "pct5",
  percent10: "pct10",
  percent12: "pct12",
  percent15: "pct15",
  percent20: "pct20",
  percent25: "pct25",
  percent30: "pct30",
  percent35: "pct35",
  percent37: "pct37",
  percent40: "pct40",
  percent45: "pct45",
  percent50: "pct50",
  percent55: "pct55",
  percent60: "pct60",
  percent62: "pct62",
  percent65: "pct65",
  percent70: "pct70",
  percent75: "pct75",
  percent80: "pct80",
  percent85: "pct85",
  percent87: "pct87",
  percent90: "pct90",
  percent95: "pct95"
});
var xsdTotalsRowFunction = bidi({
  countNumbers: "countNums",
  standardDeviation: "stdDev",
  variance: "var"
});
var mapOptional = (value, fn) => value === void 0 ? void 0 : fn(value);
var emitPercent = (percent) => Math.round(percent * 1e3);
var parsePercent = (value) => value / 1e3;
var parsePercentAttr = (raw) => {
  if (raw === void 0) return void 0;
  const s = typeof raw === "number" ? String(raw) : raw;
  return s.endsWith("%") ? Number(s.slice(0, -1)) : parsePercent(Number(s));
};
var emitAngle = (degrees) => Math.round(degrees * 6e4);
var parseAngle = (value) => value / 6e4;
var convertPixelsToEmu = (pixels) => Math.round(pixels * 9525);
var convertInchesToEmu = (inches) => Math.round(inches * 914400);
var convertPointsToEmu = (points) => Math.round(points * 12700);
var parseUniversalMeasure = (measure) => {
  const match = measure.match(/^(-?[0-9]+(?:\.[0-9]+)?)(mm|cm|in|pt|pc|pi|px)$/);
  if (!match) throw new Error(`Invalid universal measure: '${measure}'`);
  const [, value, unit] = match;
  if (value === void 0 || unit === void 0) throw new Error(`Invalid universal measure: '${measure}'`);
  return {
    value: parseFloat(value),
    unit
  };
};
var convertUniversalMeasureToEmu = (measure) => {
  const { value, unit } = parseUniversalMeasure(measure);
  switch (unit) {
    case "mm":
      return Math.round(value * 36e3);
    case "cm":
      return Math.round(value * 36e4);
    case "in":
      return convertInchesToEmu(value);
    case "pt":
      return convertPointsToEmu(value);
    case "pc":
    case "pi":
      return convertPointsToEmu(value * 12);
    case "px":
      return convertPixelsToEmu(value);
  }
};
var convertToEmu = (val) => typeof val === "string" ? convertUniversalMeasureToEmu(val) : val;
var convertUniversalMeasureToPt = (measure) => {
  const { value, unit } = parseUniversalMeasure(measure);
  switch (unit) {
    case "mm":
      return value / 25.4 * 72;
    case "cm":
      return value * 10 / 25.4 * 72;
    case "in":
      return value * 72;
    case "pt":
      return value;
    case "pc":
    case "pi":
      return value * 12;
    case "px":
      return value / 96 * 72;
  }
};
var convertToPt = (val) => typeof val === "string" ? convertUniversalMeasureToPt(val) : val;
var convertUniversalMeasureToInch = (measure) => {
  const { value, unit } = parseUniversalMeasure(measure);
  switch (unit) {
    case "mm":
      return value / 25.4;
    case "cm":
      return value * 10 / 25.4;
    case "in":
      return value;
    case "pt":
      return value / 72;
    case "pc":
    case "pi":
      return value * 12 / 72;
    case "px":
      return value / 96;
  }
};
var convertToInch = (val) => typeof val === "string" ? convertUniversalMeasureToInch(val) : val;
var URL_ALPHABET = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var uniqueId = () => {
  const bytes = /* @__PURE__ */ new Uint8Array(21);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += URL_ALPHABET[byte & 63];
  return id.toLowerCase();
};
function imageTypeFromPath(path) {
  switch (path.split(".").pop()?.toLowerCase() ?? "") {
    case "jpg":
    case "jpeg":
      return "jpg";
    case "png":
      return "png";
    case "gif":
      return "gif";
    case "bmp":
      return "bmp";
    case "tif":
    case "tiff":
      return "tif";
    case "ico":
      return "ico";
    case "emf":
      return "emf";
    case "wmf":
      return "wmf";
    default:
      return "png";
  }
}
function extUriMatches(actual, expected) {
  if (actual === void 0) return false;
  const norm = (uri) => uri.replace(/^[{]+|[}]+$/g, "").toLowerCase();
  return norm(actual) === norm(expected);
}

// ../../../../../../Volumes/File/cortex/node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
var workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var wk = Worker ? function(c, _, msg, transfer, cb) {
  var done = false;
  var w = new Worker(c + workerAdd, { eval: true }).on("error", function(e) {
    return cb(e, null);
  }).on("message", function(m) {
    return cb(null, m);
  }).on("exit", function(c2) {
    if (c2 && !done)
      cb(new Error("exited with code " + c2), null);
  });
  if (isMarkedAsUntransferable)
    transfer = transfer.filter(function(t) {
      return !isMarkedAsUntransferable(t);
    });
  w.postMessage(msg, transfer);
  w.terminate = function() {
    done = true;
    return Worker.prototype.terminate.call(w);
  };
  return w;
} : function(_, __, ___, ____, cb) {
  setImmediate(function() {
    return cb(new Error("async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)"), null);
  });
  var NOP = function() {
  };
  return {
    terminate: NOP,
    postMessage: NOP
  };
};
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add2 = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add2 = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add2;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
}();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wcln = function(fn, fnStr, td2) {
  var dt = fn();
  var st = fn.toString();
  var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
  for (var i = 0; i < dt.length; ++i) {
    var v = dt[i], k = ks[i];
    if (typeof v == "function") {
      fnStr += ";" + k + "=";
      var st_1 = v.toString();
      if (v.prototype) {
        if (st_1.indexOf("[native code]") != -1) {
          var spInd = st_1.indexOf(" ", 8) + 1;
          fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
        } else {
          fnStr += st_1;
          for (var t in v.prototype)
            fnStr += ";" + k + ".prototype." + t + "=" + v.prototype[t].toString();
        }
      } else
        fnStr += st_1;
    } else
      td2[k] = v;
  }
  return fnStr;
};
var ch = [];
var cbfs = function(v) {
  var tl = [];
  for (var k in v) {
    if (v[k].buffer) {
      tl.push((v[k] = new v[k].constructor(v[k])).buffer);
    }
  }
  return tl;
};
var wrkr = function(fns, init2, id, cb) {
  if (!ch[id]) {
    var fnStr = "", td_1 = {}, m = fns.length - 1;
    for (var i = 0; i < m; ++i)
      fnStr = wcln(fns[i], fnStr, td_1);
    ch[id] = { c: wcln(fns[m], fnStr, td_1), e: td_1 };
  }
  var td2 = mrg({}, ch[id].e);
  return wk(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init2.toString() + "}", id, td2, cbfs(td2), cb);
};
var bDflt = function() {
  return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
};
var pbf = function(msg) {
  return postMessage(msg, [msg.buffer]);
};
var cbify = function(dat, opts, fns, init2, id, cb) {
  var w = wrkr(fns, init2, id, function(err2, dat2) {
    w.terminate();
    cb(err2, dat2);
  });
  w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
  return function() {
    w.terminate();
  };
};
var astrm = function(strm) {
  strm.ondata = function(dat, final) {
    return postMessage([dat, final], [dat.buffer]);
  };
  return function(ev) {
    if (ev.data[0]) {
      strm.push(ev.data[0], ev.data[1]);
      postMessage([ev.data[0].length]);
    } else
      strm.flush(ev.data[1]);
  };
};
var astrmify = function(fns, strm, opts, init2, id, flush, ext) {
  var t;
  var w = wrkr(fns, init2, id, function(err2, dat) {
    if (err2)
      w.terminate(), strm.ondata.call(strm, err2);
    else if (!Array.isArray(dat))
      ext(dat);
    else if (dat.length == 1) {
      strm.queuedSize -= dat[0];
      if (strm.ondrain)
        strm.ondrain(dat[0]);
    } else {
      if (dat[1])
        w.terminate();
      strm.ondata.call(strm, err2, dat[0], dat[1]);
    }
  });
  w.postMessage(opts);
  strm.queuedSize = 0;
  strm.push = function(d, f) {
    if (!strm.ondata)
      err(5);
    if (t)
      strm.ondata(err(4, 0, 1), null, !!f);
    strm.queuedSize += d.length;
    w.postMessage([d, t = f], d.buffer instanceof ArrayBuffer ? [d.buffer] : []);
  };
  strm.terminate = function() {
    w.terminate();
  };
  if (flush) {
    strm.flush = function(sync) {
      w.postMessage([0, sync]);
    };
  }
};
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function StrmOpt(opts, cb) {
  if (typeof opts == "function")
    cb = opts, opts = {};
  this.ondata = cb;
  return opts;
}
var Deflate = /* @__PURE__ */ function() {
  function Deflate2(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    this.o = opts || {};
    this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
    this.b = new u8(98304);
    if (this.o.dictionary) {
      var dict = this.o.dictionary.subarray(-32768);
      this.b.set(dict, 32768 - dict.length);
      this.s.i = 32768 - dict.length;
    }
  }
  Deflate2.prototype.p = function(c, f) {
    this.ondata(dopt(c, this.o, 0, 0, this.s), f);
  };
  Deflate2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    var endLen = chunk.length + this.s.z;
    if (endLen > this.b.length) {
      if (endLen > 2 * this.b.length - 32768) {
        var newBuf = new u8(endLen & -32768);
        newBuf.set(this.b.subarray(0, this.s.z));
        this.b = newBuf;
      }
      var split2 = this.b.length - this.s.z;
      this.b.set(chunk.subarray(0, split2), this.s.z);
      this.s.z = this.b.length;
      this.p(this.b, false);
      this.b.set(this.b.subarray(-32768));
      this.b.set(chunk.subarray(split2), 32768);
      this.s.z = chunk.length - split2 + 32768;
      this.s.i = 32766, this.s.w = 32768;
    } else {
      this.b.set(chunk, this.s.z);
      this.s.z += chunk.length;
    }
    this.s.l = final & 1;
    if (this.s.z > this.s.w + 8191 || final) {
      this.p(this.b, final || false);
      this.s.w = this.s.i, this.s.i -= 2;
    }
    if (final) {
      this.s = this.o = {};
      this.b = et;
    }
  };
  Deflate2.prototype.flush = function(sync) {
    if (!this.ondata)
      err(5);
    if (this.s.l)
      err(4);
    this.p(this.b, false);
    this.s.w = this.s.i, this.s.i -= 2;
    if (sync) {
      var c = new u8(6);
      c[0] = this.s.r >> 3;
      var ep = wfblk(c, this.s.r, et);
      this.s.r = 0;
      this.ondata(c.subarray(0, ep >> 3), false);
    }
  };
  return Deflate2;
}();
var AsyncDeflate = /* @__PURE__ */ function() {
  function AsyncDeflate2(opts, cb) {
    astrmify([
      bDflt,
      function() {
        return [astrm, Deflate];
      }
    ], this, StrmOpt.call(this, opts, cb), function(ev) {
      var strm = new Deflate(ev.data);
      onmessage = astrm(strm);
    }, 6, 1);
  }
  return AsyncDeflate2;
}();
function deflate(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  return cbify(data, opts, [
    bDflt
  ], function(ev) {
    return pbf(deflateSync(ev.data[0], ev.data[1]));
  }, 0, cb);
}
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var dbf = function(l) {
  return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
};
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
var ZipPassThrough = /* @__PURE__ */ function() {
  function ZipPassThrough2(filename) {
    this.filename = filename;
    this.c = crc();
    this.size = 0;
    this.compression = 0;
  }
  ZipPassThrough2.prototype.process = function(chunk, final) {
    this.ondata(null, chunk, final);
  };
  ZipPassThrough2.prototype.push = function(chunk, final) {
    if (!this.ondata)
      err(5);
    this.c.p(chunk);
    this.size += chunk.length;
    if (final)
      this.crc = this.c.d();
    this.process(chunk, final || false);
  };
  return ZipPassThrough2;
}();
var ZipDeflate = /* @__PURE__ */ function() {
  function ZipDeflate2(filename, opts) {
    var _this = this;
    if (!opts)
      opts = {};
    ZipPassThrough.call(this, filename);
    this.d = new Deflate(opts, function(dat, final) {
      _this.ondata(null, dat, final);
    });
    this.compression = 8;
    this.flag = dbf(opts.level);
  }
  ZipDeflate2.prototype.process = function(chunk, final) {
    try {
      this.d.push(chunk, final);
    } catch (e) {
      this.ondata(e, null, final);
    }
  };
  ZipDeflate2.prototype.push = function(chunk, final) {
    ZipPassThrough.prototype.push.call(this, chunk, final);
  };
  return ZipDeflate2;
}();
var AsyncZipDeflate = /* @__PURE__ */ function() {
  function AsyncZipDeflate2(filename, opts) {
    var _this = this;
    if (!opts)
      opts = {};
    ZipPassThrough.call(this, filename);
    this.d = new AsyncDeflate(opts, function(err2, dat, final) {
      _this.ondata(err2, dat, final);
    });
    this.compression = 8;
    this.flag = dbf(opts.level);
    this.terminate = this.d.terminate;
  }
  AsyncZipDeflate2.prototype.process = function(chunk, final) {
    this.d.push(chunk, final);
  };
  AsyncZipDeflate2.prototype.push = function(chunk, final) {
    ZipPassThrough.prototype.push.call(this, chunk, final);
  };
  return AsyncZipDeflate2;
}();
var Zip = /* @__PURE__ */ function() {
  function Zip2(cb) {
    this.ondata = cb;
    this.u = [];
    this.d = 1;
  }
  Zip2.prototype.add = function(file) {
    var _this = this;
    if (!this.ondata)
      err(5);
    if (this.d & 2)
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
    else {
      var f = strToU8(file.filename), fl_1 = f.length;
      var com = file.comment, o = com && strToU8(com);
      var u = fl_1 != file.filename.length || o && com.length != o.length;
      var hl_1 = fl_1 + exfl(file.extra) + 30;
      if (fl_1 > 65535)
        this.ondata(err(11, 0, 1), null, false);
      var header = new u8(hl_1);
      wzh(header, 0, file, f, u, -1);
      var chks_1 = [header];
      var pAll_1 = function() {
        for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
          var chk = chks_2[_i];
          _this.ondata(null, chk, false);
        }
        chks_1 = [];
      };
      var tr_1 = this.d;
      this.d = 0;
      var ind_1 = this.u.length;
      var uf_1 = mrg(file, {
        f,
        u,
        o,
        t: function() {
          if (file.terminate)
            file.terminate();
        },
        r: function() {
          pAll_1();
          if (tr_1) {
            var nxt = _this.u[ind_1 + 1];
            if (nxt)
              nxt.r();
            else
              _this.d = 1;
          }
          tr_1 = 1;
        }
      });
      var cl_1 = 0;
      file.ondata = function(err2, dat, final) {
        if (err2) {
          _this.ondata(err2, dat, final);
          _this.terminate();
        } else {
          cl_1 += dat.length;
          chks_1.push(dat);
          if (final) {
            var dd = new u8(16);
            wbytes(dd, 0, 134695760);
            wbytes(dd, 4, file.crc);
            wbytes(dd, 8, cl_1);
            wbytes(dd, 12, file.size);
            chks_1.push(dd);
            uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
            if (tr_1)
              uf_1.r();
            tr_1 = 1;
          } else if (tr_1)
            pAll_1();
        }
      };
      this.u.push(uf_1);
    }
  };
  Zip2.prototype.end = function() {
    var _this = this;
    if (this.d & 2) {
      this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
      return;
    }
    if (this.d)
      this.e();
    else
      this.u.push({
        r: function() {
          if (!(_this.d & 1))
            return;
          _this.u.splice(-1, 1);
          _this.e();
        },
        t: function() {
        }
      });
    this.d = 3;
  };
  Zip2.prototype.e = function() {
    var bt = 0, l = 0, tl = 0;
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
    }
    var out = new u8(tl + 22);
    for (var _b2 = 0, _c = this.u; _b2 < _c.length; _b2++) {
      var f = _c[_b2];
      wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
      bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
    }
    wzf(out, bt, this.u.length, tl, l);
    this.ondata(null, out, true);
    this.d = 2;
  };
  Zip2.prototype.terminate = function() {
    for (var _i = 0, _a2 = this.u; _i < _a2.length; _i++) {
      var f = _a2[_i];
      f.t();
    }
    this.d = 2;
  };
  return Zip2;
}();
function zip(data, opts, cb) {
  if (!cb)
    cb = opts, opts = {};
  if (typeof cb != "function")
    err(7);
  var r = {};
  fltn(data, "", r, opts);
  var k = Object.keys(r);
  var lft = k.length, o = 0, tot = 0;
  var slft = lft, files = new Array(lft);
  var term = [];
  var tAll = function() {
    for (var i2 = 0; i2 < term.length; ++i2)
      term[i2]();
  };
  var cbd = function(a, b) {
    mt(function() {
      cb(a, b);
    });
  };
  mt(function() {
    cbd = cb;
  });
  var cbf = function() {
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    tot = 0;
    for (var i2 = 0; i2 < slft; ++i2) {
      var f = files[i2];
      try {
        var l = f.c.length;
        wzh(out, tot, f, f.f, f.u, l);
        var badd = 30 + f.f.length + exfl(f.extra);
        var loc = tot + badd;
        out.set(f.c, loc);
        wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
      } catch (e) {
        return cbd(e, null);
      }
    }
    wzf(out, o, files.length, cdl, oe);
    cbd(null, out);
  };
  if (!lft)
    cbf();
  var _loop_1 = function(i2) {
    var fn = k[i2];
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var c = crc(), size = file.length;
    c.p(file);
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    var compression = p.level == 0 ? 0 : 8;
    var cbl = function(e, d) {
      if (e) {
        tAll();
        cbd(e, null);
      } else {
        var l = d.length;
        files[i2] = mrg(p, {
          size,
          crc: c.d(),
          c: d,
          f,
          m,
          u: s != fn.length || m && com.length != ms,
          compression
        });
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
        if (!--lft)
          cbf();
      }
    };
    if (s > 65535)
      cbl(err(11, 0, 1), null);
    if (!compression)
      cbl(null, file);
    else if (size < 16e4) {
      try {
        cbl(null, deflateSync(file, p));
      } catch (e) {
        cbl(e, null);
      }
    } else
      term.push(deflate(file, p, cbl));
  };
  for (var i = 0; i < slft; ++i) {
    _loop_1(i);
  }
  return tAll;
}
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
var mt = typeof queueMicrotask == "function" ? queueMicrotask : typeof setTimeout == "function" ? setTimeout : function(fn) {
  fn();
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// ../../../../../../Volumes/File/cortex/node_modules/@noble/hashes/sha2.js
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n) => BigInt(n))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA2_64B = class extends HashMD {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  // h -- high 32 bits, l -- low 32 bits
  // Numeric initializers matter: starting the fields as `undefined` changes
  // V8's field representation and slows hashing down (measured on sha256).
  Ah = 0;
  Al = 0;
  Bh = 0;
  Bl = 0;
  Ch = 0;
  Cl = 0;
  Dh = 0;
  Dl = 0;
  Eh = 0;
  El = 0;
  Fh = 0;
  Fl = 0;
  Gh = 0;
  Gl = 0;
  Hh = 0;
  Hl = 0;
  constructor(outputLen, IV) {
    super(128, outputLen, 16, false);
    this.Ah = IV[0] | 0;
    this.Al = IV[1] | 0;
    this.Bh = IV[2] | 0;
    this.Bl = IV[3] | 0;
    this.Ch = IV[4] | 0;
    this.Cl = IV[5] | 0;
    this.Dh = IV[6] | 0;
    this.Dl = IV[7] | 0;
    this.Eh = IV[8] | 0;
    this.El = IV[9] | 0;
    this.Fh = IV[10] | 0;
    this.Fl = IV[11] | 0;
    this.Gh = IV[12] | 0;
    this.Gl = IV[13] | 0;
    this.Hh = IV[14] | 0;
    this.Hl = IV[15] | 0;
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  _cloneInto(to) {
    (to ||= new this.constructor()).set(...this.get());
    return this._cloneIntoMeta(to);
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4) {
      SHA512_W_H[i] = view.getUint32(offset);
      SHA512_W_L[i] = view.getUint32(offset += 4);
    }
    for (let i = 16; i < 80; i++) {
      const W15h = SHA512_W_H[i - 15] | 0;
      const W15l = SHA512_W_L[i - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i - 2] | 0;
      const W2l = SHA512_W_L[i - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
      SHA512_W_H[i] = SUMh | 0;
      SHA512_W_L[i] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i = 0; i < 80; i++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var _SHA512 = class extends SHA2_64B {
  constructor() {
    super(64, SHA512_IV);
  }
};
var sha512 = /* @__PURE__ */ createHasher(
  () => new _SHA512(),
  /* @__PURE__ */ oidNist(3)
);

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/util-ptE16MEk.mjs
var CRC_TABLE = /* @__PURE__ */ new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? c >>> 1 ^ -306674912 : c >>> 1;
  CRC_TABLE[i] = c;
}
function computeCrc32(data) {
  let crc2 = -1;
  for (const byte of data) crc2 = CRC_TABLE[(crc2 ^ byte) & 255] ^ crc2 >>> 8;
  return ~crc2;
}
var _nativeDeflate;
var _nativeDeflateAsync;
var _nativeInflate;
var _nativeCrc32;
var bunApi = globalThis.Bun;
if (typeof bunApi?.deflateSync === "function") {
  _nativeDeflate = (data, level) => bunApi.deflateSync(data, { level });
  if (typeof bunApi.inflateSync === "function") _nativeInflate = (data) => bunApi.inflateSync(data);
}
try {
  const zlib = await import("node:zlib");
  if (typeof zlib.deflateRawSync !== "function") throw new Error("no native deflate");
  if (_nativeDeflate === void 0) _nativeDeflate = (data, level) => zlib.deflateRawSync(data, { level });
  _nativeDeflateAsync = (data, level) => new Promise((resolve, reject) => zlib.deflateRaw(data, { level }, (err2, result) => {
    if (err2) reject(err2);
    else resolve(result);
  }));
  _nativeCrc32 = typeof zlib.crc32 === "function" ? (data) => zlib.crc32(data) : computeCrc32;
  if (typeof zlib.inflateRawSync === "function" && _nativeInflate === void 0) _nativeInflate = (data) => zlib.inflateRawSync(data);
} catch {
}
var hasNativeDeflate = () => _nativeDeflate !== void 0;
var hasNativeInflate = () => _nativeInflate !== void 0;
var _prefersMainThreadDeflate = typeof bunApi?.deflateSync === "function";
var prefersMainThreadDeflate = () => _prefersMainThreadDeflate;
function nativeCrc32(data) {
  return _nativeCrc32?.(data);
}
function wU16(b, o, v) {
  b[o] = v & 255;
  b[o + 1] = v >> 8 & 255;
}
function wU32(b, o, v) {
  b[o] = v & 255;
  b[o + 1] = v >> 8 & 255;
  b[o + 2] = v >> 16 & 255;
  b[o + 3] = v >> 24 & 255;
}
function resolveEntryData(raw, defaultLevel) {
  if (Array.isArray(raw)) return {
    data: raw[0],
    level: raw[1].level ?? defaultLevel
  };
  return {
    data: raw,
    level: defaultLevel
  };
}
function compressOne(data, level, deflate2) {
  if (level === 0) return {
    compressed: data,
    method: 0
  };
  const compressed = deflate2(data, level);
  if (compressed.length >= data.length) return {
    compressed: data,
    method: 0
  };
  return {
    compressed,
    method: 8
  };
}
async function compressOneAsync(data, level, deflate2) {
  if (level === 0) return {
    compressed: data,
    method: 0
  };
  const compressed = await deflate2(data, level);
  if (compressed.length >= data.length) return {
    compressed: data,
    method: 0
  };
  return {
    compressed,
    method: 8
  };
}
function writeZipBuffer(entries) {
  let totalSize = 0;
  for (const e of entries) totalSize += 30 + e.filename.length + e.data.length;
  const cdOffset = totalSize;
  let cdSize = 0;
  for (const e of entries) cdSize += 46 + e.filename.length;
  totalSize += cdSize + 22;
  const buf = new Uint8Array(totalSize);
  let offset = 0;
  for (const e of entries) {
    e.localOffset = offset;
    wU32(buf, offset, 67324752);
    wU16(buf, offset + 4, 20);
    wU16(buf, offset + 6, 0);
    wU16(buf, offset + 8, e.method);
    wU16(buf, offset + 10, 0);
    wU16(buf, offset + 12, 0);
    wU32(buf, offset + 14, e.crc);
    wU32(buf, offset + 18, e.data.length);
    wU32(buf, offset + 22, e.uncompressedSize);
    wU16(buf, offset + 26, e.filename.length);
    wU16(buf, offset + 28, 0);
    offset += 30;
    buf.set(e.filename, offset);
    offset += e.filename.length;
    buf.set(e.data, offset);
    offset += e.data.length;
  }
  for (const e of entries) {
    wU32(buf, offset, 33639248);
    wU16(buf, offset + 4, 20);
    wU16(buf, offset + 6, 20);
    wU16(buf, offset + 8, 0);
    wU16(buf, offset + 10, e.method);
    wU16(buf, offset + 12, 0);
    wU16(buf, offset + 14, 0);
    wU32(buf, offset + 16, e.crc);
    wU32(buf, offset + 20, e.data.length);
    wU32(buf, offset + 24, e.uncompressedSize);
    wU16(buf, offset + 28, e.filename.length);
    wU16(buf, offset + 30, 0);
    wU16(buf, offset + 32, 0);
    wU16(buf, offset + 34, 0);
    wU16(buf, offset + 36, 0);
    wU32(buf, offset + 38, 0);
    wU32(buf, offset + 42, e.localOffset);
    offset += 46;
    buf.set(e.filename, offset);
    offset += e.filename.length;
  }
  wU32(buf, offset, 101010256);
  wU16(buf, offset + 4, 0);
  wU16(buf, offset + 6, 0);
  wU16(buf, offset + 8, entries.length);
  wU16(buf, offset + 10, entries.length);
  wU32(buf, offset + 12, cdSize);
  wU32(buf, offset + 16, cdOffset);
  wU16(buf, offset + 20, 0);
  return buf;
}
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();
function nativeZip(files, level = 6) {
  if (!_nativeDeflate) throw new Error("Native deflate not available");
  const crc2 = _nativeCrc32 ?? computeCrc32;
  const entries = [];
  for (const key of Object.keys(files)) {
    const raw = files[key];
    if (raw === void 0) continue;
    const { data, level: entryLevel } = resolveEntryData(raw, level);
    const c = crc2(data);
    const { compressed, method } = compressOne(data, entryLevel, _nativeDeflate);
    entries.push({
      filename: textEncoder.encode(key),
      data: compressed,
      uncompressedSize: data.length,
      crc: c,
      method,
      localOffset: 0
    });
  }
  return writeZipBuffer(entries);
}
async function nativeZipAsync(files, level = 6) {
  const deflateAsync = _nativeDeflateAsync;
  if (!deflateAsync) throw new Error("Native async deflate not available");
  const crc2 = _nativeCrc32 ?? computeCrc32;
  return writeZipBuffer((await Promise.all(Object.keys(files).map(async (key) => {
    const raw = files[key];
    if (raw === void 0) return null;
    const { data, level: entryLevel } = resolveEntryData(raw, level);
    const c = crc2(data);
    const { compressed, method } = await compressOneAsync(data, entryLevel, deflateAsync);
    return {
      filename: textEncoder.encode(key),
      data: compressed,
      uncompressedSize: data.length,
      crc: c,
      method,
      localOffset: 0
    };
  }))).filter((e) => e !== null));
}
function rU16(b, o) {
  return b[o] | b[o + 1] << 8;
}
function rU32(b, o) {
  return (b[o] | b[o + 1] << 8 | b[o + 2] << 16 | b[o + 3] << 24) >>> 0;
}
var EOCD_MAGIC = 101010256;
var CD_MAGIC = 33639248;
function findEocd(b) {
  const min = Math.max(0, b.length - 65557);
  for (let i = b.length - 22; i >= min; i--) if (rU32(b, i) === EOCD_MAGIC) return i;
  throw new Error("ZIP EOCD record not found");
}
function readCentralDirectory(buf) {
  const eocd = findEocd(buf);
  const count = rU16(buf, eocd + 10);
  const cdOffset = rU32(buf, eocd + 16);
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (rU32(buf, p) !== CD_MAGIC) throw new Error(`ZIP central directory corrupt at offset ${p}`);
    const method = rU16(buf, p + 10);
    const crc2 = rU32(buf, p + 16);
    const compSize = rU32(buf, p + 20);
    const nameLen = rU16(buf, p + 28);
    const extraLen = rU16(buf, p + 30);
    const cmtLen = rU16(buf, p + 32);
    const localOff = rU32(buf, p + 42);
    const name = textDecoder.decode(buf.subarray(p + 46, p + 46 + nameLen));
    const lNameLen = rU16(buf, localOff + 26);
    const lExtraLen = rU16(buf, localOff + 28);
    entries.push({
      name,
      method,
      compSize,
      crc: crc2,
      dataStart: localOff + 30 + lNameLen + lExtraLen
    });
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return entries;
}
function nativeUnzip(buf) {
  if (!_nativeInflate) throw new Error("Native inflate not available");
  const inflate = _nativeInflate;
  const crc2 = _nativeCrc32 ?? computeCrc32;
  const out = {};
  for (const e of readCentralDirectory(buf)) {
    const raw = buf.subarray(e.dataStart, e.dataStart + e.compSize);
    const dec = e.method === 0 ? raw.slice() : inflate(raw);
    if (crc2(dec) >>> 0 !== e.crc) throw new Error(`ZIP CRC-32 mismatch: ${e.name}`);
    out[e.name] = dec;
  }
  return out;
}
var OoxmlMimeType = {
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};
var convertOutput = (data, type, mimeType = OoxmlMimeType.DOCX) => {
  switch (type) {
    case "nodebuffer":
      return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    case "blob":
      return new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)], { type: mimeType });
    case "arraybuffer":
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    case "uint8array":
      return data;
    case "base64":
      return encodeBase64(data);
    case "string":
    case "text":
    case "binarystring":
      return strFromU8(data, true);
    case "array":
      return [...data];
    default:
      return data;
  }
};
var PRECOMPRESSED_MEDIA_EXT = /* @__PURE__ */ new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "mp4",
  "mov",
  "wmv",
  "mpg",
  "mpeg",
  "mp3",
  "wma",
  "aac"
]);
var levelForMediaName = (fileName, mediaLevel) => {
  const dot = fileName.lastIndexOf(".");
  const ext = dot < 0 ? "" : fileName.slice(dot + 1).toLowerCase();
  return PRECOMPRESSED_MEDIA_EXT.has(ext) ? 0 : mediaLevel;
};
var zipAndConvert = async (files, type, mimeType, level = 1) => {
  const zipped = hasNativeDeflate() ? await nativeZipAsync(files, level) : await new Promise((resolve, reject) => {
    zip(files, {
      level,
      consume: true
    }, (err2, data) => {
      if (err2) reject(err2);
      else resolve(data);
    });
  });
  return convertOutput(zipped, type, mimeType);
};
var zipSyncAndConvert = (files, type, mimeType, level = 1) => {
  const zipped = hasNativeDeflate() ? nativeZip(files, level) : zipSync(files, { level });
  return convertOutput(zipped, type, mimeType);
};
var createZipStream = (files, defaultLevel = 1) => {
  const mainThread = prefersMainThreadDeflate();
  return new ReadableStream({ start(controller) {
    try {
      const zip2 = new Zip((err2, chunk, _final) => {
        if (err2) {
          controller.error(err2);
          return;
        }
        controller.enqueue(chunk);
        if (_final) controller.close();
      });
      for (const [name, data] of Object.entries(files)) {
        const raw = Array.isArray(data) ? data[0] : data;
        const level = Array.isArray(data) ? data[1].level ?? defaultLevel : defaultLevel;
        const workerPath = level !== 0 && !mainThread;
        const entry = level === 0 ? new ZipPassThrough(name) : workerPath ? new AsyncZipDeflate(name, { level }) : new ZipDeflate(name, { level });
        zip2.add(entry);
        entry.push(workerPath ? raw.slice() : raw, true);
      }
      zip2.end();
    } catch (err2) {
      controller.error(err2 instanceof Error ? err2 : new Error(String(err2)));
    }
  } });
};
var createPacker = (options) => {
  const { compile, mimeType } = options;
  const pack = async (file, opts) => {
    const type = opts?.type ?? "nodebuffer";
    const files = compile(file, opts?.overrides ?? [], opts?.compression?.media ?? 6);
    return zipAndConvert(files, type, mimeType, opts?.compression?.xml ?? 1);
  };
  const toBytes = (file, opts) => pack(file, {
    ...opts,
    type: "uint8array"
  });
  const toString3 = (file, opts) => pack(file, {
    ...opts,
    type: "string"
  });
  const toBuffer = (file, opts) => pack(file, {
    ...opts,
    type: "nodebuffer"
  });
  const toBase64 = (file, opts) => pack(file, {
    ...opts,
    type: "base64"
  });
  const toBlob = (file, opts) => pack(file, {
    ...opts,
    type: "blob"
  });
  const toArrayBuffer = (file, opts) => pack(file, {
    ...opts,
    type: "arraybuffer"
  });
  const packSync = (file, opts) => {
    const type = opts?.type ?? "nodebuffer";
    const files = compile(file, opts?.overrides ?? [], opts?.compression?.media ?? 6);
    return zipSyncAndConvert(files, type, mimeType, opts?.compression?.xml ?? 1);
  };
  const toBytesSync = (file, opts) => packSync(file, {
    ...opts,
    type: "uint8array"
  });
  const toStringSync = (file, opts) => packSync(file, {
    ...opts,
    type: "string"
  });
  const toBufferSync = (file, opts) => packSync(file, {
    ...opts,
    type: "nodebuffer"
  });
  const toBase64Sync = (file, opts) => packSync(file, {
    ...opts,
    type: "base64"
  });
  const toBlobSync = (file, opts) => packSync(file, {
    ...opts,
    type: "blob"
  });
  const toArrayBufferSync = (file, opts) => packSync(file, {
    ...opts,
    type: "arraybuffer"
  });
  const toStream = (file, opts) => {
    const mediaLevel = opts?.compression?.media ?? 6;
    let files;
    try {
      files = compile(file, opts?.overrides ?? [], mediaLevel);
    } catch (err2) {
      return new ReadableStream({ start(controller) {
        controller.error(err2 instanceof Error ? err2 : new Error(String(err2)));
      } });
    }
    return createZipStream(files, opts?.compression?.xml ?? 1);
  };
  return {
    compile,
    pack,
    packSync,
    toBytes,
    toBytesSync,
    toString: toString3,
    toStringSync,
    toBuffer,
    toBufferSync,
    toBase64,
    toBase64Sync,
    toBlob,
    toBlobSync,
    toArrayBuffer,
    toArrayBufferSync,
    toStream
  };
};
var encoder = new TextEncoder();
function addBinaryFile(files, path, data, mediaLevel) {
  files[path] = [data, { level: levelForMediaName(path, mediaLevel) }];
}
function compileMapping(mapping, overrides, media, mediaLevel = 0) {
  const files = {};
  for (const entry of Object.values(mapping)) {
    if (entry === void 0) continue;
    const entries = Array.isArray(entry) ? entry : [entry];
    for (const file of entries) files[file.path] = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
  }
  for (const override of overrides ?? []) files[override.path] = typeof override.data === "string" ? encoder.encode(override.data) : override.data;
  for (const file of media ?? []) addBinaryFile(files, file.path, file.data, mediaLevel);
  return files;
}
function utf16leEncode(str) {
  const bytes = new Uint8Array(str.length * 2);
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes[i * 2] = code & 255;
    bytes[i * 2 + 1] = code >> 8 & 255;
  }
  return bytes;
}
function randomBytes(length) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}
function hashPasswordAgile(password, salt, spinCount) {
  const pwBytes = utf16leEncode(password);
  const initial = new Uint8Array(salt.length + pwBytes.length);
  initial.set(salt, 0);
  initial.set(pwBytes, salt.length);
  let h = sha512(initial);
  for (let i = 0; i < spinCount; i++) {
    const buf = new Uint8Array(h.length + 4);
    buf.set(h, 0);
    buf[h.length] = i & 255;
    buf[h.length + 1] = i >> 8 & 255;
    buf[h.length + 2] = i >> 16 & 255;
    buf[h.length + 3] = i >> 24 & 255;
    h = sha512(buf);
  }
  return encodeBase64(new Uint8Array(h));
}
function derivePasswordHash(password, spinCount = 1e5) {
  const salt = randomBytes(16);
  return {
    hashValue: hashPasswordAgile(password, salt, spinCount),
    saltValue: encodeBase64(salt),
    spinCount,
    algorithmName: "SHA-512"
  };
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/xml/dist/utils.mjs
var OOXML_XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function findChild(parent, name) {
  return parent?.elements?.find((e) => e.name === name);
}
function children(parent, name) {
  return parent?.elements?.filter((e) => e.name === name) ?? [];
}
function textOf(element2) {
  if (!element2) return "";
  if (element2.text !== void 0 && typeof element2.text === "string") return element2.text;
  if (element2.elements && element2.elements.length > 0) {
    let text = "";
    for (const e of element2.elements) if (typeof e.text === "string") text += e.text;
    return text;
  }
  return "";
}
function attr(element2, name) {
  const v = element2?.attributes?.[name];
  return v !== void 0 ? String(v) : void 0;
}
function attrNum(element2, name) {
  const v = element2?.attributes?.[name];
  if (v === void 0) return void 0;
  const n = Number(v);
  return isNaN(n) ? void 0 : n;
}
function attrMeasure(element2, name) {
  const v = element2?.attributes?.[name];
  if (v === void 0) return void 0;
  const raw = String(v);
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}
function attrBool(element2, name) {
  const v = element2?.attributes?.[name];
  if (v === void 0) return void 0;
  if (typeof v === "boolean") return v;
  const lower = String(v).toLowerCase();
  if (lower === "true" || lower === "1" || lower === "on" || lower === "t") return true;
  if (lower === "false" || lower === "0" || lower === "off" || lower === "f") return false;
}
function findFirst(parent, name) {
  if (!parent) return void 0;
  for (const child of parent.elements ?? []) {
    if (child.name === name) return child;
    const found = findFirst(child, name);
    if (found) return found;
  }
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/xml/dist/index.mjs
var ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'"
};
var ENTITY_PATTERN = /&(?:amp|lt|gt|quot|apos|#x[0-9a-fA-F]+|#[0-9]+);/g;
function unescapeXml(str) {
  if (str.indexOf("&") === -1) return str;
  return str.replace(ENTITY_PATTERN, (match) => {
    if (ENTITY_MAP[match] !== void 0) return ENTITY_MAP[match];
    const body = match.slice(2, -1);
    const code = body[0] === "x" || body[0] === "X" ? parseInt(body.slice(1), 16) : parseInt(body, 10);
    return Number.isFinite(code) && code >= 0 ? String.fromCodePoint(code) : match;
  });
}
function nativeTypeValue(value) {
  if (value === "") return value;
  const neg = value.charCodeAt(0) === 45;
  const start = neg ? 1 : 0;
  const digits = value.length - start;
  if (digits > 0 && digits <= 15) {
    if (value.charCodeAt(start) !== 48 || !neg && digits === 1) {
      let n2 = 0;
      let allDigits = true;
      for (let i = start; i < value.length; i++) {
        const c = value.charCodeAt(i);
        if (c < 48 || c > 57) {
          allDigits = false;
          break;
        }
        n2 = n2 * 10 + (c - 48);
      }
      if (allDigits) return neg ? -n2 : n2;
    }
  }
  const n = Number(value);
  if (!isNaN(n) && String(n) === value) return n;
  if (value.length === 4 || value.length === 5) {
    const lower = value.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return value;
}
function parse(xmlString, options) {
  const captureSpaces = options?.captureSpacesBetweenElements ?? false;
  const trim = options?.trim ?? false;
  const ignoreDeclaration = options?.ignoreDeclaration ?? false;
  const ignoreText = options?.ignoreText ?? false;
  const ignoreComment = options?.ignoreComment ?? false;
  const ignoreCdata = options?.ignoreCdata ?? false;
  const ignoreDoctype = options?.ignoreDoctype ?? false;
  const nativeTypeAttributes = options?.nativeTypeAttributes ?? false;
  const deferSet = options?.deferElements !== void 0 && options.deferElements.length > 0 ? new Set(options.deferElements) : void 0;
  const nsTable = options?.normalizeNamespaces !== void 0 ? new Map(Object.entries(options.normalizeNamespaces)) : void 0;
  const nsStack = [{
    prefixes: void 0,
    defaultCanonical: void 0
  }];
  const result = {};
  const stack = [result];
  let i = 0;
  const len = xmlString.length;
  while (i < len) {
    if (xmlString.charCodeAt(i) !== 60) {
      const start = i;
      const lt = xmlString.indexOf("<", i);
      i = lt === -1 ? len : lt;
      let text = unescapeXml(xmlString.slice(start, i));
      if (trim) text = text.trim();
      if (ignoreText) continue;
      if (text.length > 0) {
        if (captureSpaces || text.trim().length > 0 || isPreserveContext(stack)) {
          const parent2 = stack[stack.length - 1];
          const elements = parent2.elements;
          const last = elements === void 0 ? void 0 : elements[elements.length - 1];
          if (last !== void 0 && last.type === "text") last.text = last.text + text;
          else {
            const node = {
              type: "text",
              text
            };
            if (elements === void 0) parent2.elements = [node];
            else elements.push(node);
          }
        }
      }
      continue;
    }
    i++;
    if (xmlString.charCodeAt(i) === 63) {
      const end = xmlString.indexOf("?>", i + 1);
      if (end === -1) break;
      const body = xmlString.slice(i + 1, end);
      i = end + 2;
      const xmlMatch = body.match(/^xml\s+(.*)$/s);
      if (xmlMatch) {
        if (!ignoreDeclaration) {
          if (!result.declaration) result.declaration = {};
          const attrs3 = parseAttributes(xmlMatch[1] ?? "");
          if (nativeTypeAttributes) for (const key in attrs3) attrs3[key] = nativeTypeValue(attrs3[key]);
          result.declaration.attributes = attrs3;
        }
      }
      continue;
    }
    if (xmlString.charCodeAt(i) === 33 && xmlString.slice(i, i + 3) === "!--") {
      const end = xmlString.indexOf("-->", i + 3);
      if (end === -1) break;
      const comment = xmlString.slice(i + 3, end);
      i = end + 3;
      if (!ignoreComment) {
        if (trim) addField(peek(stack), "comment", comment.trim());
        else addField(peek(stack), "comment", comment);
      }
      continue;
    }
    if (xmlString.charCodeAt(i) === 33 && xmlString.slice(i, i + 8) === "![CDATA[") {
      const end = xmlString.indexOf("]]>", i + 8);
      if (end === -1) break;
      const cdata = xmlString.slice(i + 8, end);
      i = end + 3;
      if (!ignoreCdata) {
        if (trim) addField(peek(stack), "cdata", cdata.trim());
        else addField(peek(stack), "cdata", cdata);
      }
      continue;
    }
    if (xmlString.charCodeAt(i) === 33 && xmlString.slice(i, i + 9) === "!DOCTYPE") {
      const end = xmlString.indexOf(">", i + 9);
      if (end === -1) break;
      const doctype = xmlString.slice(i + 9, end).trim();
      i = end + 1;
      if (!ignoreDoctype) addField(peek(stack), "doctype", doctype);
      continue;
    }
    if (xmlString.charCodeAt(i) === 47) {
      const end = xmlString.indexOf(">", i + 1);
      if (end === -1) break;
      i = end + 1;
      stack.pop();
      if (nsTable !== void 0) nsStack.pop();
      continue;
    }
    const tagNameEnd = findTagNameEnd(xmlString, i);
    const tagName = xmlString.slice(i, tagNameEnd);
    let pos = tagNameEnd;
    const nsParent = nsTable !== void 0 ? nsStack[nsStack.length - 1] : void 0;
    let nsPrefixes = nsParent?.prefixes;
    let nsDefault = nsParent?.defaultCanonical;
    let nsDeclared = false;
    let attrs2;
    while (pos < len) {
      while (pos < len && isWhitespace(xmlString.charCodeAt(pos))) pos++;
      if (pos >= len || xmlString.charCodeAt(pos) === 62 || xmlString.charCodeAt(pos) === 47) break;
      const nameStart = pos;
      while (pos < len && xmlString.charCodeAt(pos) !== 61) {
        if (xmlString.charCodeAt(pos) === 62 || xmlString.charCodeAt(pos) === 47) break;
        pos++;
      }
      const name = xmlString.slice(nameStart, pos).trim();
      if (xmlString.charCodeAt(pos) !== 61) break;
      pos++;
      while (pos < len && isWhitespace(xmlString.charCodeAt(pos))) pos++;
      const quote = xmlString.charCodeAt(pos);
      if (quote !== 34 && quote !== 39) break;
      pos++;
      const valueStart = pos;
      while (pos < len && xmlString.charCodeAt(pos) !== quote) pos++;
      const value = unescapeXml(xmlString.slice(valueStart, pos));
      pos++;
      if (nsTable !== void 0 && (name === "xmlns" || name.startsWith("xmlns:"))) {
        if (attrs2 === void 0) attrs2 = {};
        const canonical = nsTable.get(value);
        if (name === "xmlns") {
          nsDefault = canonical;
          if (canonical !== void 0 && canonical !== "") attrs2[`xmlns:${canonical}`] = value;
          else attrs2[name] = value;
        } else {
          const prefix = name.slice(6);
          if (canonical !== void 0 && canonical !== "") attrs2[`xmlns:${canonical}`] = value;
          else if (canonical === "" && !("xmlns" in attrs2)) attrs2.xmlns = value;
          else attrs2[name] = value;
          if (!nsDeclared) {
            nsPrefixes = new Map(nsPrefixes ?? []);
            nsDeclared = true;
          }
          nsPrefixes.set(prefix, canonical ?? prefix);
        }
        continue;
      }
      if (attrs2 === void 0) attrs2 = {};
      attrs2[name] = value;
    }
    if (attrs2 && nativeTypeAttributes) for (const key in attrs2) attrs2[key] = nativeTypeValue(attrs2[key]);
    let finalName = tagName;
    if (nsTable !== void 0) {
      const colon = tagName.indexOf(":");
      if (colon > 0) {
        const p = tagName.slice(0, colon);
        if (p !== "xml") {
          const c = nsPrefixes?.get(p);
          if (c !== void 0 && c !== p) finalName = c === "" ? tagName.slice(colon + 1) : c + tagName.slice(colon);
        }
      } else if (colon < 0 && nsDefault !== void 0 && nsDefault !== "") finalName = nsDefault + ":" + tagName;
      if (attrs2 !== void 0 && nsPrefixes !== void 0) for (const key of Object.keys(attrs2)) {
        if (key === "xmlns" || key.startsWith("xmlns:")) continue;
        const kcolon = key.indexOf(":");
        if (kcolon <= 0) continue;
        const p = key.slice(0, kcolon);
        if (p === "xml") continue;
        const c = nsPrefixes.get(p);
        if (c !== void 0 && c !== p) {
          const renamed = c === "" ? key.slice(kcolon + 1) : c + key.slice(kcolon);
          const attrValue = attrs2[key];
          if (attrValue !== void 0) attrs2[renamed] = attrValue;
          delete attrs2[key];
        }
      }
    }
    const isSelfClosing = xmlString.charCodeAt(pos) === 47;
    if (isSelfClosing) pos += 2;
    else pos++;
    const element2 = {
      type: "element",
      name: finalName,
      attributes: attrs2,
      elements: void 0
    };
    const parent = peek(stack);
    if (!parent.elements) parent.elements = [];
    parent.elements.push(element2);
    if (!isSelfClosing) {
      if (deferSet !== void 0 && deferSet.has(tagName)) {
        const closeTag = `</${tagName}>`;
        let depth = 1;
        let scan = pos;
        let closeIdx = -1;
        for (; ; ) {
          closeIdx = xmlString.indexOf(closeTag, scan);
          if (closeIdx === -1) break;
          let p = scan;
          for (; ; ) {
            const openIdx = xmlString.indexOf(`<${tagName}`, p);
            if (openIdx === -1 || openIdx >= closeIdx) break;
            const after = xmlString.charCodeAt(openIdx + tagName.length + 1);
            if (after === 32 || after === 9 || after === 10 || after === 13 || after === 47 || after === 62) depth++;
            p = openIdx + tagName.length + 1;
          }
          scan = closeIdx + closeTag.length;
          depth--;
          if (depth === 0) break;
        }
        if (closeIdx === -1) {
          element2.raw = xmlString.slice(pos);
          i = len;
        } else {
          element2.raw = xmlString.slice(pos, closeIdx);
          i = scan;
        }
        continue;
      }
      stack.push(element2);
      if (nsTable !== void 0) {
        const layerChanged = nsDeclared || nsDefault !== nsParent.defaultCanonical;
        nsStack.push(layerChanged ? {
          prefixes: nsPrefixes,
          defaultCanonical: nsDefault
        } : nsParent);
      }
    }
    i = pos;
  }
  if (result.elements) {
    const temp = result.elements;
    delete result.elements;
    result.elements = temp;
    delete result.text;
  }
  return result;
}
function findTagNameEnd(str, start) {
  let i = start;
  const len = str.length;
  while (i < len) {
    const ch2 = str.charCodeAt(i);
    if (ch2 === 32 || ch2 === 9 || ch2 === 10 || ch2 === 13 || ch2 === 47 || ch2 === 62) return i;
    i++;
  }
  return i;
}
function parseAttributes(str) {
  const result = {};
  let i = 0;
  const len = str.length;
  while (i < len) {
    while (i < len && isWhitespace(str.charCodeAt(i))) i++;
    if (i >= len) break;
    const nameStart = i;
    while (i < len && str.charCodeAt(i) !== 61) {
      if (isWhitespace(str.charCodeAt(i))) break;
      i++;
    }
    const name = str.slice(nameStart, i);
    while (i < len && isWhitespace(str.charCodeAt(i))) i++;
    if (i >= len || str.charCodeAt(i) !== 61) break;
    i++;
    while (i < len && isWhitespace(str.charCodeAt(i))) i++;
    const quote = str.charCodeAt(i);
    if (quote !== 34 && quote !== 39) break;
    i++;
    const valueStart = i;
    while (i < len && str.charCodeAt(i) !== quote) i++;
    result[name] = unescapeXml(str.slice(valueStart, i));
    i++;
  }
  return result;
}
function peek(stack) {
  return stack[stack.length - 1];
}
function addField(parent, type, value) {
  if (!parent.elements) parent.elements = [];
  if (type === "text" || type === "cdata") {
    const last = parent.elements[parent.elements.length - 1];
    if (last && last.type === type) {
      const key = type;
      last[key] = last[key] + value;
      return;
    }
  }
  const element2 = { type };
  element2[type] = value;
  parent.elements.push(element2);
}
function isPreserveContext(stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const node = stack[i];
    if (!node) continue;
    const space = node.attributes?.["xml:space"];
    if (space !== void 0) return space === "preserve";
  }
  return false;
}
function isWhitespace(ch2) {
  return ch2 === 32 || ch2 === 9 || ch2 === 10 || ch2 === 13;
}
var XML_SPECIALS = /[&"'<>]/;
function escapeXml(str) {
  if (!XML_SPECIALS.test(str)) return str;
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function attrs(record) {
  const parts = [];
  for (const [key, v] of Object.entries(record)) if (v !== void 0) {
    const value = typeof v === "string" ? escapeXml(v) : typeof v === "boolean" ? v ? 1 : 0 : v;
    parts.push(` ${key}="${value}"`);
  }
  return parts.join("");
}
function selfCloseElement(tag, attrStr) {
  return attrStr ? `<${tag}${attrStr}/>` : `<${tag}/>`;
}
function element(name, attrRecord, children2) {
  const attrStr = attrRecord ? attrs(attrRecord) : void 0;
  if (!children2 || children2.length === 0) return selfCloseElement(name, attrStr);
  const body = children2.join("");
  return body.length === 0 ? selfCloseElement(name, attrStr) : `<${name}${attrStr ?? ""}>${body}</${name}>`;
}
var TEXT_SPECIALS = /[&<>]/;
function stringify(js, options) {
  const opts = normalizeOptions(options);
  const parts = [];
  if (js.declaration && !opts.ignoreDeclaration) parts.push(writeDeclaration(js.declaration));
  if (js.elements?.length) parts.push(writeElements(js.elements, opts, 0, !parts.length));
  return parts.join("");
}
var DEFAULT_OPTIONS = {
  spaces: "",
  ignoreDeclaration: false,
  ignoreText: false,
  ignoreComment: false,
  ignoreCdata: false,
  ignoreDoctype: false,
  fullTagEmptyElement: false,
  indentText: false,
  indentCdata: false
};
function normalizeOptions(options) {
  if (!options) return DEFAULT_OPTIONS;
  let spaces = "";
  if (options.spaces != null) spaces = typeof options.spaces === "number" ? " ".repeat(options.spaces) : options.spaces;
  return {
    spaces,
    ignoreDeclaration: options.ignoreDeclaration ?? false,
    ignoreText: options.ignoreText ?? false,
    ignoreComment: options.ignoreComment ?? false,
    ignoreCdata: options.ignoreCdata ?? false,
    ignoreDoctype: options.ignoreDoctype ?? false,
    fullTagEmptyElement: options.fullTagEmptyElement ?? false,
    indentText: options.indentText ?? false,
    indentCdata: options.indentCdata ?? false,
    attributeValueFn: options.attributeValueFn
  };
}
function writeIndentation(spaces, depth, firstLine) {
  if (!spaces) return "";
  return (!firstLine ? "\n" : "") + spaces.repeat(depth);
}
function writeDeclaration(declaration) {
  const attrs2 = declaration.attributes;
  if (!attrs2) return '<?xml version="1.0"?>';
  const parts = [`<?xml version="1.0"`];
  if (attrs2.encoding) parts.push(` encoding="${attrs2.encoding}"`);
  if (attrs2.standalone) parts.push(` standalone="${attrs2.standalone}"`);
  return parts.join("") + "?>";
}
function writeAttributes(attributes, elementName, element2, attributeValueFn) {
  let s = "";
  for (const key in attributes) {
    const value = attributes[key];
    if (value === null || value === void 0) continue;
    const raw = String(value);
    const attr2 = attributeValueFn ? attributeValueFn(raw, key, elementName, element2) : escapeXml(raw);
    s += ` ${key}="${attr2}"`;
  }
  return s;
}
function writeElements(elements, opts, depth, firstLine) {
  let s = "";
  for (let i = 0; i < elements.length; i++) {
    const element2 = elements[i];
    if (!element2) continue;
    const isFirst = firstLine && i === 0;
    const type = element2.type;
    if (type === "element") {
      const name = element2.name;
      if (!name) continue;
      if (opts.spaces) s += writeIndentation(opts.spaces, depth, isFirst);
      const attributes = element2.attributes;
      const attrStr = attributes ? writeAttributes(attributes, name, element2, opts.attributeValueFn) : "";
      if (element2.raw !== void 0) {
        s += `<${name}${attrStr}>${element2.raw}</${name}>`;
        continue;
      }
      const children2 = element2.elements;
      if (!(children2 !== void 0 && children2.length > 0 || opts.fullTagEmptyElement || attributes?.["xml:space"] === "preserve")) {
        s += `<${name}${attrStr}/>`;
        continue;
      }
      const open = `<${name}${attrStr}>`;
      if (children2 !== void 0 && children2.length > 0) {
        const inner = writeElements(children2, opts, depth + 1, false);
        if (opts.spaces && children2.some((e) => e.type === "element")) s += open + inner + "\n" + opts.spaces.repeat(depth) + `</${name}>`;
        else s += open + inner + `</${name}>`;
      } else s += open + `</${name}>`;
    } else if (type === "text") {
      if (opts.ignoreText) continue;
      if (opts.indentText && opts.spaces) s += writeIndentation(opts.spaces, depth, isFirst);
      const text = element2.text;
      if (text == null) continue;
      const str = String(text);
      s += TEXT_SPECIALS.test(str) ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : str;
    } else if (type === "cdata") {
      if (opts.ignoreCdata) continue;
      if (opts.indentCdata && opts.spaces) s += writeIndentation(opts.spaces, depth, isFirst);
      s += writeCdata(element2.cdata);
    } else if (type === "comment") {
      if (opts.ignoreComment) continue;
      if (opts.spaces) s += writeIndentation(opts.spaces, depth, isFirst);
      s += writeComment(element2.comment);
    } else if (type === "doctype") {
      if (opts.ignoreDoctype) continue;
      if (opts.spaces) s += writeIndentation(opts.spaces, depth, isFirst);
      s += writeDoctype(element2.doctype);
    }
  }
  return s;
}
function writeCdata(cdata) {
  if (cdata == null) return "";
  return `<![CDATA[${cdata.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}
function writeComment(comment) {
  if (comment == null) return "";
  return `<!--${comment}-->`;
}
function writeDoctype(doctype) {
  if (doctype == null) return "";
  return `<!DOCTYPE ${doctype}>`;
}
function stringifyElement(el) {
  if (!el.name) return "";
  let attrStr = "";
  if (el.attributes) for (const key of Object.keys(el.attributes)) {
    const v = el.attributes[key];
    if (v === null || v === void 0) continue;
    attrStr += ` ${key}="${escapeXml(String(v))}"`;
  }
  if (!((el.elements?.length ?? 0) > 0 || el.attributes?.["xml:space"] === "preserve")) return `<${el.name}${attrStr}/>`;
  return `<${el.name}${attrStr}>${stringify(el)}</${el.name}>`;
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/patch-AkQY17CD.mjs
var FIELD_MAP = [
  {
    name: "dc:title",
    key: "title"
  },
  {
    name: "dc:subject",
    key: "subject"
  },
  {
    name: "dc:creator",
    key: "creator"
  },
  {
    name: "dc:description",
    key: "description"
  },
  {
    name: "cp:keywords",
    key: "keywords"
  },
  {
    name: "cp:lastModifiedBy",
    key: "lastModifiedBy"
  },
  {
    name: "cp:lastPrinted",
    key: "lastPrinted"
  },
  {
    name: "dcterms:created",
    key: "created"
  },
  {
    name: "dcterms:modified",
    key: "modified"
  },
  {
    name: "cp:category",
    key: "category"
  },
  {
    name: "cp:contentStatus",
    key: "contentStatus"
  },
  {
    name: "cp:contentType",
    key: "contentType"
  },
  {
    name: "dc:identifier",
    key: "identifier"
  },
  {
    name: "dc:language",
    key: "language"
  },
  {
    name: "cp:version",
    key: "version"
  }
];
function parseCorePropsElement(el) {
  if (!el) return {};
  const props = {};
  if (el.name === "coreProperties") props.defaultNamespace = true;
  for (const field of FIELD_MAP) {
    const localName = field.name.slice(field.name.indexOf(":") + 1);
    const child = el.elements?.find((e) => e.type === "element" && (e.name === field.name || e.name === localName));
    if (child) props[field.key] = textOf(child);
  }
  const revEl = el.elements?.find((e) => e.name === "cp:revision" || e.name === "revision");
  if (revEl) {
    const rev2 = textOf(revEl);
    if (rev2) {
      const n = Number(rev2);
      if (!Number.isNaN(n)) props.revision = n;
    }
  }
  if (props.created === void 0) props.created = null;
  if (props.modified === void 0) props.modified = null;
  return props;
}
function buildCorePropertiesXmlString(opts) {
  const cp = (name) => opts.defaultNamespace ? name : `cp:${name}`;
  const p = opts.defaultNamespace ? ['<coreProperties xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcmitype="http://purl.org/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">'] : ['<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcmitype="http://purl.org/dcmitype/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'];
  if (opts.title !== void 0) p.push(`<dc:title>${escapeXml(opts.title)}</dc:title>`);
  if (opts.subject !== void 0) p.push(`<dc:subject>${escapeXml(opts.subject)}</dc:subject>`);
  if (opts.creator !== void 0) p.push(`<dc:creator>${escapeXml(opts.creator)}</dc:creator>`);
  if (opts.keywords !== void 0) p.push(`<${cp("keywords")}>${escapeXml(opts.keywords)}</${cp("keywords")}>`);
  if (opts.description !== void 0) p.push(`<dc:description>${escapeXml(opts.description)}</dc:description>`);
  if (opts.lastPrinted !== void 0) p.push(`<${cp("lastPrinted")}>${escapeXml(opts.lastPrinted)}</${cp("lastPrinted")}>`);
  if (opts.lastModifiedBy !== void 0) p.push(`<${cp("lastModifiedBy")}>${escapeXml(opts.lastModifiedBy)}</${cp("lastModifiedBy")}>`);
  if (opts.revision !== void 0) p.push(`<${cp("revision")}>${opts.revision}</${cp("revision")}>`);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (opts.created !== null) p.push(`<dcterms:created xsi:type="dcterms:W3CDTF">${opts.created ?? now}</dcterms:created>`);
  if (opts.modified !== null) p.push(`<dcterms:modified xsi:type="dcterms:W3CDTF">${opts.modified ?? now}</dcterms:modified>`);
  if (opts.category !== void 0) p.push(`<${cp("category")}>${escapeXml(opts.category)}</${cp("category")}>`);
  if (opts.contentStatus !== void 0) p.push(`<${cp("contentStatus")}>${escapeXml(opts.contentStatus)}</${cp("contentStatus")}>`);
  if (opts.contentType !== void 0) p.push(`<${cp("contentType")}>${escapeXml(opts.contentType)}</${cp("contentType")}>`);
  if (opts.identifier !== void 0) p.push(`<dc:identifier>${escapeXml(opts.identifier)}</dc:identifier>`);
  if (opts.language !== void 0) p.push(`<dc:language>${escapeXml(opts.language)}</dc:language>`);
  if (opts.version !== void 0) p.push(`<${cp("version")}>${escapeXml(opts.version)}</${cp("version")}>`);
  p.push(`</${cp("coreProperties")}>`);
  return p.join("");
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/descriptor-BqaNZrrZ.mjs
function stringify$1(desc, value, ctx) {
  return desc.stringify(value, ctx);
}
function parse$1(desc, el, ctx) {
  return desc.parse(el, ctx);
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/drawing-BCAyrCCw.mjs
var PERCENT_TRANSFORMS = /* @__PURE__ */ new Set([
  "tint",
  "shade",
  "alpha",
  "alphaOff",
  "alphaMod",
  "hueMod",
  "sat",
  "satOff",
  "satMod",
  "lum",
  "lumOff",
  "lumMod",
  "red",
  "redOff",
  "redMod",
  "green",
  "greenOff",
  "greenMod",
  "blue",
  "blueOff",
  "blueMod"
]);
var ANGLE_TRANSFORMS = /* @__PURE__ */ new Set(["hue", "hueOff"]);
var BOOLEAN_TRANSFORMS = /* @__PURE__ */ new Set([
  "comp",
  "inv",
  "gray",
  "gamma",
  "invGamma"
]);
function emitTransformValue(key, value) {
  if (PERCENT_TRANSFORMS.has(key)) return emitPercent(value);
  if (ANGLE_TRANSFORMS.has(key)) return emitAngle(value);
  return value;
}
var createColorTransforms = (options) => {
  const t = [];
  for (const [name, value] of Object.entries(options)) {
    const key = name;
    if (value === void 0 || value === false) continue;
    if (value === true) {
      t.push(`<a:${key}/>`);
      continue;
    }
    t.push(`<a:${key} val="${emitTransformValue(key, value)}"/>`);
  }
  return t;
};
var PresetColor = {
  ALICE_BLUE: "aliceBlue",
  ANTIQUE_WHITE: "antiqueWhite",
  AQUA: "aqua",
  AQUAMARINE: "aquamarine",
  AZURE: "azure",
  BEIGE: "beige",
  BISQUE: "bisque",
  BLACK: "black",
  BLANCHED_ALMOND: "blanchedAlmond",
  BLUE: "blue",
  BLUE_VIOLET: "blueViolet",
  BROWN: "brown",
  BURLY_WOOD: "burlyWood",
  CADET_BLUE: "cadetBlue",
  CHARTREUSE: "chartreuse",
  CHOCOLATE: "chocolate",
  CORAL: "coral",
  CORNFLOWER_BLUE: "cornflowerBlue",
  CORNSILK: "cornsilk",
  CRIMSON: "crimson",
  CYAN: "cyan",
  DARK_BLUE: "darkBlue",
  DARK_CYAN: "darkCyan",
  DARK_GOLDENROD: "darkGoldenrod",
  DARK_GRAY: "darkGray",
  DARK_GREY: "darkGrey",
  DARK_GREEN: "darkGreen",
  DARK_KHAKI: "darkKhaki",
  DARK_MAGENTA: "darkMagenta",
  DARK_OLIVE_GREEN: "darkOliveGreen",
  DARK_ORANGE: "darkOrange",
  DARK_ORCHID: "darkOrchid",
  DARK_RED: "darkRed",
  DARK_SALMON: "darkSalmon",
  DARK_SEA_GREEN: "darkSeaGreen",
  DARK_SLATE_BLUE: "darkSlateBlue",
  DARK_SLATE_GRAY: "darkSlateGray",
  DARK_SLATE_GREY: "darkSlateGrey",
  DARK_TURQUOISE: "darkTurquoise",
  DARK_VIOLET: "darkViolet",
  DEEP_PINK: "deepPink",
  DEEP_SKY_BLUE: "deepSkyBlue",
  DIM_GRAY: "dimGray",
  DIM_GREY: "dimGrey",
  DODGER_BLUE: "dodgerBlue",
  FIREBRICK: "firebrick",
  FLORAL_WHITE: "floralWhite",
  FOREST_GREEN: "forestGreen",
  FUCHSIA: "fuchsia",
  GAINSBORO: "gainsboro",
  GHOST_WHITE: "ghostWhite",
  GOLD: "gold",
  GOLDENROD: "goldenrod",
  GRAY: "gray",
  GREY: "grey",
  GREEN: "green",
  GREEN_YELLOW: "greenYellow",
  HONEYDEW: "honeydew",
  HOT_PINK: "hotPink",
  INDIAN_RED: "indianRed",
  INDIGO: "indigo",
  IVORY: "ivory",
  KHAKI: "khaki",
  LAVENDER: "lavender",
  LAVENDER_BLUSH: "lavenderBlush",
  LAWN_GREEN: "lawnGreen",
  LEMON_CHIFFON: "lemonChiffon",
  LIGHT_BLUE: "lightBlue",
  LIGHT_CORAL: "lightCoral",
  LIGHT_CYAN: "lightCyan",
  LIGHT_GOLDENROD_YELLOW: "lightGoldenrodYellow",
  LIGHT_GRAY: "lightGray",
  LIGHT_GREY: "lightGrey",
  LIGHT_GREEN: "lightGreen",
  LIGHT_PINK: "lightPink",
  LIGHT_SALMON: "lightSalmon",
  LIGHT_SEA_GREEN: "lightSeaGreen",
  LIGHT_SKY_BLUE: "lightSkyBlue",
  LIGHT_SLATE_GRAY: "lightSlateGray",
  LIGHT_SLATE_GREY: "lightSlateGrey",
  LIGHT_STEEL_BLUE: "lightSteelBlue",
  LIGHT_YELLOW: "lightYellow",
  LIME: "lime",
  LIME_GREEN: "limeGreen",
  LINEN: "linen",
  MAGENTA: "magenta",
  MAROON: "maroon",
  MEDIUM_AQUAMARINE: "mediumAquamarine",
  MEDIUM_BLUE: "mediumBlue",
  MEDIUM_ORCHID: "mediumOrchid",
  MEDIUM_PURPLE: "mediumPurple",
  MEDIUM_SEA_GREEN: "mediumSeaGreen",
  MEDIUM_SLATE_BLUE: "mediumSlateBlue",
  MEDIUM_SPRING_GREEN: "mediumSpringGreen",
  MEDIUM_TURQUOISE: "mediumTurquoise",
  MEDIUM_VIOLET_RED: "mediumVioletRed",
  MIDNIGHT_BLUE: "midnightBlue",
  MINT_CREAM: "mintCream",
  MISTY_ROSE: "mistyRose",
  MOCCASIN: "moccasin",
  NAVAJO_WHITE: "navajoWhite",
  NAVY: "navy",
  OLD_LACE: "oldLace",
  OLIVE: "olive",
  OLIVE_DRAB: "oliveDrab",
  ORANGE: "orange",
  ORANGE_RED: "orangeRed",
  ORCHID: "orchid",
  PALE_GOLDENROD: "paleGoldenrod",
  PALE_GREEN: "paleGreen",
  PALE_TURQUOISE: "paleTurquoise",
  PALE_VIOLET_RED: "paleVioletRed",
  PAPAYA_WHIP: "papayaWhip",
  PEACH_PUFF: "peachPuff",
  PERU: "peru",
  PINK: "pink",
  PLUM: "plum",
  POWDER_BLUE: "powderBlue",
  PURPLE: "purple",
  RED: "red",
  ROSY_BROWN: "rosyBrown",
  ROYAL_BLUE: "royalBlue",
  SADDLE_BROWN: "saddleBrown",
  SALMON: "salmon",
  SANDY_BROWN: "sandyBrown",
  SEA_GREEN: "seaGreen",
  SEA_SHELL: "seaShell",
  SIENNA: "sienna",
  SILVER: "silver",
  SKY_BLUE: "skyBlue",
  SLATE_BLUE: "slateBlue",
  SLATE_GRAY: "slateGray",
  SLATE_GREY: "slateGrey",
  SNOW: "snow",
  SPRING_GREEN: "springGreen",
  STEEL_BLUE: "steelBlue",
  TAN: "tan",
  TEAL: "teal",
  THISTLE: "thistle",
  TOMATO: "tomato",
  TURQUOISE: "turquoise",
  VIOLET: "violet",
  WHEAT: "wheat",
  WHITE: "white",
  WHITE_SMOKE: "whiteSmoke",
  YELLOW: "yellow",
  YELLOW_GREEN: "yellowGreen"
};
var SchemeColor = {
  /** Background color 1 */
  BG1: "bg1",
  /** Text color 1 */
  TX1: "tx1",
  /** Background color 2 */
  BG2: "bg2",
  /** Text color 2 */
  TX2: "tx2",
  /** Accent color 1 */
  ACCENT1: "accent1",
  /** Accent color 2 */
  ACCENT2: "accent2",
  /** Accent color 3 */
  ACCENT3: "accent3",
  /** Accent color 4 */
  ACCENT4: "accent4",
  /** Accent color 5 */
  ACCENT5: "accent5",
  /** Accent color 6 */
  ACCENT6: "accent6",
  /** Hyperlink color */
  HLINK: "hlink",
  /** Followed hyperlink color */
  FOLHLINK: "folHlink",
  /** Dark color 1 */
  DK1: "dk1",
  /** Light color 1 */
  LT1: "lt1",
  /** Dark color 2 */
  DK2: "dk2",
  /** Light color 2 */
  LT2: "lt2",
  /** Placeholder color */
  PHCLR: "phClr"
};
var SystemColor = {
  SCROLL_BAR: "scrollBar",
  BACKGROUND: "background",
  ACTIVE_CAPTION: "activeCaption",
  INACTIVE_CAPTION: "inactiveCaption",
  MENU: "menu",
  WINDOW: "window",
  WINDOW_FRAME: "windowFrame",
  MENU_TEXT: "menuText",
  WINDOW_TEXT: "windowText",
  CAPTION_TEXT: "captionText",
  ACTIVE_BORDER: "activeBorder",
  INACTIVE_BORDER: "inactiveBorder",
  APP_WORKSPACE: "appWorkspace",
  HIGHLIGHT: "highlight",
  HIGHLIGHT_TEXT: "highlightText",
  BTN_FACE: "btnFace",
  BTN_SHADOW: "btnShadow",
  GRAY_TEXT: "grayText",
  BTN_TEXT: "btnText",
  INACTIVE_CAPTION_TEXT: "inactiveCaptionText",
  BTN_HIGHLIGHT: "btnHighlight",
  THREE_D_DK_SHADOW: "3dDkShadow",
  THREE_D_LIGHT: "3dLight",
  INFO_TEXT: "infoText",
  INFO_BK: "infoBk",
  HOT_LIGHT: "hotLight",
  GRADIENT_ACTIVE_CAPTION: "gradientActiveCaption",
  GRADIENT_INACTIVE_CAPTION: "gradientInactiveCaption",
  MENU_HIGHLIGHT: "menuHighlight",
  MENU_BAR: "menuBar"
};
var TRANSFORM_KEYS = /* @__PURE__ */ new Set([
  ...PERCENT_TRANSFORMS,
  ...ANGLE_TRANSFORMS,
  ...BOOLEAN_TRANSFORMS
]);
function parsePercentChannel(raw) {
  return parsePercentAttr(raw) ?? 0;
}
function stringifyTransforms(opts) {
  return createColorTransforms(opts).join("");
}
function readTransforms(el) {
  if (!el.elements || el.elements.length === 0) return void 0;
  const result = {};
  for (const child of el.elements) {
    if (!child.name || !child.name.startsWith("a:")) continue;
    const key = child.name.slice(2);
    if (!TRANSFORM_KEYS.has(key)) continue;
    const val = child.attributes?.["val"];
    if (val !== void 0) result[key] = PERCENT_TRANSFORMS.has(key) ? parsePercentAttr(val) ?? 0 : ANGLE_TRANSFORMS.has(key) ? parseAngle(Number(val)) : Number(val);
    else result[key] = true;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
var rgbColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    if (transforms) return `<a:srgbClr val="${escapeXml(opts.value)}">${transforms}</a:srgbClr>`;
    return `<a:srgbClr val="${escapeXml(opts.value)}"/>`;
  },
  parse(el, _ctx) {
    const result = { value: String(el.attributes?.["val"] ?? "") };
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var schemeColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    if (transforms) return `<a:schemeClr val="${escapeXml(opts.value)}">${transforms}</a:schemeClr>`;
    return `<a:schemeClr val="${escapeXml(opts.value)}"/>`;
  },
  parse(el, _ctx) {
    const result = { value: String(el.attributes?.["val"] ?? "") };
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var hslColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    const sat = emitPercent(opts.saturation);
    const lum = emitPercent(opts.luminance);
    const hue = emitAngle(opts.hue);
    if (transforms) return `<a:hslClr hue="${hue}" sat="${sat}" lum="${lum}">${transforms}</a:hslClr>`;
    return `<a:hslClr hue="${hue}" sat="${sat}" lum="${lum}"/>`;
  },
  parse(el, _ctx) {
    const result = {
      hue: parseAngle(Number(el.attributes?.["hue"] ?? 0)),
      saturation: parsePercent(Number(el.attributes?.["sat"] ?? 0)),
      luminance: parsePercent(Number(el.attributes?.["lum"] ?? 0))
    };
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var systemColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    const attrParts = [`val="${escapeXml(opts.value)}"`];
    if (opts.lastClr) attrParts.push(`lastClr="${escapeXml(opts.lastClr)}"`);
    const attrStr = attrParts.join(" ");
    if (transforms) return `<a:sysClr ${attrStr}>${transforms}</a:sysClr>`;
    return `<a:sysClr ${attrStr}/>`;
  },
  parse(el, _ctx) {
    const result = { value: String(el.attributes?.["val"] ?? "") };
    const lastClr = el.attributes?.["lastClr"];
    if (lastClr) result.lastClr = String(lastClr);
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var presetColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    if (transforms) return `<a:prstClr val="${escapeXml(opts.value)}">${transforms}</a:prstClr>`;
    return `<a:prstClr val="${escapeXml(opts.value)}"/>`;
  },
  parse(el, _ctx) {
    const result = { value: String(el.attributes?.["val"] ?? "") };
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var scRgbColorDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const transforms = opts.transforms ? stringifyTransforms(opts.transforms) : "";
    const r = emitPercent(opts.r);
    const g = emitPercent(opts.g);
    const b = emitPercent(opts.b);
    if (transforms) return `<a:scrgbClr r="${r}" g="${g}" b="${b}">${transforms}</a:scrgbClr>`;
    return `<a:scrgbClr r="${r}" g="${g}" b="${b}"/>`;
  },
  parse(el, _ctx) {
    const result = {
      r: parsePercentChannel(el.attributes?.["r"]),
      g: parsePercentChannel(el.attributes?.["g"]),
      b: parsePercentChannel(el.attributes?.["b"])
    };
    const transforms = readTransforms(el);
    if (transforms) result.transforms = transforms;
    return result;
  }
};
var SYSTEM_COLOR_VALUES = new Set(Object.values(SystemColor));
var PRESET_COLOR_VALUES = new Set(Object.values(PresetColor));
var SCHEME_COLOR_VALUES = new Set(Object.values(SchemeColor));
var NO_WRITE_CTX = void 0;
function emitColorChoice(color) {
  if ("hue" in color) return hslColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
  if ("r" in color) return scRgbColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
  const colorValue = color.value;
  if (SYSTEM_COLOR_VALUES.has(colorValue)) return systemColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
  if (PRESET_COLOR_VALUES.has(colorValue)) return presetColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
  if (SCHEME_COLOR_VALUES.has(colorValue)) return schemeColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
  return rgbColorDesc.stringify(color, NO_WRITE_CTX) ?? "";
}
function stringifyColorChoice(color, _ctx) {
  return emitColorChoice(color);
}
function isPlainRgbColor(color) {
  if ("hue" in color || "r" in color) return false;
  if (color.transforms !== void 0) return false;
  const value = color.value;
  return typeof value === "string" && !SYSTEM_COLOR_VALUES.has(value) && !PRESET_COLOR_VALUES.has(value) && !SCHEME_COLOR_VALUES.has(value);
}
function parseColorChoiceElement(el, ctx) {
  switch (el.name) {
    case "a:srgbClr":
      return rgbColorDesc.parse(el, ctx);
    case "a:schemeClr":
      return schemeColorDesc.parse(el, ctx);
    case "a:hslClr":
      return hslColorDesc.parse(el, ctx);
    case "a:sysClr":
      return systemColorDesc.parse(el, ctx);
    case "a:prstClr":
      return presetColorDesc.parse(el, ctx);
    case "a:scrgbClr":
      return scRgbColorDesc.parse(el, ctx);
    default:
      return;
  }
}
function parseColorChoice(el, ctx) {
  if (!el.elements) return {};
  for (const child of el.elements) {
    const color = parseColorChoiceElement(child, ctx);
    if (color) return color;
  }
  return {};
}
var solidFillDesc = {
  kind: "custom",
  stringify(color, ctx) {
    const inner = stringifyColorChoice(color, ctx);
    if (!inner) return void 0;
    return `<a:solidFill>${inner}</a:solidFill>`;
  },
  parse(el, _ctx) {
    return parseColorChoice(el, _ctx);
  }
};
var createColorElement = (color) => emitColorChoice(color);
var createSolidFill = (options) => element("a:solidFill", void 0, [createColorElement(options)]);
function stringifySphereCoords(coords) {
  return `<a:rot lat="${emitAngle(coords.lat)}" lon="${emitAngle(coords.lon)}" rev="${emitAngle(coords.rev)}"/>`;
}
function readSphereCoords(el) {
  const lat = el.attributes?.["lat"];
  const lon = el.attributes?.["lon"];
  const rev2 = el.attributes?.["rev"];
  if (lat === void 0 || lon === void 0 || rev2 === void 0) return void 0;
  return {
    lat: parseAngle(Number(lat)),
    lon: parseAngle(Number(lon)),
    rev: parseAngle(Number(rev2))
  };
}
var bevelDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrParts = [];
    if (opts.w !== void 0) attrParts.push(`w="${opts.w}"`);
    if (opts.h !== void 0) attrParts.push(`h="${opts.h}"`);
    if (opts.prst !== void 0) attrParts.push(`prst="${escapeXml(opts.prst)}"`);
    return `<a:bevel${attrParts.length ? " " + attrParts.join(" ") : ""}/>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes?.["w"] !== void 0) result.w = Number(el.attributes["w"]);
    if (el.attributes?.["h"] !== void 0) result.h = Number(el.attributes["h"]);
    if (el.attributes?.["prst"] !== void 0) result.prst = String(el.attributes["prst"]);
    return result;
  }
};
var shape3DDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.bevelT) {
      const bevelXml = stringify$1(bevelDesc, opts.bevelT, ctx);
      if (bevelXml) parts.push(bevelXml.replace("<a:bevel", "<a:bevelT"));
    }
    if (opts.bevelB) {
      const bevelXml = stringify$1(bevelDesc, opts.bevelB, ctx);
      if (bevelXml) parts.push(bevelXml.replace("<a:bevel", "<a:bevelB"));
    }
    if (opts.extrusionColor) {
      const colorXml = stringifyColorChoice(opts.extrusionColor, ctx);
      if (colorXml) parts.push(`<a:extrusionClr>${colorXml}</a:extrusionClr>`);
    }
    if (opts.contourColor) {
      const colorXml = stringifyColorChoice(opts.contourColor, ctx);
      if (colorXml) parts.push(`<a:contourClr>${colorXml}</a:contourClr>`);
    }
    const attrParts = [];
    if (opts.z !== void 0) attrParts.push(`z="${opts.z}"`);
    if (opts.extrusionH !== void 0) attrParts.push(`extrusionH="${opts.extrusionH}"`);
    if (opts.contourW !== void 0) attrParts.push(`contourW="${opts.contourW}"`);
    if (opts.prstMaterial !== void 0) attrParts.push(`prstMaterial="${escapeXml(xsdMaterialType.to(opts.prstMaterial))}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    const content = parts.join("");
    if (!attrStr && !content) return void 0;
    if (!content) return `<a:sp3d${attrStr}/>`;
    return `<a:sp3d${attrStr}>${content}</a:sp3d>`;
  },
  parse(el, ctx) {
    const result = {};
    if (el.attributes?.["z"] !== void 0) result.z = Number(el.attributes["z"]);
    if (el.attributes?.["extrusionH"] !== void 0) result.extrusionH = Number(el.attributes["extrusionH"]);
    if (el.attributes?.["contourW"] !== void 0) result.contourW = Number(el.attributes["contourW"]);
    if (el.attributes?.["prstMaterial"] !== void 0) result.prstMaterial = xsdMaterialType.from(String(el.attributes["prstMaterial"]));
    const bevelT = findChild(el, "a:bevelT");
    if (bevelT) result.bevelT = parse$1(bevelDesc, bevelT, ctx);
    const bevelB = findChild(el, "a:bevelB");
    if (bevelB) result.bevelB = parse$1(bevelDesc, bevelB, ctx);
    const extrusionClr = findChild(el, "a:extrusionClr");
    if (extrusionClr) {
      const color = parseColorChoice(extrusionClr, ctx);
      if (color && Object.keys(color).length) result.extrusionColor = color;
    }
    const contourClr = findChild(el, "a:contourClr");
    if (contourClr) {
      const color = parseColorChoice(contourClr, ctx);
      if (color && Object.keys(color).length) result.contourColor = color;
    }
    return result;
  }
};
var cameraDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrParts = [];
    attrParts.push(`prst="${escapeXml(opts.preset)}"`);
    if (opts.fov !== void 0) attrParts.push(`fov="${emitAngle(opts.fov)}"`);
    if (opts.zoom !== void 0) attrParts.push(`zoom="${escapeXml(opts.zoom)}"`);
    const attrStr = " " + attrParts.join(" ");
    const parts = [];
    if (opts.rotation) parts.push(stringifySphereCoords(opts.rotation));
    const content = parts.join("");
    if (!content) return `<a:camera${attrStr}/>`;
    return `<a:camera${attrStr}>${content}</a:camera>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes?.["prst"] !== void 0) result.preset = String(el.attributes["prst"]);
    if (el.attributes?.["fov"] !== void 0) result.fov = parseAngle(Number(el.attributes["fov"]));
    if (el.attributes?.["zoom"] !== void 0) result.zoom = String(el.attributes["zoom"]);
    const rot = findChild(el, "a:rot");
    if (rot) result.rotation = readSphereCoords(rot);
    return result;
  }
};
var lightRigDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrParts = [];
    attrParts.push(`rig="${escapeXml(opts.rig)}"`);
    attrParts.push(`dir="${escapeXml(xsdLightRigDirection.to(opts.direction))}"`);
    const attrStr = " " + attrParts.join(" ");
    const parts = [];
    if (opts.rotation) parts.push(stringifySphereCoords(opts.rotation));
    const content = parts.join("");
    if (!content) return `<a:lightRig${attrStr}/>`;
    return `<a:lightRig${attrStr}>${content}</a:lightRig>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes?.["rig"] !== void 0) result.rig = String(el.attributes["rig"]);
    if (el.attributes?.["dir"] !== void 0) result.direction = xsdLightRigDirection.from(String(el.attributes["dir"]));
    const rot = findChild(el, "a:rot");
    if (rot) result.rotation = readSphereCoords(rot);
    return result;
  }
};
var scene3DDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    const cameraXml = stringify$1(cameraDesc, opts.camera, ctx);
    if (cameraXml) parts.push(cameraXml);
    const lightRigXml = stringify$1(lightRigDesc, opts.lightRig, ctx);
    if (lightRigXml) parts.push(lightRigXml);
    if (opts.backdrop) parts.push(stringifyBackdrop(opts.backdrop));
    const content = parts.join("");
    if (!content) return void 0;
    return `<a:scene3d>${content}</a:scene3d>`;
  },
  parse(el, ctx) {
    const result = {};
    const camera = findChild(el, "a:camera");
    if (camera) result.camera = parse$1(cameraDesc, camera, ctx);
    const lightRig = findChild(el, "a:lightRig");
    if (lightRig) result.lightRig = parse$1(lightRigDesc, lightRig, ctx);
    const backdrop = findChild(el, "a:backdrop");
    if (backdrop) result.backdrop = readBackdrop(backdrop);
    return result;
  }
};
function stringifyPoint3D(name, point) {
  return `<${name} x="${point.x}" y="${point.y}" z="${point.z}"/>`;
}
function stringifyVector3D(name, vector) {
  return `<${name} dx="${vector.dx}" dy="${vector.dy}" dz="${vector.dz}"/>`;
}
function stringifyBackdrop(opts) {
  return `<a:backdrop>${stringifyPoint3D("a:anchor", opts.anchor) + stringifyVector3D("a:norm", opts.normal) + stringifyVector3D("a:up", opts.up) + (opts.ext !== void 0 ? `<a:extLst>${opts.ext}</a:extLst>` : "")}</a:backdrop>`;
}
function readPoint3D(el) {
  const x = el.attributes?.["x"];
  const y = el.attributes?.["y"];
  const z = el.attributes?.["z"];
  if (x === void 0 || y === void 0 || z === void 0) return void 0;
  return {
    x: Number(x),
    y: Number(y),
    z: Number(z)
  };
}
function readVector3D(el) {
  const dx = el.attributes?.["dx"];
  const dy = el.attributes?.["dy"];
  const dz = el.attributes?.["dz"];
  if (dx === void 0 || dy === void 0 || dz === void 0) return void 0;
  return {
    dx: Number(dx),
    dy: Number(dy),
    dz: Number(dz)
  };
}
function readBackdrop(el) {
  const anchor = findChild(el, "a:anchor");
  const norm = findChild(el, "a:norm");
  const up = findChild(el, "a:up");
  if (!anchor || !norm || !up) return void 0;
  const anchorPt = readPoint3D(anchor);
  const normVec = readVector3D(norm);
  const upVec = readVector3D(up);
  if (!anchorPt || !normVec || !upVec) return void 0;
  const result = {
    anchor: anchorPt,
    normal: normVec,
    up: upVec
  };
  const extLst = findChild(el, "a:extLst");
  if (extLst) result.ext = stringify(extLst);
  return result;
}
var tileDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrParts = [];
    if (opts.tx !== void 0) attrParts.push(`tx="${opts.tx}"`);
    if (opts.ty !== void 0) attrParts.push(`ty="${opts.ty}"`);
    if (opts.sx !== void 0) attrParts.push(`sx="${emitPercent(opts.sx)}"`);
    if (opts.sy !== void 0) attrParts.push(`sy="${emitPercent(opts.sy)}"`);
    if (opts.flip !== void 0) attrParts.push(`flip="${escapeXml(opts.flip)}"`);
    if (opts.alignment !== void 0) attrParts.push(`algn="${escapeXml(xsdRectAlignment.to(opts.alignment))}"`);
    return `<a:tile${attrParts.length ? " " + attrParts.join(" ") : ""}/>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes?.["tx"] !== void 0) result.tx = Number(el.attributes["tx"]);
    if (el.attributes?.["ty"] !== void 0) result.ty = Number(el.attributes["ty"]);
    if (el.attributes?.["sx"] !== void 0) result.sx = parsePercentAttr(el.attributes["sx"]);
    if (el.attributes?.["sy"] !== void 0) result.sy = parsePercentAttr(el.attributes["sy"]);
    if (el.attributes?.["flip"] !== void 0) result.flip = String(el.attributes["flip"]);
    if (el.attributes?.["algn"] !== void 0) result.alignment = xsdRectAlignment.from(String(el.attributes["algn"]));
    return result;
  }
};
var sourceRectangleDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrParts = [];
    if (opts.left !== void 0) attrParts.push(`l="${emitPercent(opts.left)}"`);
    if (opts.top !== void 0) attrParts.push(`t="${emitPercent(opts.top)}"`);
    if (opts.right !== void 0) attrParts.push(`r="${emitPercent(opts.right)}"`);
    if (opts.bottom !== void 0) attrParts.push(`b="${emitPercent(opts.bottom)}"`);
    return `<a:srcRect${attrParts.length ? " " + attrParts.join(" ") : ""}/>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes?.["l"] !== void 0) result.left = parsePercentAttr(el.attributes["l"]);
    if (el.attributes?.["t"] !== void 0) result.top = parsePercentAttr(el.attributes["t"]);
    if (el.attributes?.["r"] !== void 0) result.right = parsePercentAttr(el.attributes["r"]);
    if (el.attributes?.["b"] !== void 0) result.bottom = parsePercentAttr(el.attributes["b"]);
    return result;
  }
};
function stringifyBlipEffects(opts, ctx) {
  const parts = [];
  if (opts.grayscale) parts.push("<a:grayscl/>");
  if (opts.luminance) {
    const attrParts = [];
    if (opts.luminance.bright !== void 0) attrParts.push(`bright="${emitPercent(opts.luminance.bright)}"`);
    if (opts.luminance.contrast !== void 0) attrParts.push(`contrast="${emitPercent(opts.luminance.contrast)}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    parts.push(`<a:lum${attrStr}/>`);
  }
  if (opts.hsl) {
    const attrParts = [];
    if (opts.hsl.hue !== void 0) attrParts.push(`hue="${emitAngle(opts.hsl.hue)}"`);
    if (opts.hsl.saturation !== void 0) attrParts.push(`sat="${emitPercent(opts.hsl.saturation)}"`);
    if (opts.hsl.luminance !== void 0) attrParts.push(`lum="${emitPercent(opts.hsl.luminance)}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    parts.push(`<a:hsl${attrStr}/>`);
  }
  if (opts.tint) {
    const attrParts = [];
    if (opts.tint.hue !== void 0) attrParts.push(`hue="${emitAngle(opts.tint.hue)}"`);
    if (opts.tint.amount !== void 0) attrParts.push(`amt="${emitPercent(opts.tint.amount)}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    parts.push(`<a:tint${attrStr}/>`);
  }
  if (opts.duotone) {
    const c1 = stringifyColorChoice(opts.duotone.color1, ctx);
    const c2 = stringifyColorChoice(opts.duotone.color2, ctx);
    parts.push(`<a:duotone>${c1}${c2}</a:duotone>`);
  }
  if (opts.biLevel) parts.push(`<a:biLevel thresh="${emitPercent(opts.biLevel.threshold)}"/>`);
  if (opts.alphaCeiling) parts.push("<a:alphaCeiling/>");
  if (opts.alphaFloor) parts.push("<a:alphaFloor/>");
  if (opts.alphaInverse !== void 0) {
    if (typeof opts.alphaInverse === "boolean") parts.push("<a:alphaInv/>");
    else parts.push(`<a:alphaInv>${stringifyColorChoice(opts.alphaInverse, ctx)}</a:alphaInv>`);
  }
  if (opts.alphaModulateFixed) {
    const amt = emitPercent(opts.alphaModulateFixed.amount ?? 100);
    parts.push(`<a:alphaModFix amt="${amt}"/>`);
  }
  if (opts.alphaReplace) parts.push(`<a:alphaRepl a="${emitPercent(opts.alphaReplace.alpha)}"/>`);
  if (opts.alphaBiLevel) parts.push(`<a:alphaBiLevel thresh="${emitPercent(opts.alphaBiLevel.threshold)}"/>`);
  if (opts.colorChange) {
    const fromXml = stringifyColorChoice(opts.colorChange.from, ctx);
    const toXml = stringifyColorChoice(opts.colorChange.to, ctx);
    const attrParts = [];
    if (opts.colorChange.useAlpha === false) attrParts.push('useA="0"');
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    parts.push(`<a:clrChange${attrStr}><a:clrFrom>${fromXml ?? ""}</a:clrFrom><a:clrTo>${toXml ?? ""}</a:clrTo></a:clrChange>`);
  }
  if (opts.colorReplace) parts.push(`<a:clrRepl>${stringifyColorChoice(opts.colorReplace.color, ctx)}</a:clrRepl>`);
  if (opts.blur) {
    const attrParts = [];
    if (opts.blur.radius !== void 0) attrParts.push(`rad="${opts.blur.radius}"`);
    if (opts.blur.grow === false) attrParts.push('grow="0"');
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    parts.push(`<a:blur${attrStr}/>`);
  }
  return parts.join("");
}
function readBlipEffects(el, ctx) {
  const result = {};
  if (findChild(el, "a:grayscl")) result.grayscale = true;
  const lum = findChild(el, "a:lum");
  if (lum) {
    const opts = {};
    const bright = parsePercentAttr(lum.attributes?.["bright"]);
    if (bright !== void 0) opts.bright = bright;
    const contrast = parsePercentAttr(lum.attributes?.["contrast"]);
    if (contrast !== void 0) opts.contrast = contrast;
    result.luminance = opts;
  }
  const hsl = findChild(el, "a:hsl");
  if (hsl) {
    const opts = {};
    if (hsl.attributes?.["hue"] !== void 0) opts.hue = parseAngle(Number(hsl.attributes["hue"]));
    const sat = parsePercentAttr(hsl.attributes?.["sat"]);
    if (sat !== void 0) opts.saturation = sat;
    const l = parsePercentAttr(hsl.attributes?.["lum"]);
    if (l !== void 0) opts.luminance = l;
    result.hsl = opts;
  }
  const tint = findChild(el, "a:tint");
  if (tint) {
    const opts = {};
    if (tint.attributes?.["hue"] !== void 0) opts.hue = parseAngle(Number(tint.attributes["hue"]));
    const amt = parsePercentAttr(tint.attributes?.["amt"]);
    if (amt !== void 0) opts.amount = amt;
    result.tint = opts;
  }
  const biLevel = findChild(el, "a:biLevel");
  if (biLevel?.attributes?.["thresh"] !== void 0) result.biLevel = { threshold: parsePercentAttr(biLevel.attributes["thresh"]) };
  if (findChild(el, "a:alphaCeiling")) result.alphaCeiling = true;
  if (findChild(el, "a:alphaFloor")) result.alphaFloor = true;
  const alphaInv = findChild(el, "a:alphaInv");
  if (alphaInv) {
    const color = parseColorChoice(alphaInv, ctx);
    result.alphaInverse = Object.keys(color).length > 0 ? color : {};
  }
  const alphaModFix = findChild(el, "a:alphaModFix");
  if (alphaModFix) {
    const opts = {};
    const amt = parsePercentAttr(alphaModFix.attributes?.["amt"]);
    if (amt !== void 0) opts.amount = amt;
    result.alphaModulateFixed = opts;
  }
  const alphaRepl = findChild(el, "a:alphaRepl");
  if (alphaRepl?.attributes?.["a"] !== void 0) result.alphaReplace = { alpha: parsePercentAttr(alphaRepl.attributes["a"]) };
  const alphaBiLevel = findChild(el, "a:alphaBiLevel");
  if (alphaBiLevel?.attributes?.["thresh"] !== void 0) result.alphaBiLevel = { threshold: parsePercentAttr(alphaBiLevel.attributes["thresh"]) };
  const clrChange = findChild(el, "a:clrChange");
  if (clrChange) {
    const opts = {};
    if (clrChange.attributes?.["useA"] !== void 0) opts.useAlpha = parseOnOff(clrChange.attributes["useA"]) ?? true;
    const clrFrom = findChild(clrChange, "a:clrFrom");
    if (clrFrom) opts.from = parseColorChoice(clrFrom, ctx);
    const clrTo = findChild(clrChange, "a:clrTo");
    if (clrTo) opts.to = parseColorChoice(clrTo, ctx);
    result.colorChange = opts;
  }
  const clrRepl = findChild(el, "a:clrRepl");
  if (clrRepl) result.colorReplace = { color: parseColorChoice(clrRepl, ctx) };
  const blur = findChild(el, "a:blur");
  if (blur) {
    const opts = {};
    if (blur.attributes?.["rad"] !== void 0) opts.radius = Number(blur.attributes["rad"]);
    if (blur.attributes?.["grow"] !== void 0) opts.grow = parseOnOff(blur.attributes["grow"]) ?? true;
    result.blur = opts;
  }
  const duotone = findChild(el, "a:duotone");
  if (duotone?.elements) {
    const fills = [];
    for (const child of duotone.elements) {
      const color = parseColorChoiceElement(child, ctx);
      if (color) fills.push(color);
    }
    const [color1, color2] = fills;
    if (color1 && color2) result.duotone = {
      color1,
      color2
    };
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
var USE_LOCAL_DPI_EXT_URI = "{28A0092B-C50C-407E-A947-70E740481C1C}";
var blipDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const attrParts = [];
    if (opts.referenceId !== void 0) attrParts.push(`r:embed="{${escapeXml(opts.referenceId)}}"`);
    if (opts.compression !== void 0) attrParts.push(`cstate="${opts.compression}"`);
    if (opts.linkReferenceId !== void 0) attrParts.push(`r:link="{${escapeXml(opts.linkReferenceId)}}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    const parts = [];
    if (opts.blipEffects) parts.push(stringifyBlipEffects(opts.blipEffects, ctx));
    if (opts.ext !== void 0) parts.push(`<a:extLst>${opts.ext}</a:extLst>`);
    else if (opts.useLocalDpi !== void 0) parts.push(`<a:extLst><a:ext uri="${USE_LOCAL_DPI_EXT_URI}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="${opts.useLocalDpi ? 1 : 0}"/></a:ext></a:extLst>`);
    const content = parts.join("");
    if (!content) return `<a:blip${attrStr}/>`;
    return `<a:blip${attrStr}>${content}</a:blip>`;
  },
  parse(el, ctx) {
    const result = {};
    const embed = el.attributes?.["r:embed"];
    if (embed !== void 0) result.referenceId = String(embed).replace(/^\{(.+)\}$/, "$1");
    const link = el.attributes?.["r:link"];
    if (link !== void 0) result.linkReferenceId = String(link).replace(/^\{(.+)\}$/, "$1");
    const cstate = el.attributes?.["cstate"];
    if (cstate !== void 0) result.compression = cstate;
    const effects = readBlipEffects(el, ctx);
    if (effects) result.blipEffects = effects;
    const extLst = findChild(el, "a:extLst");
    if (extLst) {
      if ((extLst.elements ?? []).some((ext) => ext.name === "a:ext" && !extUriMatches(attr(ext, "uri"), USE_LOCAL_DPI_EXT_URI))) {
        const inner = (extLst.elements ?? []).map((e) => stringifyElement(e)).join("");
        if (inner) result.ext = inner;
      } else for (const ext of extLst.elements ?? []) {
        if (ext.name !== "a:ext" || !extUriMatches(attr(ext, "uri"), USE_LOCAL_DPI_EXT_URI)) continue;
        const useLocalDpi = findChild(ext, "a14:useLocalDpi");
        if (useLocalDpi !== void 0) result.useLocalDpi = parseOnOff(attr(useLocalDpi, "val")) ?? true;
      }
    }
    return result;
  }
};
var blipFillDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const attrParts = [];
    if (opts.dpi !== void 0) attrParts.push(`dpi="${opts.dpi}"`);
    if (opts.rotWithShape !== void 0) attrParts.push(`rotWithShape="${opts.rotWithShape ? 1 : 0}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    const parts = [];
    if (opts.referenceId) {
      const blipOpts = {
        referenceId: opts.referenceId,
        blipEffects: opts.blipEffects
      };
      const blipXml = stringify$1(blipDesc, blipOpts, ctx);
      if (blipXml) parts.push(blipXml);
    }
    if (opts.sourceRectangle) {
      const srcRectXml = stringify$1(sourceRectangleDesc, opts.sourceRectangle, ctx);
      if (srcRectXml) parts.push(srcRectXml);
    }
    if (opts.tile) {
      const tileXml = stringify$1(tileDesc, opts.tile, ctx);
      if (tileXml) parts.push(tileXml);
    } else parts.push("<a:stretch><a:fillRect/></a:stretch>");
    const content = parts.join("");
    if (!attrStr && !content) return void 0;
    if (!content) return `<pic:blipFill${attrStr}/>`;
    return `<pic:blipFill${attrStr}>${content}</pic:blipFill>`;
  },
  parse(el, ctx) {
    const result = {};
    if (el.attributes?.["dpi"] !== void 0) result.dpi = Number(el.attributes["dpi"]);
    if (el.attributes?.["rotWithShape"] !== void 0) result.rotWithShape = parseOnOff(el.attributes["rotWithShape"]) ?? true;
    const blip = findChild(el, "a:blip");
    if (blip) {
      const blipResult = parse$1(blipDesc, blip, ctx);
      if (blipResult.referenceId) result.referenceId = blipResult.referenceId;
      if (blipResult.blipEffects) result.blipEffects = blipResult.blipEffects;
    }
    const srcRect = findChild(el, "a:srcRect");
    if (srcRect) result.sourceRectangle = parse$1(sourceRectangleDesc, srcRect, ctx);
    const tile = findChild(el, "a:tile");
    if (tile) result.tile = parse$1(tileDesc, tile, ctx);
    return result;
  }
};
var createBlipEffects = (options) => {
  const children2 = [];
  if (options.grayscale) children2.push(`<a:grayscl/>`);
  if (options.luminance) {
    const attrs2 = {};
    if (options.luminance.bright !== void 0) attrs2.bright = `${emitPercent(options.luminance.bright)}`;
    if (options.luminance.contrast !== void 0) attrs2.contrast = `${emitPercent(options.luminance.contrast)}`;
    children2.push(element("a:lum", attrs2));
  }
  if (options.hsl) {
    const attrs2 = {};
    if (options.hsl.hue !== void 0) attrs2.hue = `${emitAngle(options.hsl.hue)}`;
    if (options.hsl.saturation !== void 0) attrs2.sat = `${emitPercent(options.hsl.saturation)}`;
    if (options.hsl.luminance !== void 0) attrs2.lum = `${emitPercent(options.hsl.luminance)}`;
    children2.push(element("a:hsl", attrs2));
  }
  if (options.tint) {
    const attrs2 = {};
    if (options.tint.hue !== void 0) attrs2.hue = `${emitAngle(options.tint.hue)}`;
    if (options.tint.amount !== void 0) attrs2.amt = `${emitPercent(options.tint.amount)}`;
    children2.push(element("a:tint", attrs2));
  }
  if (options.duotone) children2.push(element("a:duotone", void 0, [createColorElement(options.duotone.color1), createColorElement(options.duotone.color2)]));
  if (options.biLevel) children2.push(`<a:biLevel thresh="${emitPercent(options.biLevel.threshold)}"/>`);
  if (options.alphaCeiling) children2.push(`<a:alphaCeiling/>`);
  if (options.alphaFloor) children2.push(`<a:alphaFloor/>`);
  if (options.alphaInverse !== void 0) {
    if (typeof options.alphaInverse === "boolean") children2.push(`<a:alphaInv/>`);
    else children2.push(element("a:alphaInv", void 0, [createColorElement(options.alphaInverse)]));
  }
  if (options.alphaModulateFixed) {
    const amt = emitPercent(options.alphaModulateFixed.amount ?? 100);
    children2.push(`<a:alphaModFix amt="${amt}"/>`);
  }
  if (options.alphaReplace) children2.push(`<a:alphaRepl a="${emitPercent(options.alphaReplace.alpha)}"/>`);
  if (options.alphaBiLevel) children2.push(`<a:alphaBiLevel thresh="${emitPercent(options.alphaBiLevel.threshold)}"/>`);
  if (options.colorChange) {
    const attrs2 = {};
    if (options.colorChange.useAlpha === false) attrs2.useA = "0";
    children2.push(element("a:clrChange", attrs2, [element("a:clrFrom", void 0, [createColorElement(options.colorChange.from)]), element("a:clrTo", void 0, [createColorElement(options.colorChange.to)])]));
  }
  if (options.colorReplace) children2.push(element("a:clrRepl", void 0, [createColorElement(options.colorReplace.color)]));
  if (options.blur) {
    const attrs2 = {};
    if (options.blur.radius !== void 0) attrs2.rad = options.blur.radius;
    if (options.blur.grow === false) attrs2.grow = 0;
    children2.push(element("a:blur", attrs2));
  }
  return children2;
};
var createSourceRectangle = (options, tag = "a:srcRect") => {
  if (!options) return element(tag);
  const attrs2 = {};
  if (options.left !== void 0) attrs2.l = Math.round(options.left * 1e3);
  if (options.top !== void 0) attrs2.t = Math.round(options.top * 1e3);
  if (options.right !== void 0) attrs2.r = Math.round(options.right * 1e3);
  if (options.bottom !== void 0) attrs2.b = Math.round(options.bottom * 1e3);
  return element(tag, attrs2);
};
var createTileInfo = (options) => {
  if (!options) return `<a:tile/>`;
  const attrs2 = {};
  if (options.tx !== void 0) attrs2.tx = convertToEmu(options.tx);
  if (options.ty !== void 0) attrs2.ty = convertToEmu(options.ty);
  if (options.sx !== void 0) attrs2.sx = Math.round(options.sx * 1e3);
  if (options.sy !== void 0) attrs2.sy = Math.round(options.sy * 1e3);
  if (options.flip !== void 0) attrs2.flip = options.flip;
  if (options.alignment !== void 0) attrs2.algn = xsdRectAlignment.to(options.alignment);
  return element("a:tile", attrs2);
};
function stringifyRelativeRect(tag, rect) {
  const parts = [];
  if (rect.left) parts.push(`l="${escapeXml(rect.left)}"`);
  if (rect.top) parts.push(`t="${escapeXml(rect.top)}"`);
  if (rect.right) parts.push(`r="${escapeXml(rect.right)}"`);
  if (rect.bottom) parts.push(`b="${escapeXml(rect.bottom)}"`);
  return `<${tag}${parts.length ? " " + parts.join(" ") : ""}/>`;
}
function readRelativeRect(el) {
  const result = {};
  if (el.attributes?.["l"]) result.left = String(el.attributes["l"]);
  if (el.attributes?.["t"]) result.top = String(el.attributes["t"]);
  if (el.attributes?.["r"]) result.right = String(el.attributes["r"]);
  if (el.attributes?.["b"]) result.bottom = String(el.attributes["b"]);
  return result;
}
function stringifyShade(shade) {
  if ("angle" in shade) {
    const parts2 = [];
    if (shade.angle !== void 0) parts2.push(`ang="${emitAngle(shade.angle)}"`);
    if (shade.scaled !== void 0) parts2.push(`scaled="${shade.scaled ? 1 : 0}"`);
    return `<a:lin${parts2.length ? " " + parts2.join(" ") : ""}/>`;
  }
  const pathShade = shade;
  const parts = [];
  if (pathShade.path) parts.push(`path="${escapeXml(pathShade.path)}"`);
  const attrStr = parts.length ? " " + parts.join(" ") : "";
  if (pathShade.fillToRectangle) return `<a:path${attrStr}>${stringifyRelativeRect("a:fillToRect", pathShade.fillToRectangle)}</a:path>`;
  return `<a:path${attrStr}/>`;
}
var gradientFillDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return emitGradientFillXml(opts);
  },
  parse(el, ctx) {
    const result = {};
    const gsLst = findChild(el, "a:gsLst");
    if (gsLst?.elements) result.stops = gsLst.elements.filter((c) => c.name === "a:gs").map((gs) => {
      const pos = Number(gs.attributes?.["pos"] ?? 0);
      const color = readDirectColor(gs, ctx);
      return {
        position: parsePercent(pos),
        color
      };
    });
    const lin = findChild(el, "a:lin");
    if (lin) {
      const shade = {};
      if (lin.attributes?.["ang"] !== void 0) shade.angle = parseAngle(Number(lin.attributes["ang"]));
      if (lin.attributes?.["scaled"] !== void 0) shade.scaled = parseOnOff(lin.attributes["scaled"]) ?? true;
      result.shade = shade;
    } else {
      const path = findChild(el, "a:path");
      if (path) {
        const shade = {};
        if (path.attributes?.["path"] !== void 0) shade.path = String(path.attributes["path"]);
        const fillToRectangle = findChild(path, "a:fillToRect");
        if (fillToRectangle) shade.fillToRectangle = readRelativeRect(fillToRectangle);
        result.shade = shade;
      }
    }
    if (el.attributes?.["flip"] !== void 0) result.flip = String(el.attributes["flip"]);
    if (el.attributes?.["rotWithShape"] !== void 0) result.rotateWithShape = parseOnOff(el.attributes["rotWithShape"]) ?? true;
    const tileRectangle = findChild(el, "a:tileRect");
    if (tileRectangle) result.tileRectangle = readRelativeRect(tileRectangle);
    return result;
  }
};
var patternFillDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return emitPatternFillXml(opts);
  },
  parse(el, ctx) {
    const result = {};
    const prst = el.attributes?.["prst"];
    if (prst) result.pattern = xsdPattern.from(String(prst));
    const fgClr = findChild(el, "a:fgClr");
    if (fgClr) result.foregroundColor = readDirectColor(fgClr, ctx);
    const bgClr = findChild(el, "a:bgClr");
    if (bgClr) result.backgroundColor = readDirectColor(bgClr, ctx);
    return result;
  }
};
function emitFillXml(options, embedPlaceholder) {
  if (typeof options === "string") return `<a:solidFill>${emitColorChoice({ value: stripColorHashPrefix(options) })}</a:solidFill>`;
  switch (options.type) {
    case "none":
      return "<a:noFill/>";
    case "solid":
      return `<a:solidFill>${emitColorChoice(typeof options.color === "string" ? { value: stripColorHashPrefix(options.color) } : options.color)}</a:solidFill>`;
    case "gradient": {
      if ("options" in options) return emitGradientFillXml(options.options);
      const gradOpts = { stops: options.stops.map((stop) => ({
        position: stop.position,
        color: typeof stop.color === "string" ? { value: stripColorHashPrefix(stop.color) } : stop.color
      })) };
      if (!options.path && options.angle !== void 0) gradOpts.shade = {
        angle: options.angle,
        scaled: options.scaled ?? true
      };
      if (options.path) gradOpts.shade = { path: options.path };
      return emitGradientFillXml(gradOpts);
    }
    case "blip":
      return emitBlipFill(options, embedPlaceholder);
    case "pattern":
      return emitPatternFillXml({
        pattern: options.pattern,
        ...options.foregroundColor && { foregroundColor: typeof options.foregroundColor === "string" ? { value: stripColorHashPrefix(options.foregroundColor) } : options.foregroundColor },
        ...options.backgroundColor && { backgroundColor: typeof options.backgroundColor === "string" ? { value: stripColorHashPrefix(options.backgroundColor) } : options.backgroundColor }
      });
    case "group":
      return "<a:grpFill/>";
  }
}
function emitGradientFillXml(opts) {
  if (opts.stops.length < 2) return void 0;
  const parts = [];
  const stopsXml = opts.stops.map((stop) => {
    const colorXml = emitColorChoice(stop.color);
    if (!colorXml) return `<a:gs pos="${emitPercent(stop.position)}"/>`;
    return `<a:gs pos="${emitPercent(stop.position)}">${colorXml}</a:gs>`;
  }).join("");
  parts.push(`<a:gsLst>${stopsXml}</a:gsLst>`);
  if (opts.shade) parts.push(stringifyShade(opts.shade));
  if (opts.tileRectangle) parts.push(stringifyRelativeRect("a:tileRect", opts.tileRectangle));
  const attrParts = [];
  if (opts.flip) attrParts.push(`flip="${escapeXml(opts.flip)}"`);
  if (opts.rotateWithShape !== void 0) attrParts.push(`rotWithShape="${opts.rotateWithShape ? 1 : 0}"`);
  return `<a:gradFill${attrParts.length ? " " + attrParts.join(" ") : ""}>${parts.join("")}</a:gradFill>`;
}
function emitPatternFillXml(opts) {
  const parts = [];
  const prst = xsdPattern.to(opts.pattern);
  if (opts.foregroundColor) {
    const colorXml = emitColorChoice(opts.foregroundColor);
    if (colorXml) parts.push(`<a:fgClr>${colorXml}</a:fgClr>`);
  }
  if (opts.backgroundColor) {
    const colorXml = emitColorChoice(opts.backgroundColor);
    if (colorXml) parts.push(`<a:bgClr>${colorXml}</a:bgClr>`);
  }
  const inner = parts.join("");
  return `<a:pattFill prst="${escapeXml(prst)}">${inner}</a:pattFill>`;
}
function emitBlipFill(options, embed) {
  const fileName = `${uniqueId()}.${options.imageType ?? "png"}`;
  const embedRef = embed ?? `{${fileName}}`;
  const blipChildren = [];
  if (options.blipEffects) blipChildren.push(...createBlipEffects(options.blipEffects));
  const children2 = [options.noEmbed ? element("a:blip", void 0, blipChildren.length > 0 ? blipChildren : void 0) : element("a:blip", {
    cstate: "none",
    "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "r:embed": embedRef
  }, blipChildren.length > 0 ? blipChildren : void 0)];
  if (options.sourceRectangle !== void 0) children2.push(createSourceRectangle(options.sourceRectangle));
  if (options.tile) children2.push(createTileInfo(options.tile));
  else children2.push("<a:stretch><a:fillRect/></a:stretch>");
  const attrs2 = {};
  if (options.dpi !== void 0) attrs2.dpi = options.dpi;
  if (options.rotWithShape !== void 0) attrs2.rotWithShape = options.rotWithShape ? 1 : 0;
  return element("a:blipFill", attrs2, children2);
}
var fillDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    if (typeof opts !== "string" && opts.type === "blip") {
      if (opts.noEmbed) return emitBlipFill(opts);
      return emitBlipFill(opts, ctx.addMedia(toUint8Array(opts.data, { encoding: "base64" }), opts.imageType));
    }
    return emitFillXml(opts);
  },
  parse(el, ctx) {
    const fillEl = el.name !== void 0 && FILL_TAGS.has(el.name) ? el : findFillChild(el);
    if (!fillEl) return { type: "none" };
    switch (fillEl.name) {
      case "a:noFill":
        return { type: "none" };
      case "a:solidFill":
        return {
          type: "solid",
          color: parse$1(solidFillDesc, fillEl, ctx)
        };
      case "a:gradFill":
        return {
          type: "gradient",
          options: parse$1(gradientFillDesc, fillEl, ctx)
        };
      case "a:pattFill":
        return {
          type: "pattern",
          ...parse$1(patternFillDesc, fillEl, ctx)
        };
      case "a:grpFill":
        return { type: "group" };
      case "a:blipFill": {
        const blipOpts = parse$1(blipFillDesc, fillEl, ctx);
        const mediaPath = blipOpts.referenceId ? ctx.resolveRelationship(blipOpts.referenceId) : void 0;
        const data = mediaPath ? ctx.getRaw(mediaPath) : void 0;
        if (mediaPath && data) {
          const blip = {
            type: "blip",
            data,
            imageType: imageTypeFromPath(mediaPath),
            fileName: mediaPath.split("/").pop()
          };
          if (blipOpts.dpi !== void 0) blip.dpi = blipOpts.dpi;
          if (blipOpts.rotWithShape !== void 0) blip.rotWithShape = blipOpts.rotWithShape;
          if (blipOpts.blipEffects) blip.blipEffects = blipOpts.blipEffects;
          if (blipOpts.sourceRectangle) blip.sourceRectangle = blipOpts.sourceRectangle;
          if (blipOpts.tile) blip.tile = blipOpts.tile;
          return blip;
        }
        if (blipOpts.referenceId === void 0) {
          const blip = {
            type: "blip",
            noEmbed: true
          };
          if (blipOpts.dpi !== void 0) blip.dpi = blipOpts.dpi;
          if (blipOpts.rotWithShape !== void 0) blip.rotWithShape = blipOpts.rotWithShape;
          if (blipOpts.sourceRectangle) blip.sourceRectangle = blipOpts.sourceRectangle;
          if (blipOpts.tile) blip.tile = blipOpts.tile;
          return blip;
        }
        return { type: "none" };
      }
      default:
        return { type: "none" };
    }
  }
};
var FILL_TAGS = /* @__PURE__ */ new Set([
  "a:noFill",
  "a:solidFill",
  "a:gradFill",
  "a:pattFill",
  "a:grpFill",
  "a:blipFill"
]);
function findFillChild(el) {
  for (const child of el.elements ?? []) if (child.type === "element" && child.name !== void 0 && FILL_TAGS.has(child.name)) return child;
}
function readDirectColor(el, ctx) {
  const color = parseColorChoice(el, ctx);
  if (Object.keys(color).length > 0) return color;
  const solidFill = findChild(el, "a:solidFill");
  if (solidFill) return parse$1(solidFillDesc, solidFill, ctx);
  return { value: "" };
}
var createNoFill = () => element("a:noFill");
var createGradientStop = (stop) => element("a:gs", { pos: Math.round(stop.position * 1e3) }, [createColorElement(stop.color)]);
var createRelativeRect = (name, rect) => element(name, {
  l: rect?.left,
  t: rect?.top,
  r: rect?.right,
  b: rect?.bottom
});
var createShadeElement = (shade) => {
  if ("angle" in shade) return element("a:lin", {
    ang: shade.angle !== void 0 ? Math.round(shade.angle * 6e4) : void 0,
    scaled: shade.scaled
  });
  const pathShade = shade;
  const children2 = [];
  if (pathShade.fillToRectangle) children2.push(createRelativeRect("a:fillToRect", pathShade.fillToRectangle));
  return element("a:path", { path: pathShade.path }, children2);
};
var createGradientFill = (options) => {
  const children2 = [];
  const stopElements = options.stops.map(createGradientStop);
  children2.push(element("a:gsLst", void 0, stopElements));
  if (options.shade) children2.push(createShadeElement(options.shade));
  if (options.tileRectangle) children2.push(createRelativeRect("a:tileRect", options.tileRectangle));
  return element("a:gradFill", {
    flip: options.flip,
    rotWithShape: options.rotateWithShape
  }, children2);
};
var createPatternFill = (options) => {
  const children2 = [];
  if (options.foregroundColor) children2.push(element("a:fgClr", void 0, [createColorElement(options.foregroundColor)]));
  if (options.backgroundColor) children2.push(element("a:bgClr", void 0, [createColorElement(options.backgroundColor)]));
  return element("a:pattFill", { prst: xsdPattern.to(options.pattern) }, children2);
};
var createGroupFill = () => element("a:grpFill");
function stringifyLineEnd(tag, opts) {
  const parts = [];
  if (opts.type) parts.push(`type="${escapeXml(opts.type)}"`);
  if (opts.width) parts.push(`w="${escapeXml(xsdLineEndSize.to(opts.width))}"`);
  if (opts.length) parts.push(`len="${escapeXml(xsdLineEndSize.to(opts.length))}"`);
  return `<${tag}${parts.length ? " " + parts.join(" ") : ""}/>`;
}
function readLineEnd(el) {
  const result = {};
  if (el.attributes?.["type"]) result.type = String(el.attributes["type"]);
  if (el.attributes?.["w"]) result.width = xsdLineEndSize.from(String(el.attributes["w"]));
  if (el.attributes?.["len"]) result.length = xsdLineEndSize.from(String(el.attributes["len"]));
  return result;
}
function stringifyCustomDash(stops) {
  return `<a:custDash>${stops.map((s) => `<a:ds d="${escapeXml(s.d)}" sp="${escapeXml(s.sp)}"/>`).join("")}</a:custDash>`;
}
function stringifyLineProperties(tag, opts, ctx) {
  const parts = [];
  const attrParts = [];
  if (opts.width !== void 0) attrParts.push(`w="${convertToEmu(opts.width)}"`);
  if (opts.cap !== void 0) attrParts.push(`cap="${escapeXml(xsdLineCap.to(opts.cap))}"`);
  if (opts.compoundLine !== void 0) attrParts.push(`cmpd="${escapeXml(xsdCompoundLine.to(opts.compoundLine))}"`);
  if (opts.alignment !== void 0) attrParts.push(`algn="${escapeXml(xsdPenAlignment.to(opts.alignment))}"`);
  const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
  const resolvedColor = typeof opts.color === "string" ? { value: stripColorHashPrefix(opts.color) } : opts.color;
  const fillType = opts.type ?? (resolvedColor ? "solidFill" : void 0);
  if (fillType === "noFill") parts.push("<a:noFill/>");
  else if (fillType === "solidFill" && resolvedColor) {
    const fillXml = stringify$1(solidFillDesc, resolvedColor, ctx);
    if (fillXml) parts.push(fillXml);
  } else if (fillType === "gradFill" && opts.gradientFill) {
    const gradXml = stringify$1(gradientFillDesc, opts.gradientFill, ctx);
    if (gradXml) parts.push(gradXml);
  } else if (fillType === "pattFill" && opts.patternFill) {
    const pattXml = stringify$1(patternFillDesc, opts.patternFill, ctx);
    if (pattXml) parts.push(pattXml);
  }
  if (opts.customDash) parts.push(stringifyCustomDash(opts.customDash));
  else if (opts.dash) parts.push(`<a:prstDash val="${escapeXml(opts.dash)}"/>`);
  if (opts.join) {
    if (opts.join === "miter" && opts.miterLimit !== void 0) parts.push(`<a:miter lim="${opts.miterLimit}"/>`);
    else parts.push(`<a:${opts.join}/>`);
  }
  if (opts.headEnd) parts.push(stringifyLineEnd("a:headEnd", opts.headEnd));
  if (opts.tailEnd) parts.push(stringifyLineEnd("a:tailEnd", opts.tailEnd));
  if (opts.ext !== void 0) parts.push(`<a:extLst>${opts.ext}</a:extLst>`);
  if (parts.length === 0 && !attrStr) return `<${tag}/>`;
  if (parts.length === 0) return `<${tag}${attrStr}/>`;
  return `<${tag}${attrStr}>${parts.join("")}</${tag}>`;
}
var outlineDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    return stringifyLineProperties("a:ln", opts, ctx);
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes) {
      if (el.attributes["w"] !== void 0) result.width = Number(el.attributes["w"]);
      if (el.attributes["cap"] !== void 0) result.cap = xsdLineCap.from(String(el.attributes["cap"]));
      if (el.attributes["cmpd"] !== void 0) result.compoundLine = xsdCompoundLine.from(String(el.attributes["cmpd"]));
      if (el.attributes["algn"] !== void 0) result.alignment = xsdPenAlignment.from(String(el.attributes["algn"]));
    }
    const solidFill = findChild(el, "a:solidFill");
    if (solidFill) {
      result.type = "solidFill";
      result.color = parse$1(solidFillDesc, solidFill, _ctx);
    }
    if (findChild(el, "a:noFill")) result.type = "noFill";
    const gradFill = findChild(el, "a:gradFill");
    if (gradFill) {
      result.type = "gradFill";
      result.gradientFill = parse$1(gradientFillDesc, gradFill, _ctx);
    }
    const pattFill = findChild(el, "a:pattFill");
    if (pattFill) {
      result.type = "pattFill";
      result.patternFill = parse$1(patternFillDesc, pattFill, _ctx);
    }
    const prstDash = findChild(el, "a:prstDash");
    if (prstDash?.attributes?.["val"]) result.dash = String(prstDash.attributes["val"]);
    const custDash = findChild(el, "a:custDash");
    if (custDash?.elements) result.customDash = custDash.elements.filter((c) => c.name === "a:ds").map((c) => ({
      d: String(c.attributes?.["d"] ?? ""),
      sp: String(c.attributes?.["sp"] ?? "")
    }));
    if (findChild(el, "a:round")) result.join = "round";
    else if (findChild(el, "a:bevel")) result.join = "bevel";
    else {
      const miter = findChild(el, "a:miter");
      if (miter) {
        result.join = "miter";
        if (miter.attributes?.["lim"]) result.miterLimit = Number(miter.attributes["lim"]);
      }
    }
    const headEnd = findChild(el, "a:headEnd");
    if (headEnd) result.headEnd = readLineEnd(headEnd);
    const tailEnd = findChild(el, "a:tailEnd");
    if (tailEnd) result.tailEnd = readLineEnd(tailEnd);
    const extLst = findChild(el, "a:extLst");
    if (extLst) result.ext = stringify(extLst);
    return result;
  }
};
var createFillOverlayEffect = (options) => {
  let fillElement;
  if (options.noFill) fillElement = createNoFill();
  else if (options.solidFill) fillElement = createSolidFill(options.solidFill);
  else if (options.gradientFill) fillElement = createGradientFill(options.gradientFill);
  else if (options.patternFill) fillElement = createPatternFill(options.patternFill);
  else if (options.groupFill) fillElement = createGroupFill();
  else fillElement = createSolidFill({ value: "000000" });
  return element("a:fillOverlay", { blend: xsdBlendMode.to(options.blend) }, [fillElement]);
};
var createGlowEffect = (options) => {
  const colorChild = createColorElement(options.color);
  if (options.radius === void 0) return element("a:glow", void 0, [colorChild]);
  return element("a:glow", { rad: convertToEmu(options.radius) }, [colorChild]);
};
var createInnerShadowEffect = (options) => {
  const colorChild = createColorElement(options.color);
  const attrs2 = {};
  if (options.blurRadius !== void 0) attrs2.blurRad = convertToEmu(options.blurRadius);
  if (options.distance !== void 0) attrs2.dist = convertToEmu(options.distance);
  if (options.direction !== void 0) attrs2.dir = Math.round(options.direction * 6e4);
  const hasAttributes = Object.keys(attrs2).length > 0;
  return element("a:innerShdw", hasAttributes ? attrs2 : void 0, [colorChild]);
};
var createOuterShadowEffect = (options) => {
  const attrs2 = {};
  if (options.blurRadius !== void 0) attrs2.blurRad = convertToEmu(options.blurRadius);
  if (options.distance !== void 0) attrs2.dist = convertToEmu(options.distance);
  if (options.direction !== void 0) attrs2.dir = Math.round(options.direction * 6e4);
  if (options.scaleX !== void 0) attrs2.sx = Math.round(options.scaleX * 1e3);
  if (options.scaleY !== void 0) attrs2.sy = Math.round(options.scaleY * 1e3);
  if (options.skewX !== void 0) attrs2.kx = Math.round(options.skewX * 6e4);
  if (options.skewY !== void 0) attrs2.ky = Math.round(options.skewY * 6e4);
  if (options.alignment !== void 0) attrs2.algn = xsdRectAlignment.to(options.alignment);
  if (options.rotWithShape === false) attrs2.rotWithShape = 0;
  return element("a:outerShdw", attrs2, [createColorElement(options.color)]);
};
var createPresetShadowEffect = (options) => {
  const attrs2 = { prst: xsdPresetShadow.to(options.preset) };
  if (options.distance !== void 0) attrs2.dist = convertToEmu(options.distance);
  if (options.direction !== void 0) attrs2.dir = Math.round(options.direction * 6e4);
  return element("a:prstShdw", attrs2, [createColorElement(options.color)]);
};
var createReflectionEffect = (options) => {
  if (!options) return "<a:reflection/>";
  const attrs2 = {};
  if (options.blurRadius !== void 0) attrs2.blurRad = convertToEmu(options.blurRadius);
  if (options.startAlpha !== void 0) attrs2.stA = Math.round(options.startAlpha * 1e3);
  if (options.startPosition !== void 0) attrs2.stPos = Math.round(options.startPosition * 1e3);
  if (options.endAlpha !== void 0) attrs2.endA = Math.round(options.endAlpha * 1e3);
  if (options.endPosition !== void 0) attrs2.endPos = Math.round(options.endPosition * 1e3);
  if (options.distance !== void 0) attrs2.dist = convertToEmu(options.distance);
  if (options.direction !== void 0) attrs2.dir = Math.round(options.direction * 6e4);
  if (options.fadeDirection !== void 0) attrs2.fadeDir = Math.round(options.fadeDirection * 6e4);
  if (options.scaleX !== void 0) attrs2.sx = Math.round(options.scaleX * 1e3);
  if (options.scaleY !== void 0) attrs2.sy = Math.round(options.scaleY * 1e3);
  if (options.skewX !== void 0) attrs2.kx = Math.round(options.skewX * 6e4);
  if (options.skewY !== void 0) attrs2.ky = Math.round(options.skewY * 6e4);
  if (options.alignment !== void 0) attrs2.algn = xsdRectAlignment.to(options.alignment);
  if (options.rotWithShape === false) attrs2.rotWithShape = 0;
  return element("a:reflection", attrs2);
};
var createSoftEdgeEffect = (rad) => `<a:softEdge rad="${convertToEmu(rad)}"/>`;
var createBlurEffect = (options) => {
  const attrs2 = {};
  if (options.radius !== void 0) attrs2.rad = options.radius;
  if (options.grow === false) attrs2.grow = 0;
  return Object.keys(attrs2).length > 0 ? element("a:blur", attrs2) : element("a:blur");
};
var appendCommonEffects = (options, children2) => {
  if (options.blur) children2.push(createBlurEffect(options.blur));
  if (options.fillOverlay) children2.push(createFillOverlayEffect(options.fillOverlay));
  if (options.glow) children2.push(createGlowEffect(options.glow));
  if (options.innerShadow) children2.push(createInnerShadowEffect(options.innerShadow));
  if (options.outerShadow) children2.push(createOuterShadowEffect(options.outerShadow));
  if (options.presetShadow) children2.push(createPresetShadowEffect(options.presetShadow));
  if (options.reflection) children2.push(createReflectionEffect(options.reflection === true ? void 0 : options.reflection));
  if (options.softEdge !== void 0) children2.push(createSoftEdgeEffect(options.softEdge));
};
var createAlphaBiLevelEffect = (options) => `<a:alphaBiLevel thresh="${options.threshold}"/>`;
var createAlphaCeilingEffect = () => "<a:alphaCeiling/>";
var createAlphaFloorEffect = () => "<a:alphaFloor/>";
var createAlphaInverseEffect = (options) => element("a:alphaInv", void 0, options?.color ? [createColorElement(options.color)] : void 0);
var createAlphaModulateFixedEffect = (options) => options?.amount === void 0 ? "<a:alphaModFix/>" : `<a:alphaModFix amt="${Math.round(options.amount * 1e3)}"/>`;
var createAlphaOutsetEffect = (options) => options?.radius === void 0 ? "<a:alphaOutset/>" : `<a:alphaOutset rad="${options.radius}"/>`;
var createAlphaReplaceEffect = (options) => `<a:alphaRepl a="${Math.round(options.alpha * 1e3)}"/>`;
var createBiLevelEffect = (thresh) => `<a:biLevel thresh="${Math.round(thresh * 1e3)}"/>`;
var createBlendEffect = (options) => element("a:blend", { blend: xsdBlendMode.to(options.blend) }, [createEffectContainer(options.container)]);
var createColorChangeEffect = (options) => {
  const children2 = [element("a:clrFrom", void 0, [createColorElement(options.from)]), element("a:clrTo", void 0, [createColorElement(options.to)])];
  if (options.useAlpha === false) return element("a:clrChange", { useA: 0 }, children2);
  return element("a:clrChange", void 0, children2);
};
var createColorReplaceEffect = (color) => element("a:clrRepl", void 0, [createColorElement(color)]);
var createDuotoneEffect = (options) => element("a:duotone", void 0, [createColorElement(options.color1), createColorElement(options.color2)]);
var createFillEffect = (options) => {
  let fillElement;
  if (options.noFill) fillElement = createNoFill();
  else if (options.solidFill) fillElement = createSolidFill(options.solidFill);
  else if (options.gradientFill) fillElement = createGradientFill(options.gradientFill);
  else if (options.patternFill) fillElement = createPatternFill(options.patternFill);
  else if (options.groupFill) fillElement = createGroupFill();
  else fillElement = createNoFill();
  return element("a:fill", void 0, [fillElement]);
};
var createGrayscaleEffect = () => "<a:grayscl/>";
var createHSLEffect = (options) => {
  const attrs2 = {};
  if (options?.hue !== void 0) attrs2.hue = Math.round(options.hue * 6e4);
  if (options?.saturation !== void 0) attrs2.sat = options.saturation;
  if (options?.luminance !== void 0) attrs2.lum = options.luminance;
  return element("a:hsl", Object.keys(attrs2).length > 0 ? attrs2 : void 0);
};
var createLuminanceEffect = (options) => {
  const attrs2 = {};
  if (options?.bright !== void 0) attrs2.bright = Math.round(options.bright * 1e3);
  if (options?.contrast !== void 0) attrs2.contrast = Math.round(options.contrast * 1e3);
  return element("a:lum", Object.keys(attrs2).length > 0 ? attrs2 : void 0);
};
var createTintEffect = (options) => {
  const attrs2 = {};
  if (options?.hue !== void 0) attrs2.hue = Math.round(options.hue * 6e4);
  if (options?.amount !== void 0) attrs2.amt = Math.round(options.amount * 1e3);
  return element("a:tint", Object.keys(attrs2).length > 0 ? attrs2 : void 0);
};
var createRelativeOffsetEffect = (options) => {
  const attrs2 = {};
  if (options?.translateX !== void 0) attrs2.tx = Math.round(options.translateX * 1e3);
  if (options?.translateY !== void 0) attrs2.ty = Math.round(options.translateY * 1e3);
  return element("a:relOff", Object.keys(attrs2).length > 0 ? attrs2 : void 0);
};
var createTransformEffect = (options) => {
  const attrs2 = {};
  if (options?.scaleX !== void 0) attrs2.sx = Math.round(options.scaleX * 1e3);
  if (options?.scaleY !== void 0) attrs2.sy = Math.round(options.scaleY * 1e3);
  if (options?.skewX !== void 0) attrs2.kx = Math.round(options.skewX * 6e4);
  if (options?.skewY !== void 0) attrs2.ky = Math.round(options.skewY * 6e4);
  if (options?.translateX !== void 0) attrs2.tx = options.translateX;
  if (options?.translateY !== void 0) attrs2.ty = options.translateY;
  return element("a:xfrm", Object.keys(attrs2).length > 0 ? attrs2 : void 0);
};
var createEffectReference = (options) => `<a:effect ref="${options.ref}"/>`;
var createEffectContainer = (options, elementName = "a:cont") => {
  const attrs2 = {};
  if (options.type) attrs2.type = xsdEffectContainer.to(options.type);
  if (options.name) attrs2.name = options.name;
  const children2 = [];
  appendCommonEffects(options, children2);
  if (options.containers) for (const nested of options.containers) children2.push(createEffectContainer(nested));
  if (options.effectRefs) for (const ref of options.effectRefs) children2.push(createEffectReference(ref));
  if (options.alphaBiLevel) children2.push(createAlphaBiLevelEffect(options.alphaBiLevel));
  if (options.alphaCeiling) children2.push(createAlphaCeilingEffect());
  if (options.alphaFloor) children2.push(createAlphaFloorEffect());
  if (options.alphaInverse) children2.push(createAlphaInverseEffect(options.alphaInverse));
  if (options.alphaModulate) children2.push(element("a:alphaMod", void 0, [createEffectContainer(options.alphaModulate)]));
  if (options.alphaModulateFixed) children2.push(createAlphaModulateFixedEffect(options.alphaModulateFixed));
  if (options.alphaOutset) children2.push(createAlphaOutsetEffect(options.alphaOutset));
  if (options.alphaReplace) children2.push(createAlphaReplaceEffect(options.alphaReplace));
  if (options.biLevel) children2.push(createBiLevelEffect(options.biLevel.threshold));
  if (options.blend) children2.push(createBlendEffect(options.blend));
  if (options.colorChange) children2.push(createColorChangeEffect(options.colorChange));
  if (options.colorReplace) children2.push(createColorReplaceEffect(options.colorReplace));
  if (options.duotone) children2.push(createDuotoneEffect(options.duotone));
  if (options.fill) children2.push(createFillEffect(options.fill));
  if (options.grayscale) children2.push(createGrayscaleEffect());
  if (options.hsl) children2.push(createHSLEffect(options.hsl));
  if (options.luminance) children2.push(createLuminanceEffect(options.luminance));
  if (options.tint) children2.push(createTintEffect(options.tint));
  if (options.relativeOffset) children2.push(createRelativeOffsetEffect(options.relativeOffset));
  if (options.transform) children2.push(createTransformEffect(options.transform));
  return element(elementName, Object.keys(attrs2).length > 0 ? attrs2 : void 0, children2.length > 0 ? children2 : void 0);
};
var createEffectDag = (options) => createEffectContainer(options, "a:effectDag");
var createSphereCoords = (coords) => {
  return `<a:rot lat="${Math.round(coords.lat * 6e4)}" lon="${Math.round(coords.lon * 6e4)}" rev="${Math.round(coords.rev * 6e4)}"/>`;
};
var createCamera = (options) => {
  const children2 = [];
  if (options.rotation) children2.push(createSphereCoords(options.rotation));
  return element("a:camera", {
    prst: options.preset,
    fov: options.fov !== void 0 ? Math.round(options.fov * 6e4) : void 0,
    zoom: options.zoom
  }, children2);
};
var createLightRig = (options) => {
  const children2 = [];
  if (options.rotation) children2.push(createSphereCoords(options.rotation));
  return element("a:lightRig", {
    rig: options.rig,
    dir: xsdLightRigDirection.to(options.direction)
  }, children2);
};
var createPoint3D = (name, point) => `<${name} x="${point.x}" y="${point.y}" z="${point.z}"/>`;
var createVector3D = (name, vector) => `<${name} dx="${vector.dx}" dy="${vector.dy}" dz="${vector.dz}"/>`;
var createBackdrop = (options) => element("a:backdrop", void 0, [
  createPoint3D("a:anchor", options.anchor),
  createVector3D("a:norm", options.normal),
  createVector3D("a:up", options.up),
  ...options.ext !== void 0 ? [`<a:extLst>${options.ext}</a:extLst>`] : []
]);
var createScene3D = (options) => {
  const children2 = [createCamera(options.camera), createLightRig(options.lightRig)];
  if (options.backdrop) children2.push(createBackdrop(options.backdrop));
  return element("a:scene3d", void 0, children2);
};
var createBevel = (options) => {
  if (!options) return `<a:bevelT/>`;
  const attrs2 = {};
  if (options.w !== void 0) attrs2.w = options.w;
  if (options.h !== void 0) attrs2.h = options.h;
  if (options.prst !== void 0) attrs2.prst = options.prst;
  return element("a:bevelT", attrs2);
};
var createBottomBevel = (options) => {
  if (!options) return `<a:bevelB/>`;
  const attrs2 = {};
  if (options.w !== void 0) attrs2.w = options.w;
  if (options.h !== void 0) attrs2.h = options.h;
  if (options.prst !== void 0) attrs2.prst = options.prst;
  return element("a:bevelB", attrs2);
};
var createShape3D = (options) => {
  const children2 = [];
  if (options.bevelT) children2.push(createBevel(options.bevelT));
  if (options.bevelB) children2.push(createBottomBevel(options.bevelB));
  if (options.extrusionColor) children2.push(element("a:extrusionClr", void 0, [createColorElement(options.extrusionColor)]));
  if (options.contourColor) children2.push(element("a:contourClr", void 0, [createColorElement(options.contourColor)]));
  const attrs2 = {};
  if (options.z !== void 0) attrs2.z = options.z;
  if (options.extrusionH !== void 0) attrs2.extrusionH = options.extrusionH;
  if (options.contourW !== void 0) attrs2.contourW = options.contourW;
  if (options.prstMaterial !== void 0) attrs2.prstMaterial = xsdMaterialType.to(options.prstMaterial);
  return element("a:sp3d", attrs2, children2);
};
var REGION_ELEMENTS = {
  tblBg: "a:tblBg",
  wholeTbl: "a:wholeTbl",
  band1H: "a:band1H",
  band2H: "a:band2H",
  band1V: "a:band1V",
  band2V: "a:band2V",
  lastCol: "a:lastCol",
  firstCol: "a:firstCol",
  lastRow: "a:lastRow",
  seCell: "a:seCell",
  swCell: "a:swCell",
  firstRow: "a:firstRow",
  neCell: "a:neCell",
  nwCell: "a:nwCell"
};
var ELEMENT_TO_REGION = Object.fromEntries(Object.entries(REGION_ELEMENTS).map(([region, name]) => [name, region]));
function stringifyEndpointConnection(tag, conn) {
  return `<a:${tag} id="${conn.id}" idx="${conn.index}"/>`;
}
function parseEndpointConnection(el) {
  const id = el.attributes?.["id"];
  const idx = el.attributes?.["idx"];
  if (id === void 0 || idx === void 0) return void 0;
  return {
    id: Number(id),
    index: Number(idx)
  };
}
var CREATION_ID_EXT_URI = "{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}";
function stringifyNonVisualDrawingProperties(tag, id, opts, fallbackName, innerXml) {
  const name = opts?.name ?? fallbackName;
  let attrs2 = `id="${id}" name="${escapeXml(name)}"`;
  if (opts?.description) attrs2 += ` descr="${escapeXml(opts.description)}"`;
  if (opts?.title) attrs2 += ` title="${escapeXml(opts.title)}"`;
  if (opts?.hidden) attrs2 += ` hidden="1"`;
  const A_NS2 = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
  const extLst = opts?.ext ? `<a:extLst ${A_NS2}>${opts.ext}</a:extLst>` : opts?.creationId ? `<a:extLst ${A_NS2}><a:ext uri="${CREATION_ID_EXT_URI}"><a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="${escapeXml(opts.creationId)}"/></a:ext></a:extLst>` : "";
  const content = (innerXml ?? "") + extLst;
  return content ? `<${tag} ${attrs2}>${content}</${tag}>` : `<${tag} ${attrs2}/>`;
}
function parseNonVisualDrawingProperties(el) {
  if (!el) return {};
  const result = {};
  if (el.attributes) {
    const a = el.attributes;
    if (a["name"] !== void 0) result.name = String(a["name"]);
    const descr = a["descr"];
    if (descr !== void 0 && descr !== "") result.description = String(descr);
    const title = a["title"];
    if (title !== void 0 && title !== "") result.title = String(title);
    const hidden = a["hidden"];
    if (hidden !== void 0) result.hidden = parseOnOff(hidden) ?? false;
  }
  const extLst = findChild(el, "a:extLst");
  if (extLst) {
    if ((extLst.elements ?? []).some((ext) => ext.name === "a:ext" && !extUriMatches(attr(ext, "uri"), CREATION_ID_EXT_URI))) {
      const inner = (extLst.elements ?? []).map((e) => stringifyElement(e)).join("");
      if (inner) result.ext = inner;
    } else for (const ext of extLst.elements ?? []) {
      if (ext.name !== "a:ext" || !extUriMatches(attr(ext, "uri"), CREATION_ID_EXT_URI)) continue;
      const creationId = findChild(ext, "a16:creationId");
      const id = creationId ? attr(creationId, "id") : void 0;
      if (id) result.creationId = id;
    }
  }
  return result;
}
function pickNonVisualDrawingProperties(opts) {
  if (!opts) return {};
  const picked = {};
  if (opts.name !== void 0) picked.name = opts.name;
  if (opts.description !== void 0) picked.description = opts.description;
  if (opts.title !== void 0) picked.title = opts.title;
  if (opts.hidden !== void 0) picked.hidden = opts.hidden;
  if (opts.creationId !== void 0) picked.creationId = opts.creationId;
  if (opts.ext !== void 0) picked.ext = opts.ext;
  return picked;
}
function stringifyEffectColor(color, ctx) {
  if (!color) return void 0;
  return stringifyColorChoice(color, ctx);
}
function stringifyColorEffect(tag, attrs2, color, ctx) {
  const attrParts = [];
  for (const [key, val] of Object.entries(attrs2)) if (val !== void 0) attrParts.push(`${key}="${escapeXml(String(val))}"`);
  const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
  const colorXml = stringifyEffectColor(color, ctx);
  if (!colorXml && !attrStr) return void 0;
  if (!colorXml) return `<${tag}${attrStr}/>`;
  return `<${tag}${attrStr}>${colorXml}</${tag}>`;
}
function readColorFromElement(el, ctx) {
  const color = parseColorChoice(el, ctx);
  if (!color || Object.keys(color).length === 0) return void 0;
  return color;
}
var effectListDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.blur) {
      const attrParts = [];
      if (opts.blur.radius !== void 0) attrParts.push(`rad="${opts.blur.radius}"`);
      if (opts.blur.grow === false) attrParts.push('grow="0"');
      const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
      parts.push(`<a:blur${attrStr}/>`);
    }
    if (opts.fillOverlay) parts.push(createFillOverlayEffect(opts.fillOverlay));
    if (opts.glow) parts.push(stringifyColorEffect("a:glow", { rad: mapOptional(opts.glow.radius, convertToEmu) }, opts.glow.color, ctx) ?? "");
    if (opts.innerShadow) parts.push(stringifyColorEffect("a:innerShdw", {
      blurRad: mapOptional(opts.innerShadow.blurRadius, convertToEmu),
      dist: mapOptional(opts.innerShadow.distance, convertToEmu),
      dir: opts.innerShadow.direction !== void 0 ? emitAngle(opts.innerShadow.direction) : void 0
    }, opts.innerShadow.color, ctx) ?? "");
    if (opts.outerShadow) parts.push(stringifyColorEffect("a:outerShdw", {
      blurRad: mapOptional(opts.outerShadow.blurRadius, convertToEmu),
      dist: mapOptional(opts.outerShadow.distance, convertToEmu),
      dir: opts.outerShadow.direction !== void 0 ? emitAngle(opts.outerShadow.direction) : void 0,
      sx: opts.outerShadow.scaleX !== void 0 ? emitPercent(opts.outerShadow.scaleX) : void 0,
      sy: opts.outerShadow.scaleY !== void 0 ? emitPercent(opts.outerShadow.scaleY) : void 0,
      kx: opts.outerShadow.skewX !== void 0 ? emitAngle(opts.outerShadow.skewX) : void 0,
      ky: opts.outerShadow.skewY !== void 0 ? emitAngle(opts.outerShadow.skewY) : void 0,
      algn: opts.outerShadow.alignment !== void 0 ? xsdRectAlignment.to(opts.outerShadow.alignment) : void 0,
      rotWithShape: opts.outerShadow.rotWithShape === false ? 0 : void 0
    }, opts.outerShadow.color, ctx) ?? "");
    if (opts.presetShadow) parts.push(stringifyColorEffect("a:prstShdw", {
      prst: xsdPresetShadow.to(opts.presetShadow.preset),
      dist: mapOptional(opts.presetShadow.distance, convertToEmu),
      dir: opts.presetShadow.direction !== void 0 ? emitAngle(opts.presetShadow.direction) : void 0
    }, opts.presetShadow.color, ctx) ?? "");
    if (opts.reflection) {
      const refOpts = opts.reflection === true ? {} : opts.reflection;
      const attrParts = [];
      if (refOpts.blurRadius !== void 0) attrParts.push(`blurRad="${convertToEmu(refOpts.blurRadius)}"`);
      if (refOpts.startAlpha !== void 0) attrParts.push(`stA="${emitPercent(refOpts.startAlpha)}"`);
      if (refOpts.startPosition !== void 0) attrParts.push(`stPos="${emitPercent(refOpts.startPosition)}"`);
      if (refOpts.endAlpha !== void 0) attrParts.push(`endA="${emitPercent(refOpts.endAlpha)}"`);
      if (refOpts.endPosition !== void 0) attrParts.push(`endPos="${emitPercent(refOpts.endPosition)}"`);
      if (refOpts.distance !== void 0) attrParts.push(`dist="${convertToEmu(refOpts.distance)}"`);
      if (refOpts.direction !== void 0) attrParts.push(`dir="${emitAngle(refOpts.direction)}"`);
      if (refOpts.fadeDirection !== void 0) attrParts.push(`fadeDir="${emitAngle(refOpts.fadeDirection)}"`);
      if (refOpts.scaleX !== void 0) attrParts.push(`sx="${emitPercent(refOpts.scaleX)}"`);
      if (refOpts.scaleY !== void 0) attrParts.push(`sy="${emitPercent(refOpts.scaleY)}"`);
      if (refOpts.skewX !== void 0) attrParts.push(`kx="${emitAngle(refOpts.skewX)}"`);
      if (refOpts.skewY !== void 0) attrParts.push(`ky="${emitAngle(refOpts.skewY)}"`);
      if (refOpts.alignment !== void 0) attrParts.push(`algn="${escapeXml(xsdRectAlignment.to(refOpts.alignment))}"`);
      if (refOpts.rotWithShape !== void 0) attrParts.push(`rotWithShape="${refOpts.rotWithShape ? 1 : 0}"`);
      const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
      parts.push(`<a:reflection${attrStr}/>`);
    }
    if (opts.softEdge !== void 0) parts.push(`<a:softEdge rad="${convertToEmu(opts.softEdge)}"/>`);
    const content = parts.filter(Boolean).join("");
    if (!content) return "<a:effectLst/>";
    return `<a:effectLst>${content}</a:effectLst>`;
  },
  parse(el, ctx) {
    const result = {};
    const blur = findChild(el, "a:blur");
    if (blur) {
      const blurOpts = {};
      if (blur.attributes?.["rad"] !== void 0) blurOpts.radius = Number(blur.attributes["rad"]);
      if (blur.attributes?.["grow"] !== void 0) blurOpts.grow = parseOnOff(blur.attributes["grow"]) ?? true;
      result.blur = blurOpts;
    }
    const glow = findChild(el, "a:glow");
    if (glow) {
      const glowOpts = {};
      if (glow.attributes?.["rad"] !== void 0) glowOpts.radius = Number(glow.attributes["rad"]);
      const color = readColorFromElement(glow, ctx);
      if (color) glowOpts.color = color;
      result.glow = glowOpts;
    }
    const innerShdw = findChild(el, "a:innerShdw");
    if (innerShdw) {
      const innerOpts = {};
      if (innerShdw.attributes?.["blurRad"] !== void 0) innerOpts.blurRadius = Number(innerShdw.attributes["blurRad"]);
      if (innerShdw.attributes?.["dist"] !== void 0) innerOpts.distance = Number(innerShdw.attributes["dist"]);
      if (innerShdw.attributes?.["dir"] !== void 0) innerOpts.direction = parseAngle(Number(innerShdw.attributes["dir"]));
      const color = readColorFromElement(innerShdw, ctx);
      if (color) innerOpts.color = color;
      result.innerShadow = innerOpts;
    }
    const outerShdw = findChild(el, "a:outerShdw");
    if (outerShdw) {
      const outerOpts = {};
      if (outerShdw.attributes?.["blurRad"] !== void 0) outerOpts.blurRadius = Number(outerShdw.attributes["blurRad"]);
      if (outerShdw.attributes?.["dist"] !== void 0) outerOpts.distance = Number(outerShdw.attributes["dist"]);
      if (outerShdw.attributes?.["dir"] !== void 0) outerOpts.direction = parseAngle(Number(outerShdw.attributes["dir"]));
      if (outerShdw.attributes?.["sx"] !== void 0) outerOpts.scaleX = parsePercentAttr(outerShdw.attributes["sx"]);
      if (outerShdw.attributes?.["sy"] !== void 0) outerOpts.scaleY = parsePercentAttr(outerShdw.attributes["sy"]);
      if (outerShdw.attributes?.["kx"] !== void 0) outerOpts.skewX = parseAngle(Number(outerShdw.attributes["kx"]));
      if (outerShdw.attributes?.["ky"] !== void 0) outerOpts.skewY = parseAngle(Number(outerShdw.attributes["ky"]));
      if (outerShdw.attributes?.["algn"] !== void 0) outerOpts.alignment = xsdRectAlignment.from(String(outerShdw.attributes["algn"]));
      if (outerShdw.attributes?.["rotWithShape"] !== void 0) outerOpts.rotWithShape = parseOnOff(outerShdw.attributes["rotWithShape"]) ?? true;
      const color = readColorFromElement(outerShdw, ctx);
      if (color) outerOpts.color = color;
      result.outerShadow = outerOpts;
    }
    const fillOverlay = findChild(el, "a:fillOverlay");
    if (fillOverlay) {
      const overlayOpts = {};
      if (fillOverlay.attributes?.["blend"] !== void 0) overlayOpts.blend = xsdBlendMode.from(String(fillOverlay.attributes["blend"]));
      const foSolid = findChild(fillOverlay, "a:solidFill");
      if (foSolid) overlayOpts.solidFill = parse$1(solidFillDesc, foSolid, ctx);
      const foGrad = findChild(fillOverlay, "a:gradFill");
      if (foGrad) overlayOpts.gradientFill = parse$1(gradientFillDesc, foGrad, ctx);
      const foPatt = findChild(fillOverlay, "a:pattFill");
      if (foPatt) overlayOpts.patternFill = parse$1(patternFillDesc, foPatt, ctx);
      if (findChild(fillOverlay, "a:noFill")) overlayOpts.noFill = true;
      if (findChild(fillOverlay, "a:grpFill")) overlayOpts.groupFill = true;
      result.fillOverlay = overlayOpts;
    }
    const prstShdw = findChild(el, "a:prstShdw");
    if (prstShdw) {
      const prstOpts = {};
      if (prstShdw.attributes?.["prst"] !== void 0) prstOpts.preset = xsdPresetShadow.from(String(prstShdw.attributes["prst"]));
      if (prstShdw.attributes?.["dist"] !== void 0) prstOpts.distance = Number(prstShdw.attributes["dist"]);
      if (prstShdw.attributes?.["dir"] !== void 0) prstOpts.direction = parseAngle(Number(prstShdw.attributes["dir"]));
      const color = readColorFromElement(prstShdw, ctx);
      if (color) prstOpts.color = color;
      result.presetShadow = prstOpts;
    }
    const reflection = findChild(el, "a:reflection");
    if (reflection) {
      const refOpts = {};
      if (reflection.attributes?.["blurRad"] !== void 0) refOpts.blurRadius = Number(reflection.attributes["blurRad"]);
      if (reflection.attributes?.["stA"] !== void 0) refOpts.startAlpha = parsePercentAttr(reflection.attributes["stA"]);
      if (reflection.attributes?.["stPos"] !== void 0) refOpts.startPosition = parsePercentAttr(reflection.attributes["stPos"]);
      if (reflection.attributes?.["endA"] !== void 0) refOpts.endAlpha = parsePercentAttr(reflection.attributes["endA"]);
      if (reflection.attributes?.["endPos"] !== void 0) refOpts.endPosition = parsePercentAttr(reflection.attributes["endPos"]);
      if (reflection.attributes?.["dist"] !== void 0) refOpts.distance = Number(reflection.attributes["dist"]);
      if (reflection.attributes?.["dir"] !== void 0) refOpts.direction = parseAngle(Number(reflection.attributes["dir"]));
      if (reflection.attributes?.["fadeDir"] !== void 0) refOpts.fadeDirection = parseAngle(Number(reflection.attributes["fadeDir"]));
      if (reflection.attributes?.["sx"] !== void 0) refOpts.scaleX = parsePercentAttr(reflection.attributes["sx"]);
      if (reflection.attributes?.["sy"] !== void 0) refOpts.scaleY = parsePercentAttr(reflection.attributes["sy"]);
      if (reflection.attributes?.["kx"] !== void 0) refOpts.skewX = parseAngle(Number(reflection.attributes["kx"]));
      if (reflection.attributes?.["ky"] !== void 0) refOpts.skewY = parseAngle(Number(reflection.attributes["ky"]));
      if (reflection.attributes?.["algn"] !== void 0) refOpts.alignment = xsdRectAlignment.from(String(reflection.attributes["algn"]));
      if (reflection.attributes?.["rotWithShape"] !== void 0) refOpts.rotWithShape = parseOnOff(reflection.attributes["rotWithShape"]) ?? true;
      result.reflection = refOpts;
    }
    const softEdge = findChild(el, "a:softEdge");
    if (softEdge?.attributes?.["rad"] !== void 0) result.softEdge = Number(softEdge.attributes["rad"]);
    return result;
  }
};
var BASE_LOCKING_KEYS = [
  "noGrp",
  "noSelect",
  "noRot",
  "noChangeAspect",
  "noMove",
  "noResize",
  "noEditPoints",
  "noAdjustHandles",
  "noChangeArrowheads",
  "noChangeShapeType"
];
var SHAPE_EXTRA_KEYS = ["noTextEdit"];
var PICTURE_EXTRA_KEYS = ["noCrop"];
var GROUP_EXTRA_KEYS = ["noUngrp"];
var FRAME_EXTRA_KEYS = ["noDrilldown"];
function stringifyLockingAttrs(opts, keys) {
  const parts = [];
  for (const key of keys) if (opts[key] !== void 0) parts.push(`${key}="${opts[key] ? 1 : 0}"`);
  return parts.length ? " " + parts.join(" ") : "";
}
function readLockingAttrs(el, keys) {
  const result = {};
  if (!el.attributes) return result;
  for (const key of keys) {
    const val = el.attributes[key];
    if (val !== void 0) result[key] = parseOnOff(val) ?? false;
  }
  return result;
}
function createLockingDesc(tag, extraKeys = []) {
  const allKeys = [...BASE_LOCKING_KEYS, ...extraKeys];
  return {
    kind: "custom",
    stringify(opts, _ctx) {
      const attrStr = stringifyLockingAttrs(opts, allKeys);
      if (!attrStr) return `<${tag}/>`;
      return `<${tag}${attrStr}/>`;
    },
    parse(el, _ctx) {
      return readLockingAttrs(el, allKeys);
    }
  };
}
var shapeLockingDesc = createLockingDesc("a:spLocks", SHAPE_EXTRA_KEYS);
var pictureLockingDesc = createLockingDesc("a:picLocks", PICTURE_EXTRA_KEYS);
var groupLockingDesc = createLockingDesc("a:grpSpLocks", GROUP_EXTRA_KEYS);
var graphicFrameLockingDesc = createLockingDesc("a:graphicFrameLocks", FRAME_EXTRA_KEYS);
var connectorLockingDesc = createLockingDesc("a:cxnSpLocks");
var adjustmentValuesDesc = {
  kind: "custom",
  stringify(guides, _ctx) {
    return stringifyGuideList("a:avLst", guides ?? []);
  },
  parse(el, _ctx) {
    return readGuideList(el);
  }
};
var presetGeometryDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const prst = opts.preset ?? "rect";
    let avXml = "";
    if (opts.adjustmentValues) avXml = stringify$1(adjustmentValuesDesc, opts.adjustmentValues, ctx) ?? "<a:avLst/>";
    else avXml = "<a:avLst/>";
    return `<a:prstGeom prst="${escapeXml(prst)}">${avXml}</a:prstGeom>`;
  },
  parse(el, ctx) {
    const result = {};
    if (el.attributes?.["prst"] !== void 0) result.preset = String(el.attributes["prst"]);
    const avLst = findChild(el, "a:avLst");
    if (avLst) {
      const guides = parse$1(adjustmentValuesDesc, avLst, ctx);
      if (guides.length > 0) result.adjustmentValues = guides;
    }
    return result;
  }
};
function stringifyAdjustPoint(pt) {
  return `<a:pt x="${escapeXml(pt.x)}" y="${escapeXml(pt.y)}"/>`;
}
function stringifyPathCommand(cmd) {
  switch (cmd.command) {
    case "moveTo":
      return `<a:moveTo>${stringifyAdjustPoint(cmd.point)}</a:moveTo>`;
    case "lineTo":
      return `<a:lnTo>${stringifyAdjustPoint(cmd.point)}</a:lnTo>`;
    case "arcTo":
      return `<a:arcTo wR="${escapeXml(cmd.widthRadius)}" hR="${escapeXml(cmd.heightRadius)}" stAng="${escapeXml(cmd.startAngle)}" swAng="${escapeXml(cmd.sweepAngle)}"/>`;
    case "quadBezTo":
      return `<a:quadBezTo>${cmd.points.map(stringifyAdjustPoint).join("")}</a:quadBezTo>`;
    case "cubicBezTo":
      return `<a:cubicBezTo>${cmd.points.map(stringifyAdjustPoint).join("")}</a:cubicBezTo>`;
    case "close":
      return "<a:close/>";
  }
}
function stringifyPath(path) {
  const attrs2 = [];
  if (path.w !== void 0) attrs2.push(`w="${path.w}"`);
  if (path.h !== void 0) attrs2.push(`h="${path.h}"`);
  if (path.fill !== void 0) attrs2.push(`fill="${escapeXml(path.fill)}"`);
  if (path.stroke !== void 0) attrs2.push(`stroke="${path.stroke}"`);
  if (path.extrusionOk !== void 0) attrs2.push(`extrusionOk="${path.extrusionOk}"`);
  const attrStr = attrs2.length ? " " + attrs2.join(" ") : "";
  const cmds = path.commands.map(stringifyPathCommand).join("");
  if (!cmds && !attrStr) return "<a:path/>";
  return `<a:path${attrStr}>${cmds}</a:path>`;
}
function readAdjustPoint(el) {
  if (!el.attributes) return void 0;
  const x = el.attributes["x"];
  const y = el.attributes["y"];
  if (x === void 0 || y === void 0) return void 0;
  return {
    x: String(x),
    y: String(y)
  };
}
function readPathCommand(tag, el) {
  switch (tag) {
    case "a:moveTo": {
      const pt = el.elements?.find((c) => c.name === "a:pt");
      if (!pt) return void 0;
      const point = readAdjustPoint(pt);
      if (!point) return void 0;
      return {
        command: "moveTo",
        point
      };
    }
    case "a:lnTo": {
      const pt = el.elements?.find((c) => c.name === "a:pt");
      if (!pt) return void 0;
      const point = readAdjustPoint(pt);
      if (!point) return void 0;
      return {
        command: "lineTo",
        point
      };
    }
    case "a:arcTo": {
      const a = el.attributes;
      if (!a) return void 0;
      return {
        command: "arcTo",
        widthRadius: String(a["wR"] ?? ""),
        heightRadius: String(a["hR"] ?? ""),
        startAngle: String(a["stAng"] ?? ""),
        sweepAngle: String(a["swAng"] ?? "")
      };
    }
    case "a:quadBezTo": {
      const [p0, p1] = (el.elements ?? []).filter((c) => c.name === "a:pt").map(readAdjustPoint).filter((p) => p !== void 0);
      if (!p0 || !p1) return void 0;
      return {
        command: "quadBezTo",
        points: [p0, p1]
      };
    }
    case "a:cubicBezTo": {
      const [p0, p1, p2] = (el.elements ?? []).filter((c) => c.name === "a:pt").map(readAdjustPoint).filter((p) => p !== void 0);
      if (!p0 || !p1 || !p2) return void 0;
      return {
        command: "cubicBezTo",
        points: [
          p0,
          p1,
          p2
        ]
      };
    }
    case "a:close":
      return { command: "close" };
    default:
      return;
  }
}
function readPath(el) {
  const result = {};
  if (el.attributes) {
    if (el.attributes["w"] !== void 0) result.w = Number(el.attributes["w"]);
    if (el.attributes["h"] !== void 0) result.h = Number(el.attributes["h"]);
    if (el.attributes["fill"] !== void 0) result.fill = String(el.attributes["fill"]);
    if (el.attributes["stroke"] !== void 0) result.stroke = parseOnOff(el.attributes["stroke"]) ?? true;
    if (el.attributes["extrusionOk"] !== void 0) result.extrusionOk = parseOnOff(el.attributes["extrusionOk"]) ?? true;
  }
  const commands = [];
  if (el.elements) {
    for (const child of el.elements) if (child.name) {
      const cmd = readPathCommand(child.name, child);
      if (cmd) commands.push(cmd);
    }
  }
  if (commands.length > 0) result.commands = commands;
  return result;
}
function stringifyGuideList(tag, guides) {
  if (!guides || guides.length === 0) return `<${tag}/>`;
  return `<${tag}>${guides.map((g) => `<a:gd name="${escapeXml(g.name)}" fmla="${escapeXml(g.formula)}"/>`).join("")}</${tag}>`;
}
function readGuideList(el) {
  const result = [];
  if (el.elements) {
    for (const child of el.elements) if (child.name === "a:gd" && child.attributes) {
      const name = child.attributes["name"];
      const fmla = child.attributes["fmla"];
      if (name !== void 0 && fmla !== void 0) result.push({
        name: String(name),
        formula: String(fmla)
      });
    }
  }
  return result;
}
function stringifyAdjustHandlePos(pos) {
  return `<a:pos x="${escapeXml(pos.x)}" y="${escapeXml(pos.y)}"/>`;
}
function stringifyXYAdjustHandle(h) {
  const attrs2 = [];
  if (h.guideRefX !== void 0) attrs2.push(`gdRefX="${escapeXml(h.guideRefX)}"`);
  if (h.minX !== void 0) attrs2.push(`minX="${escapeXml(h.minX)}"`);
  if (h.maxX !== void 0) attrs2.push(`maxX="${escapeXml(h.maxX)}"`);
  if (h.guideRefY !== void 0) attrs2.push(`gdRefY="${escapeXml(h.guideRefY)}"`);
  if (h.minY !== void 0) attrs2.push(`minY="${escapeXml(h.minY)}"`);
  if (h.maxY !== void 0) attrs2.push(`maxY="${escapeXml(h.maxY)}"`);
  return `<a:ahXY${attrs2.length ? " " + attrs2.join(" ") : ""}>${stringifyAdjustHandlePos(h.position)}</a:ahXY>`;
}
function stringifyPolarAdjustHandle(h) {
  const attrs2 = [];
  if (h.guideRefRadius !== void 0) attrs2.push(`gdRefR="${escapeXml(h.guideRefRadius)}"`);
  if (h.minRadius !== void 0) attrs2.push(`minR="${escapeXml(h.minRadius)}"`);
  if (h.maxRadius !== void 0) attrs2.push(`maxR="${escapeXml(h.maxRadius)}"`);
  if (h.guideRefAngle !== void 0) attrs2.push(`gdRefAng="${escapeXml(h.guideRefAngle)}"`);
  if (h.minAngle !== void 0) attrs2.push(`minAng="${escapeXml(h.minAngle)}"`);
  if (h.maxAngle !== void 0) attrs2.push(`maxAng="${escapeXml(h.maxAngle)}"`);
  return `<a:ahPolar${attrs2.length ? " " + attrs2.join(" ") : ""}>${stringifyAdjustHandlePos(h.position)}</a:ahPolar>`;
}
function stringifyAdjustHandle(h) {
  return h.type === "xy" ? stringifyXYAdjustHandle(h) : stringifyPolarAdjustHandle(h);
}
function readAdjustHandlePos(el) {
  const pos = el.elements?.find((c) => c.name === "a:pos");
  if (!pos?.attributes) return void 0;
  const x = pos.attributes["x"];
  const y = pos.attributes["y"];
  if (x === void 0 || y === void 0) return void 0;
  return {
    x: String(x),
    y: String(y)
  };
}
function readXYAdjustHandle(el) {
  const position = readAdjustHandlePos(el);
  if (!position) return void 0;
  const result = {
    type: "xy",
    position
  };
  if (el.attributes?.["gdRefX"] !== void 0) result.guideRefX = String(el.attributes["gdRefX"]);
  if (el.attributes?.["minX"] !== void 0) result.minX = String(el.attributes["minX"]);
  if (el.attributes?.["maxX"] !== void 0) result.maxX = String(el.attributes["maxX"]);
  if (el.attributes?.["gdRefY"] !== void 0) result.guideRefY = String(el.attributes["gdRefY"]);
  if (el.attributes?.["minY"] !== void 0) result.minY = String(el.attributes["minY"]);
  if (el.attributes?.["maxY"] !== void 0) result.maxY = String(el.attributes["maxY"]);
  return result;
}
function readPolarAdjustHandle(el) {
  const position = readAdjustHandlePos(el);
  if (!position) return void 0;
  const result = {
    type: "polar",
    position
  };
  if (el.attributes?.["gdRefR"] !== void 0) result.guideRefRadius = String(el.attributes["gdRefR"]);
  if (el.attributes?.["minR"] !== void 0) result.minRadius = String(el.attributes["minR"]);
  if (el.attributes?.["maxR"] !== void 0) result.maxRadius = String(el.attributes["maxR"]);
  if (el.attributes?.["gdRefAng"] !== void 0) result.guideRefAngle = String(el.attributes["gdRefAng"]);
  if (el.attributes?.["minAng"] !== void 0) result.minAngle = String(el.attributes["minAng"]);
  if (el.attributes?.["maxAng"] !== void 0) result.maxAngle = String(el.attributes["maxAng"]);
  return result;
}
function stringifyConnectionSite(site) {
  return `<a:cxn ang="${escapeXml(site.angle)}">${stringifyAdjustHandlePos(site.position)}</a:cxn>`;
}
function readConnectionSite(el) {
  const ang = el.attributes?.["ang"];
  if (ang === void 0) return void 0;
  const position = readAdjustHandlePos(el);
  if (!position) return void 0;
  return {
    angle: String(ang),
    position
  };
}
function stringifyGeomRect(rect) {
  return `<a:rect l="${escapeXml(rect.left)}" t="${escapeXml(rect.top)}" r="${escapeXml(rect.right)}" b="${escapeXml(rect.bottom)}"/>`;
}
function readGeomRect(el) {
  const a = el.attributes;
  if (!a) return void 0;
  const l = a["l"];
  const t = a["t"];
  const r = a["r"];
  const b = a["b"];
  if (l === void 0 || t === void 0 || r === void 0 || b === void 0) return void 0;
  return {
    left: String(l),
    top: String(t),
    right: String(r),
    bottom: String(b)
  };
}
var customGeometryDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const parts = [];
    if (opts.adjustmentValues && opts.adjustmentValues.length > 0) parts.push(stringifyGuideList("a:avLst", opts.adjustmentValues));
    else parts.push("<a:avLst/>");
    if (opts.guides && opts.guides.length > 0) parts.push(stringifyGuideList("a:gdLst", opts.guides));
    if (opts.adjustHandles) {
      const inner = opts.adjustHandles.map(stringifyAdjustHandle).join("");
      parts.push(inner ? `<a:ahLst>${inner}</a:ahLst>` : "<a:ahLst/>");
    }
    if (opts.connectionSites && opts.connectionSites.length > 0) {
      const inner = opts.connectionSites.map(stringifyConnectionSite).join("");
      parts.push(`<a:cxnLst>${inner}</a:cxnLst>`);
    }
    if (opts.textRectangle) parts.push(stringifyGeomRect(opts.textRectangle));
    const pathsXml = (opts.pathList ?? []).map(stringifyPath).join("");
    parts.push(`<a:pathLst>${pathsXml}</a:pathLst>`);
    return `<a:custGeom>${parts.join("")}</a:custGeom>`;
  },
  parse(el, _ctx) {
    const result = {};
    const avLst = findChild(el, "a:avLst");
    if (avLst) {
      const guides = readGuideList(avLst);
      if (guides.length > 0) result.adjustmentValues = guides;
    }
    const gdLst = findChild(el, "a:gdLst");
    if (gdLst) {
      const guides = readGuideList(gdLst);
      if (guides.length > 0) result.guides = guides;
    }
    const ahLst = findChild(el, "a:ahLst");
    if (ahLst) {
      const handles = [];
      for (const child of ahLst.elements ?? []) if (child.name === "a:ahXY") {
        const h = readXYAdjustHandle(child);
        if (h) handles.push(h);
      } else if (child.name === "a:ahPolar") {
        const h = readPolarAdjustHandle(child);
        if (h) handles.push(h);
      }
      result.adjustHandles = handles;
    }
    const cxnLst = findChild(el, "a:cxnLst");
    if (cxnLst?.elements) {
      const sites = [];
      for (const child of cxnLst.elements) if (child.name === "a:cxn") {
        const site = readConnectionSite(child);
        if (site) sites.push(site);
      }
      if (sites.length > 0) result.connectionSites = sites;
    }
    const rect = findChild(el, "a:rect");
    if (rect) {
      const textRectangle = readGeomRect(rect);
      if (textRectangle) result.textRectangle = textRectangle;
    }
    const pathLst = findChild(el, "a:pathLst");
    if (pathLst) {
      const paths = [];
      for (const child of pathLst.elements ?? []) if (child.name === "a:path") {
        const p = readPath(child);
        if (p.commands && p.commands.length > 0) paths.push(p);
      }
      result.pathList = paths;
    }
    return result;
  }
};
var transform2DDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const parts = [];
    const attrParts = [];
    if (opts.flipHorizontal !== void 0) attrParts.push(`flipH="${opts.flipHorizontal ? 1 : 0}"`);
    if (opts.flipVertical !== void 0) attrParts.push(`flipV="${opts.flipVertical ? 1 : 0}"`);
    if (opts.rotation !== void 0) attrParts.push(`rot="${emitAngle(opts.rotation)}"`);
    const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
    if (opts.x !== void 0 || opts.y !== void 0) {
      const x = opts.x !== void 0 ? convertToEmu(opts.x) : 0;
      const y = opts.y !== void 0 ? convertToEmu(opts.y) : 0;
      parts.push(`<a:off x="${x}" y="${y}"/>`);
    }
    if (opts.width !== void 0 || opts.height !== void 0) {
      const cx = opts.width !== void 0 ? convertToEmu(opts.width) : 0;
      const cy = opts.height !== void 0 ? convertToEmu(opts.height) : 0;
      parts.push(`<a:ext cx="${cx}" cy="${cy}"/>`);
    }
    if (parts.length === 0 && !attrStr) return void 0;
    if (parts.length === 0) return `<a:xfrm${attrStr}/>`;
    return `<a:xfrm${attrStr}>${parts.join("")}</a:xfrm>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (el.attributes) {
      if (el.attributes["flipH"] !== void 0) result.flipHorizontal = parseOnOff(el.attributes["flipH"]) ?? false;
      if (el.attributes["flipV"] !== void 0) result.flipVertical = parseOnOff(el.attributes["flipV"]) ?? false;
      if (el.attributes["rot"] !== void 0) result.rotation = parseAngle(Number(el.attributes["rot"]));
    }
    const off = findChild(el, "a:off");
    if (off?.attributes) {
      result.x = attrMeasure(off, "x") ?? 0;
      result.y = attrMeasure(off, "y") ?? 0;
    }
    const ext = findChild(el, "a:ext");
    if (ext?.attributes) {
      result.width = attrMeasure(ext, "cx") ?? 0;
      result.height = attrMeasure(ext, "cy") ?? 0;
    }
    return result;
  }
};
var groupTransform2DDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const base = transform2DDesc.stringify(opts, ctx) ?? "<a:xfrm/>";
    const chOff = `<a:chOff x="${opts.childOffsetX ?? 0}" y="${opts.childOffsetY ?? 0}"/>`;
    const chExt = `<a:chExt cx="${opts.childExtentWidth ?? 0}" cy="${opts.childExtentHeight ?? 0}"/>`;
    if (base.endsWith("/>")) return `<a:xfrm>${chOff}${chExt}</a:xfrm>`;
    return base.replace(/<\/a:xfrm>$/, `${chOff}${chExt}</a:xfrm>`);
  },
  parse(el, ctx) {
    const result = transform2DDesc.parse(el, ctx);
    const chOff = findChild(el, "a:chOff");
    if (chOff?.attributes) {
      result.childOffsetX = attrMeasure(chOff, "x") ?? 0;
      result.childOffsetY = attrMeasure(chOff, "y") ?? 0;
    }
    const chExt = findChild(el, "a:chExt");
    if (chExt?.attributes) {
      result.childExtentWidth = attrMeasure(chExt, "cx") ?? 0;
      result.childExtentHeight = attrMeasure(chExt, "cy") ?? 0;
    }
    return result;
  }
};
var shapePropertiesDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.x !== void 0 || opts.y !== void 0 || opts.width !== void 0 || opts.height !== void 0 || opts.flipHorizontal !== void 0 || opts.flipVertical !== void 0 || opts.rotation !== void 0) {
      const transformOpts = {
        x: opts.x,
        y: opts.y,
        width: opts.width,
        height: opts.height,
        flipHorizontal: opts.flipHorizontal,
        flipVertical: opts.flipVertical,
        rotation: opts.rotation
      };
      const xfrm = transform2DDesc.stringify(transformOpts, ctx);
      if (xfrm) parts.push(xfrm);
    }
    if (opts.customGeometry) {
      const g = customGeometryDesc.stringify(opts.customGeometry, ctx);
      if (g) parts.push(g);
    } else if (opts.geometry !== void 0) {
      const geom = typeof opts.geometry === "string" ? { preset: opts.geometry } : opts.geometry;
      const g = presetGeometryDesc.stringify(geom, ctx);
      if (g) parts.push(g);
    }
    if (opts.fill !== void 0) {
      const f = fillDesc.stringify(opts.fill, ctx);
      if (f) parts.push(f);
    }
    if (opts.outline) {
      const ln2 = outlineDesc.stringify(opts.outline, ctx);
      if (ln2) parts.push(ln2);
    }
    if (opts.effectDag) parts.push(createEffectDag(opts.effectDag));
    else if (opts.effects) {
      const e = effectListDesc.stringify(opts.effects, ctx);
      if (e) parts.push(e);
    }
    if (opts.scene3d) {
      const s = scene3DDesc.stringify(opts.scene3d, ctx);
      if (s) parts.push(s);
    }
    if (opts.shape3d) {
      const sp = shape3DDesc.stringify(opts.shape3d, ctx);
      if (sp) parts.push(sp);
    }
    if (opts.extensions !== void 0) {
      const extensions = opts.extensions.map((extension) => {
        let content = extension.content ?? "";
        if (extension.hiddenLine) {
          const hiddenLine = stringifyLineProperties("a14:hiddenLine", extension.hiddenLine, ctx) ?? "";
          content += hiddenLine.replace("<a14:hiddenLine", '<a14:hiddenLine xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"');
        }
        return `<a:ext uri="${escapeXml(extension.uri)}">${content}</a:ext>`;
      }).join("");
      parts.push(`<a:extLst>${extensions}</a:extLst>`);
    } else if (opts.ext !== void 0) parts.push(`<a:extLst>${opts.ext}</a:extLst>`);
    return parts.length > 0 ? parts.join("") : void 0;
  },
  parse(el, ctx) {
    const result = {};
    const xfrm = findChild(el, "a:xfrm");
    if (xfrm) Object.assign(result, transform2DDesc.parse(xfrm, ctx));
    const custGeom = findChild(el, "a:custGeom");
    if (custGeom) result.customGeometry = customGeometryDesc.parse(custGeom, ctx);
    else {
      const prstGeom = findChild(el, "a:prstGeom");
      if (prstGeom) result.geometry = presetGeometryDesc.parse(prstGeom, ctx);
    }
    const fillChild = findFillChild(el);
    if (fillChild) result.fill = parse$1(fillDesc, fillChild, ctx);
    const ln2 = findChild(el, "a:ln");
    if (ln2) result.outline = outlineDesc.parse(ln2, ctx);
    const effectLst = findChild(el, "a:effectLst");
    if (effectLst) result.effects = effectListDesc.parse(effectLst, ctx);
    const scene3d = findChild(el, "a:scene3d");
    if (scene3d) result.scene3d = scene3DDesc.parse(scene3d, ctx);
    const sp3d = findChild(el, "a:sp3d");
    if (sp3d) result.shape3d = shape3DDesc.parse(sp3d, ctx);
    const extLst = findChild(el, "a:extLst");
    if (extLst) {
      const extensions = (extLst.elements ?? []).filter((child) => child.type === "element" && child.name === "a:ext").map((extension) => {
        const parsed = { uri: String(extension.attributes?.["uri"] ?? "") };
        const unknown = [];
        for (const child of extension.elements ?? []) if (child.type === "element" && child.name === "a14:hiddenLine") parsed.hiddenLine = outlineDesc.parse(child, ctx);
        else unknown.push(stringifyElement(child));
        if (unknown.length > 0) parsed.content = unknown.join("");
        return parsed;
      });
      if (extensions.some((extension) => extension.hiddenLine !== void 0)) result.extensions = extensions;
      else result.ext = (extLst.elements ?? []).map(stringifyElement).join("");
    }
    return result;
  }
};
var groupShapePropertiesDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.x !== void 0 || opts.y !== void 0 || opts.width !== void 0 || opts.height !== void 0 || opts.flipHorizontal !== void 0 || opts.flipVertical !== void 0 || opts.rotation !== void 0 || opts.childOffsetX !== void 0 || opts.childOffsetY !== void 0 || opts.childExtentWidth !== void 0 || opts.childExtentHeight !== void 0) {
      const xfrm = groupTransform2DDesc.stringify(opts, ctx);
      if (xfrm) parts.push(xfrm);
    }
    if (opts.fill !== void 0) {
      const f = fillDesc.stringify(opts.fill, ctx);
      if (f) parts.push(f);
    }
    if (opts.effectDag) parts.push(createEffectDag(opts.effectDag));
    else if (opts.effects) {
      const e = effectListDesc.stringify(opts.effects, ctx);
      if (e) parts.push(e);
    }
    if (opts.scene3d) {
      const s = scene3DDesc.stringify(opts.scene3d, ctx);
      if (s) parts.push(s);
    }
    return parts.length > 0 ? parts.join("") : void 0;
  },
  parse(el, ctx) {
    const result = {};
    const xfrm = findChild(el, "a:xfrm");
    if (xfrm) Object.assign(result, groupTransform2DDesc.parse(xfrm, ctx));
    const fillChild = findFillChild(el);
    if (fillChild) result.fill = parse$1(fillDesc, fillChild, ctx);
    const effectLst = findChild(el, "a:effectLst");
    if (effectLst) result.effects = effectListDesc.parse(effectLst, ctx);
    const scene3d = findChild(el, "a:scene3d");
    if (scene3d) result.scene3d = scene3DDesc.parse(scene3d, ctx);
    return result;
  }
};
var DEFAULT_OUTLINE_WIDTH = 12700;
var DEFAULT_SHADOW_BLUR_RADIUS = 50800;
var DEFAULT_SHADOW_DISTANCE = 38100;
var filterAttrs = (options) => {
  const attrs2 = {};
  for (const [key, value] of Object.entries(options)) if (value !== void 0) attrs2[key] = value;
  return Object.keys(attrs2).length > 0 ? attrs2 : void 0;
};
var createPresetTextShape = (options) => {
  const adjChildren = [];
  if (options.adjustments) for (const adj of options.adjustments) adjChildren.push(`<a:gd name="${adj.name}" fmla="${adj.formula}"/>`);
  return element("a:prstTxWarp", { prst: options.preset }, [element("a:avLst", void 0, adjChildren)]);
};
var createBodyProperties = (options = {}, tagName = "a:bodyPr") => {
  const anchor = options.anchor;
  const lIns = options.lIns ?? options.margins?.left;
  const tIns = options.tIns ?? options.margins?.top;
  const rIns = options.rIns ?? options.margins?.right;
  const bIns = options.bIns ?? options.margins?.bottom;
  const attrs2 = filterAttrs({
    rot: options.rotation,
    spcFirstLastPara: options.spcFirstLastPara,
    vertOverflow: options.vertOverflow,
    horzOverflow: options.horzOverflow,
    vert: options.vertical !== void 0 ? xsdTextVerticalType.to(options.vertical) : void 0,
    wrap: options.wrap,
    lIns: lIns !== void 0 ? convertToEmu(lIns) : void 0,
    tIns: tIns !== void 0 ? convertToEmu(tIns) : void 0,
    rIns: rIns !== void 0 ? convertToEmu(rIns) : void 0,
    bIns: bIns !== void 0 ? convertToEmu(bIns) : void 0,
    numCol: options.numCol,
    spcCol: options.spcCol !== void 0 ? convertToEmu(options.spcCol) : void 0,
    rtlCol: options.rtlCol,
    fromWordArt: options.fromWordArt,
    anchor: anchor !== void 0 ? xsdTextAnchor.to(anchor) : void 0,
    anchorCtr: options.anchorCtr,
    forceAA: options.forceAA,
    upright: options.upright,
    compatLnSpc: options.compatLnSpc
  });
  const children2 = [];
  if (options.prstTxWarp) children2.push(createPresetTextShape(options.prstTxWarp));
  if (options.noAutoFit) children2.push(`<a:noAutofit/>`);
  else if (options.normAutofit) {
    const normAttrs = filterAttrs({
      fontScale: options.normAutofit.fontScale,
      lnSpcReduction: options.normAutofit.lnSpcReduction
    });
    children2.push(element("a:normAutofit", normAttrs));
  } else if (options.spAutoFit) children2.push(`<a:spAutoFit/>`);
  if (options.scene3d) children2.push(createScene3D(options.scene3d));
  if (options.sp3d) children2.push(createShape3D(options.sp3d));
  else if (options.flatTx) {
    const flatAttrs = filterAttrs({ z: options.flatTx.z });
    children2.push(element("a:flatTx", flatAttrs));
  }
  return element(tagName, attrs2, children2.length > 0 ? children2 : void 0);
};
var parseBodyProperties = (el, ctx) => {
  const result = {};
  const rotation = attrNum(el, "rot");
  if (rotation !== void 0) result.rotation = rotation;
  const spcFirstLastPara = attrBool(el, "spcFirstLastPara");
  if (spcFirstLastPara !== void 0) result.spcFirstLastPara = spcFirstLastPara;
  const vertOverflow = attr(el, "vertOverflow");
  if (vertOverflow !== void 0) result.vertOverflow = vertOverflow;
  const horzOverflow = attr(el, "horzOverflow");
  if (horzOverflow !== void 0) result.horzOverflow = horzOverflow;
  const vert = attr(el, "vert");
  if (vert !== void 0) result.vertical = xsdTextVerticalType.from(vert);
  const wrap = attr(el, "wrap");
  if (wrap !== void 0) result.wrap = wrap;
  const lIns = attrMeasure(el, "lIns");
  if (lIns !== void 0) result.lIns = lIns;
  const tIns = attrMeasure(el, "tIns");
  if (tIns !== void 0) result.tIns = tIns;
  const rIns = attrMeasure(el, "rIns");
  if (rIns !== void 0) result.rIns = rIns;
  const bIns = attrMeasure(el, "bIns");
  if (bIns !== void 0) result.bIns = bIns;
  const numCol = attrNum(el, "numCol");
  if (numCol !== void 0) result.numCol = numCol;
  const spcCol = attrNum(el, "spcCol");
  if (spcCol !== void 0) result.spcCol = spcCol;
  const rtlCol = attrBool(el, "rtlCol");
  if (rtlCol !== void 0) result.rtlCol = rtlCol;
  const fromWordArt = attrBool(el, "fromWordArt");
  if (fromWordArt !== void 0) result.fromWordArt = fromWordArt;
  const anchor = attr(el, "anchor");
  if (anchor !== void 0) result.anchor = xsdTextAnchor.from(anchor);
  const anchorCtr = attrBool(el, "anchorCtr");
  if (anchorCtr !== void 0) result.anchorCtr = anchorCtr;
  const forceAA = attrBool(el, "forceAA");
  if (forceAA !== void 0) result.forceAA = forceAA;
  const upright = attrBool(el, "upright");
  if (upright !== void 0) result.upright = upright;
  const compatLnSpc = attrBool(el, "compatLnSpc");
  if (compatLnSpc !== void 0) result.compatLnSpc = compatLnSpc;
  if (findChild(el, "a:noAutofit")) result.noAutoFit = true;
  else {
    const norm = findChild(el, "a:normAutofit");
    if (norm) {
      const normOpts = {};
      const fontScale = attrNum(norm, "fontScale");
      if (fontScale !== void 0) normOpts.fontScale = fontScale;
      const lnSpcReduction = attrNum(norm, "lnSpcReduction");
      if (lnSpcReduction !== void 0) normOpts.lnSpcReduction = lnSpcReduction;
      result.normAutofit = normOpts;
    } else if (findChild(el, "a:spAutoFit")) result.spAutoFit = true;
  }
  const prstTxWarp = findChild(el, "a:prstTxWarp");
  if (prstTxWarp) {
    const preset = attr(prstTxWarp, "prst") ?? "";
    const avLst = findChild(prstTxWarp, "a:avLst");
    const adjustments = [];
    for (const gd of avLst?.elements ?? []) if (gd.type === "element" && gd.name === "a:gd") adjustments.push({
      name: attr(gd, "name") ?? "",
      formula: attr(gd, "fmla") ?? ""
    });
    result.prstTxWarp = {
      preset,
      ...adjustments.length > 0 ? { adjustments } : {}
    };
  }
  const scene3d = findChild(el, "a:scene3d");
  if (scene3d) result.scene3d = scene3DDesc.parse(scene3d, ctx);
  const sp3d = findChild(el, "a:sp3d");
  if (sp3d) result.sp3d = shape3DDesc.parse(sp3d, ctx);
  else {
    const flatTx = findChild(el, "a:flatTx");
    if (flatTx) {
      const z = attrNum(flatTx, "z");
      result.flatTx = z !== void 0 ? { z } : {};
    }
  }
  return result;
};
var bodyPropertiesDesc = {
  kind: "custom",
  stringify(opts) {
    return createBodyProperties(opts);
  },
  parse(el, ctx) {
    return parseBodyProperties(el, ctx);
  }
};
var nextHyperlinkId = 1;
function registerHyperlink(hl, ctx) {
  if (hl.url === void 0 && hl.slide === void 0) return void 0;
  const key = hl.referenceId ?? `hlink_${nextHyperlinkId++}`;
  ctx.addHyperlink(key, {
    url: hl.url,
    slide: hl.slide,
    tooltip: hl.tooltip
  });
  return key;
}
function buildHyperlinkElement(tag, hl, key) {
  const attrs2 = [];
  if ((hl.url !== void 0 || hl.slide !== void 0) && key !== void 0) attrs2.push(`r:id="{hlink:${key}}"`);
  if (hl.slide !== void 0) attrs2.push('action="ppaction://hlinksldjump"');
  else if (hl.action) attrs2.push(`action="${escapeXml(hl.action)}"`);
  if (hl.tooltip) attrs2.push(`tooltip="${escapeXml(hl.tooltip)}"`);
  if (hl.highlightClick) attrs2.push('highlightClick="1"');
  if (hl.endSound) attrs2.push('endSnd="1"');
  if (hl.invalidUrl) attrs2.push('invalidUrl="1"');
  return attrs2.length ? `<${tag} ${attrs2.join(" ")}/>` : `<${tag}/>`;
}
function readHyperlink(el, ctx) {
  const hl = {};
  const rId = el.attributes?.["r:id"];
  const action = el.attributes?.["action"] !== void 0 ? String(el.attributes["action"]) : void 0;
  if (rId) {
    const ridStr = String(rId);
    const target = ctx.resolveRelationship(ridStr);
    if (target) {
      const slideMatch = target.match(/slide(\d+)\.xml$/);
      if (slideMatch && action === "ppaction://hlinksldjump") hl.slide = Number(slideMatch[1]);
      else hl.url = target;
    }
    const m = ridStr.match(/^\{hlink:(.+)\}$/);
    if (m) hl.referenceId = m[1];
  }
  if (el.attributes?.["tooltip"]) hl.tooltip = String(el.attributes["tooltip"]);
  if (action && action !== "ppaction://hlinksldjump") hl.action = action;
  if (el.attributes?.["highlightClick"]) hl.highlightClick = true;
  if (el.attributes?.["endSnd"]) hl.endSound = true;
  if (el.attributes?.["invalidUrl"]) hl.invalidUrl = true;
  return hl;
}
function stringifyFontElement(tag, font) {
  if (typeof font === "string") return `<${tag} typeface="${escapeXml(font)}"/>`;
  const attrs2 = [`typeface="${escapeXml(font.typeface)}"`];
  if (font.panose) attrs2.push(`panose="${font.panose}"`);
  if (font.pitchFamily !== void 0) attrs2.push(`pitchFamily="${font.pitchFamily}"`);
  if (font.charset !== void 0) attrs2.push(`charset="${font.charset}"`);
  return `<${tag} ${attrs2.join(" ")}/>`;
}
function parseFontElement(el) {
  if (!el) return void 0;
  const tf = el.attributes?.["typeface"];
  if (tf === void 0) return void 0;
  const typeface = String(tf);
  const panose = el.attributes?.["panose"];
  const pitchFamily = el.attributes?.["pitchFamily"];
  const charset = el.attributes?.["charset"];
  if (panose === void 0 && pitchFamily === void 0 && charset === void 0) return typeface;
  const font = { typeface };
  if (panose !== void 0) font.panose = String(panose);
  if (pitchFamily !== void 0) font.pitchFamily = Number(pitchFamily);
  if (charset !== void 0) font.charset = Number(charset);
  return font;
}
function stringifyRunProperties(tag, opts, ctx) {
  let hyperlinkKey;
  if (opts.hyperlink) hyperlinkKey = registerHyperlink(opts.hyperlink, ctx);
  let mouseoverKey;
  if (opts.mouseoverHyperlink) mouseoverKey = registerHyperlink(opts.mouseoverHyperlink, ctx);
  const attrParts = [];
  if (opts.size) attrParts.push(`sz="${Math.round(opts.size * 100)}"`);
  if (opts.bold !== void 0) attrParts.push(`b="${opts.bold ? 1 : 0}"`);
  if (opts.italic !== void 0) attrParts.push(`i="${opts.italic ? 1 : 0}"`);
  if (opts.underline) attrParts.push(`u="${xsdUnderlineStyle.to(opts.underline)}"`);
  if (opts.lang) attrParts.push(`lang="${opts.lang}"`);
  if (opts.strike) attrParts.push(`strike="${xsdStrikeStyle.to(opts.strike)}"`);
  if (opts.baseline !== void 0) attrParts.push(`baseline="${emitPercent(opts.baseline)}"`);
  if (opts.capitalization) attrParts.push(`cap="${xsdTextCaps.to(opts.capitalization)}"`);
  if (opts.spacing !== void 0) attrParts.push(`spc="${Math.round(opts.spacing * 100)}"`);
  if (opts.kern !== void 0) attrParts.push(`kern="${Math.round(opts.kern * 100)}"`);
  if (opts.noProof !== void 0) attrParts.push(`noProof="${opts.noProof ? 1 : 0}"`);
  if (opts.dirty !== void 0) attrParts.push(`dirty="${opts.dirty ? 1 : 0}"`);
  if (opts.kumimoji !== void 0) attrParts.push(`kumimoji="${opts.kumimoji ? 1 : 0}"`);
  if (opts.alternateLanguage) attrParts.push(`altLang="${opts.alternateLanguage}"`);
  if (opts.normalizeHeight !== void 0) attrParts.push(`normalizeH="${opts.normalizeHeight ? 1 : 0}"`);
  if (opts.bookmarkMark) attrParts.push(`bmk="${opts.bookmarkMark}"`);
  if (opts.smartTagId) attrParts.push(`smtId="${opts.smartTagId}"`);
  if (opts.err !== void 0) attrParts.push(`err="${opts.err ? 1 : 0}"`);
  if (opts.smtClean !== void 0) attrParts.push(`smtClean="${opts.smtClean ? 1 : 0}"`);
  const attrStr = attrParts.length ? " " + attrParts.join(" ") : "";
  const parts = [];
  if (opts.outline !== void 0) {
    const outlineOpts = opts.outline === true ? {
      width: DEFAULT_OUTLINE_WIDTH,
      type: "solidFill",
      color: { value: "000000" }
    } : opts.outline;
    const outlineXml = stringify$1(outlineDesc, outlineOpts, ctx);
    if (outlineXml) parts.push(outlineXml);
  }
  if (opts.fill !== void 0) {
    const fillXml = stringify$1(fillDesc, opts.fill, ctx);
    if (fillXml) parts.push(fillXml);
  }
  if (opts.shadow !== void 0) {
    const effectOpts = opts.shadow === true ? { outerShadow: {
      blurRadius: DEFAULT_SHADOW_BLUR_RADIUS,
      distance: DEFAULT_SHADOW_DISTANCE,
      direction: 270,
      color: {
        value: "000000",
        transforms: { alpha: 40 }
      }
    } } : opts.shadow;
    const effectXml = stringify$1(effectListDesc, effectOpts, ctx);
    if (effectXml) parts.push(effectXml);
  }
  if (opts.highlight !== void 0) {
    const hlXml = stringifyColorChoice(opts.highlight, ctx);
    if (hlXml) parts.push(`<a:highlight>${hlXml}</a:highlight>`);
  }
  if (opts.underlineLine !== void 0) {
    if (opts.underlineLine === true) parts.push("<a:uLnTx/>");
    else {
      const uLnXml = stringifyLineProperties("a:uLn", opts.underlineLine, ctx);
      if (uLnXml) parts.push(uLnXml);
    }
  }
  if (opts.underlineFill !== void 0) {
    if (opts.underlineFill === true) parts.push("<a:uFillTx/>");
    else {
      const uFillXml = stringify$1(fillDesc, opts.underlineFill, ctx);
      if (uFillXml) parts.push(`<a:uFill>${uFillXml}</a:uFill>`);
    }
  }
  if (opts.font !== void 0) {
    const scripts = typeof opts.font === "string" ? {
      latin: opts.font,
      eastAsia: opts.font
    } : opts.font;
    if (scripts.latin) parts.push(stringifyFontElement("a:latin", scripts.latin));
    if (scripts.eastAsia) parts.push(stringifyFontElement("a:ea", scripts.eastAsia));
    if (scripts.complexScript) parts.push(stringifyFontElement("a:cs", scripts.complexScript));
    if (scripts.symbol) parts.push(stringifyFontElement("a:sym", scripts.symbol));
  }
  if (opts.hyperlink) parts.push(buildHyperlinkElement("a:hlinkClick", opts.hyperlink, hyperlinkKey));
  if (opts.mouseoverHyperlink) parts.push(buildHyperlinkElement("a:hlinkMouseOver", opts.mouseoverHyperlink, mouseoverKey));
  if (opts.rightToLeft !== void 0) parts.push(`<a:rtl val="${opts.rightToLeft ? 1 : 0}"/>`);
  if (attrParts.length === 0 && parts.length === 0) return "";
  if (parts.length === 0) return `<${tag}${attrStr}/>`;
  return `<${tag}${attrStr}>${parts.join("")}</${tag}>`;
}
var runPropertiesDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    return stringifyRunProperties("a:rPr", opts, ctx);
  },
  parse(el, _ctx) {
    const result = {};
    const isOn2 = (raw) => parseOnOff(raw) ?? false;
    if (el.attributes) {
      if (el.attributes["sz"] !== void 0) result.size = Number(el.attributes["sz"]) / 100;
      if (el.attributes["b"] !== void 0) result.bold = isOn2(el.attributes["b"]);
      if (el.attributes["i"] !== void 0) result.italic = isOn2(el.attributes["i"]);
      if (el.attributes["u"] !== void 0) result.underline = xsdUnderlineStyle.from(String(el.attributes["u"]));
      if (el.attributes["lang"] !== void 0) result.lang = String(el.attributes["lang"]);
      if (el.attributes["strike"] !== void 0) result.strike = xsdStrikeStyle.from(String(el.attributes["strike"]));
      if (el.attributes["baseline"] !== void 0) result.baseline = parsePercentAttr(el.attributes["baseline"]);
      if (el.attributes["cap"] !== void 0) result.capitalization = xsdTextCaps.from(String(el.attributes["cap"]));
      if (el.attributes["spc"] !== void 0) result.spacing = Number(el.attributes["spc"]) / 100;
      if (el.attributes["noProof"] !== void 0) result.noProof = isOn2(el.attributes["noProof"]);
      if (el.attributes["dirty"] !== void 0) result.dirty = isOn2(el.attributes["dirty"]);
      if (el.attributes["kumimoji"] !== void 0) result.kumimoji = isOn2(el.attributes["kumimoji"]);
      if (el.attributes["altLang"] !== void 0) result.alternateLanguage = String(el.attributes["altLang"]);
      if (el.attributes["normalizeH"] !== void 0) result.normalizeHeight = isOn2(el.attributes["normalizeH"]);
      if (el.attributes["bmk"] !== void 0) result.bookmarkMark = String(el.attributes["bmk"]);
      if (el.attributes["smtId"] !== void 0) result.smartTagId = Number(el.attributes["smtId"]);
      if (el.attributes["kern"] !== void 0) result.kern = Number(el.attributes["kern"]) / 100;
      if (el.attributes["err"] !== void 0) result.err = isOn2(el.attributes["err"]);
      if (el.attributes["smtClean"] !== void 0) result.smtClean = isOn2(el.attributes["smtClean"]);
    }
    const ln2 = findChild(el, "a:ln");
    if (ln2) result.outline = parse$1(outlineDesc, ln2, _ctx);
    const fillChild = findFillChild(el);
    if (fillChild) result.fill = parse$1(fillDesc, fillChild, _ctx);
    const effectLst = findChild(el, "a:effectLst");
    if (effectLst) result.shadow = parse$1(effectListDesc, effectLst, _ctx);
    const highlight = findChild(el, "a:highlight");
    if (highlight) result.highlight = parseColorChoice(highlight, _ctx);
    if (findChild(el, "a:uLnTx")) result.underlineLine = true;
    else {
      const uLn = findChild(el, "a:uLn");
      if (uLn) result.underlineLine = parse$1(outlineDesc, uLn, _ctx);
    }
    if (findChild(el, "a:uFillTx")) result.underlineFill = true;
    else {
      const uFill = findChild(el, "a:uFill");
      if (uFill) result.underlineFill = parse$1(fillDesc, uFill, _ctx);
    }
    const latinFont = parseFontElement(findChild(el, "a:latin"));
    const eaFont = parseFontElement(findChild(el, "a:ea"));
    const csFont = parseFontElement(findChild(el, "a:cs"));
    const symFont = parseFontElement(findChild(el, "a:sym"));
    if (latinFont && eaFont && !csFont && !symFont && typeof latinFont === "string" && typeof eaFont === "string" && latinFont === eaFont) result.font = latinFont;
    else if (latinFont || eaFont || csFont || symFont) {
      const font = {};
      if (latinFont) font.latin = latinFont;
      if (eaFont) font.eastAsia = eaFont;
      if (csFont) font.complexScript = csFont;
      if (symFont) font.symbol = symFont;
      result.font = font;
    }
    const hlinkClick = findChild(el, "a:hlinkClick");
    if (hlinkClick) result.hyperlink = readHyperlink(hlinkClick, _ctx);
    const hlinkMouseOver = findChild(el, "a:hlinkMouseOver");
    if (hlinkMouseOver) result.mouseoverHyperlink = readHyperlink(hlinkMouseOver, _ctx);
    const rtl = findChild(el, "a:rtl");
    if (rtl) result.rightToLeft = isOn2(rtl.attributes?.["val"]);
    return result;
  }
};
function stringifyTextRun(text) {
  return `<a:r><a:t>${escapeXml(text)}</a:t></a:r>`;
}
var textRunDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    let body = runPropertiesDesc.stringify(opts, ctx) ?? "";
    if (!body && opts.emptyProperties) body = "<a:rPr/>";
    if (opts.text !== void 0) return body ? `<a:r>${body}<a:t>${escapeXml(opts.text)}</a:t></a:r>` : stringifyTextRun(opts.text);
    return body ? `<a:r>${body}</a:r>` : "<a:r/>";
  },
  parse(el, _ctx) {
    const result = {};
    const rPr = findChild(el, "a:rPr");
    if (rPr) {
      const props = runPropertiesDesc.parse(rPr, _ctx);
      Object.assign(result, props);
      if (Object.keys(props).length === 0) result.emptyProperties = true;
    }
    const t = findChild(el, "a:t");
    if (t) result.text = (t.elements ?? []).filter((e) => e.type === "text").map((e) => e.text ?? "").join("");
    return result;
  }
};
function stringifyParagraphPropertiesElement(tag, options, ctx) {
  const children2 = [];
  const attrs2 = [];
  if (options.marginIndent !== void 0) attrs2.push(`marL="${options.marginIndent}"`);
  if (options.marginRight !== void 0) attrs2.push(`marR="${options.marginRight}"`);
  if (options.indentLevel !== void 0) attrs2.push(`lvl="${options.indentLevel}"`);
  if (options.indent !== void 0) attrs2.push(`indent="${options.indent}"`);
  if (options.alignment) attrs2.push(`algn="${xsdTextAlign.to(options.alignment)}"`);
  if (options.defTabSize !== void 0) attrs2.push(`defTabSz="${options.defTabSize}"`);
  if (options.rightToLeft !== void 0) attrs2.push(`rtl="${options.rightToLeft ? 1 : 0}"`);
  if (options.eastAsianLineBreak !== void 0) attrs2.push(`eaLnBrk="${options.eastAsianLineBreak ? 1 : 0}"`);
  if (options.fontAlignment) attrs2.push(`fontAlgn="${xsdFontAlignment.to(options.fontAlignment)}"`);
  if (options.latinLineBreak !== void 0) attrs2.push(`latinLnBrk="${options.latinLineBreak ? 1 : 0}"`);
  if (options.hangingPunctuation !== void 0) attrs2.push(`hangingPunct="${options.hangingPunctuation ? 1 : 0}"`);
  if (options.lineSpacingPercent !== void 0) children2.push(`<a:lnSpc><a:spcPct val="${emitPercent(options.lineSpacingPercent)}"/></a:lnSpc>`);
  else if (options.lineSpacingPoints !== void 0) children2.push(`<a:lnSpc><a:spcPts val="${Math.round(options.lineSpacingPoints * 100)}"/></a:lnSpc>`);
  if (options.spaceBeforePercent !== void 0) children2.push(`<a:spcBef><a:spcPct val="${emitPercent(options.spaceBeforePercent)}"/></a:spcBef>`);
  else if (options.spaceBefore !== void 0) children2.push(`<a:spcBef><a:spcPts val="${Math.round(options.spaceBefore * 100)}"/></a:spcBef>`);
  if (options.spaceAfterPercent !== void 0) children2.push(`<a:spcAft><a:spcPct val="${emitPercent(options.spaceAfterPercent)}"/></a:spcAft>`);
  else if (options.spaceAfter !== void 0) children2.push(`<a:spcAft><a:spcPts val="${Math.round(options.spaceAfter * 100)}"/></a:spcAft>`);
  if (options.bullet) children2.push(...stringifyBullet(options.bullet));
  if (options.tabStops) children2.push(stringifyTabStops(options.tabStops));
  if (options.defaultRunProperties !== void 0) {
    const rPr = stringifyRunProperties("a:defRPr", options.defaultRunProperties, ctx);
    children2.push(rPr || "<a:defRPr/>");
  }
  if (options.ext) children2.push(`<a:extLst>${options.ext}</a:extLst>`);
  if (attrs2.length === 0 && children2.length === 0) return "";
  const attrStr = attrs2.length ? " " + attrs2.join(" ") : "";
  if (children2.length === 0) return `<${tag}${attrStr}/>`;
  return `<${tag}${attrStr}>${children2.join("")}</${tag}>`;
}
function stringifyParagraphProperties(options, ctx) {
  return stringifyParagraphPropertiesElement("a:pPr", options, ctx);
}
function stringifyBullet(options) {
  const parts = [];
  if (options.colorFollowsText) parts.push("<a:buClrTx/>");
  else if (options.color) {
    const color = typeof options.color === "string" ? emitColorChoice({ value: stripColorHashPrefix(options.color) }) : emitColorChoice(options.color);
    parts.push(`<a:buClr>${color}</a:buClr>`);
  }
  if (options.sizeFollowsText) parts.push("<a:buSzTx/>");
  else if (options.sizePoints !== void 0) parts.push(`<a:buSzPts val="${Math.round(options.sizePoints * 100)}"/>`);
  else if (options.size !== void 0) parts.push(`<a:buSzPct val="${Math.round(options.size)}%"/>`);
  if (options.fontFollowsText) parts.push("<a:buFontTx/>");
  else if (options.font !== void 0) parts.push(`<a:buFont typeface="${options.font}" panose="020B0604020202020204" pitchFamily="34" charset="0"/>`);
  if (options.type === "none") parts.push("<a:buNone/>");
  else if (options.type === "char") parts.push(`<a:buChar char="${escapeXml(options.char ?? "\u2022")}"/>`);
  else if (options.type === "autoNum") {
    const buAttrs = [`type="${options.format ?? "arabicPeriod"}"`];
    if (options.startAt !== void 0) buAttrs.push(`startAt="${options.startAt}"`);
    parts.push(`<a:buAutoNum ${buAttrs.join(" ")}/>`);
  } else if (options.type === "picture") {
    if (options.embed) parts.push(`<a:buBlip><a:blip r:embed="${options.embed}"/></a:buBlip>`);
  }
  return parts;
}
function stringifyTabStops(stops) {
  const tabs = stops.map((t) => {
    const attrs2 = [];
    if (t.position !== void 0) attrs2.push(`pos="${t.position}"`);
    if (t.alignment) attrs2.push(`algn="${xsdTextTabAlignment.to(t.alignment)}"`);
    return `<a:tab${attrs2.length ? " " + attrs2.join(" ") : ""}/>`;
  });
  if (tabs.length === 0) return "<a:tabLst/>";
  return `<a:tabLst>${tabs.join("")}</a:tabLst>`;
}
function readParagraphProperties(el, ctx) {
  const result = {};
  if (el.attributes) {
    if (el.attributes["algn"] !== void 0) result.alignment = xsdTextAlign.from(String(el.attributes["algn"]));
    if (el.attributes["lvl"] !== void 0) result.indentLevel = Number(el.attributes["lvl"]);
    if (el.attributes["marL"] !== void 0) result.marginIndent = Number(el.attributes["marL"]);
    if (el.attributes["marR"] !== void 0) result.marginRight = Number(el.attributes["marR"]);
    if (el.attributes["indent"] !== void 0) result.indent = Number(el.attributes["indent"]);
    if (el.attributes["defTabSz"] !== void 0) result.defTabSize = Number(el.attributes["defTabSz"]);
    if (el.attributes["fontAlgn"] !== void 0) result.fontAlignment = xsdFontAlignment.from(String(el.attributes["fontAlgn"]));
    if (el.attributes["rtl"] !== void 0) result.rightToLeft = parseOnOff(el.attributes["rtl"]) ?? false;
    if (el.attributes["eaLnBrk"] !== void 0) result.eastAsianLineBreak = parseOnOff(el.attributes["eaLnBrk"]) ?? false;
    if (el.attributes["latinLnBrk"] !== void 0) result.latinLineBreak = parseOnOff(el.attributes["latinLnBrk"]) ?? false;
    if (el.attributes["hangingPunct"] !== void 0) result.hangingPunctuation = parseOnOff(el.attributes["hangingPunct"]) ?? false;
  }
  const lnSpc = findChild(el, "a:lnSpc");
  if (lnSpc) {
    const spcPct = findChild(lnSpc, "a:spcPct");
    if (spcPct?.attributes?.["val"] !== void 0) result.lineSpacingPercent = parsePercent(Number(spcPct.attributes["val"]));
    const spcPts = findChild(lnSpc, "a:spcPts");
    if (spcPts?.attributes?.["val"] !== void 0) result.lineSpacingPoints = Number(spcPts.attributes["val"]) / 100;
  }
  const spcAft = findChild(el, "a:spcAft");
  if (spcAft) {
    const pct = findChild(spcAft, "a:spcPct");
    if (pct?.attributes?.["val"] !== void 0) result.spaceAfterPercent = parsePercent(Number(pct.attributes["val"]));
    else {
      const pts = findChild(spcAft, "a:spcPts");
      if (pts?.attributes?.["val"] !== void 0) result.spaceAfter = Number(pts.attributes["val"]) / 100;
    }
  }
  const spcBef = findChild(el, "a:spcBef");
  if (spcBef) {
    const pct = findChild(spcBef, "a:spcPct");
    if (pct?.attributes?.["val"] !== void 0) result.spaceBeforePercent = parsePercent(Number(pct.attributes["val"]));
    else {
      const pts = findChild(spcBef, "a:spcPts");
      if (pts?.attributes?.["val"] !== void 0) result.spaceBefore = Number(pts.attributes["val"]) / 100;
    }
  }
  const buNone = findChild(el, "a:buNone");
  {
    const buChar = findChild(el, "a:buChar");
    const buAutoNum = findChild(el, "a:buAutoNum");
    const buBlip = findChild(el, "a:buBlip");
    if (buChar || buAutoNum || buBlip || buNone) {
      const style = {};
      if (findChild(el, "a:buClrTx")) style.colorFollowsText = true;
      else {
        const buClr = findChild(el, "a:buClr");
        if (buClr) {
          const parsed = parseColorChoice(buClr, ctx);
          if (parsed && Object.keys(parsed).length > 0) style.color = isPlainRgbColor(parsed) ? parsed.value : parsed;
        }
      }
      if (findChild(el, "a:buSzTx")) style.sizeFollowsText = true;
      else {
        const buSzPts = findChild(el, "a:buSzPts");
        if (buSzPts?.attributes?.["val"]) style.sizePoints = Number(buSzPts.attributes["val"]) / 100;
        else {
          const buSzPct = findChild(el, "a:buSzPct");
          if (buSzPct?.attributes?.["val"]) {
            const raw = String(buSzPct.attributes["val"]);
            const num = Number(raw.replace("%", ""));
            style.size = raw.includes("%") ? num : num / 1e3;
          }
        }
      }
      if (findChild(el, "a:buFontTx")) style.fontFollowsText = true;
      else {
        const buFont = findChild(el, "a:buFont");
        if (buFont?.attributes?.["typeface"]) style.font = String(buFont.attributes["typeface"]);
      }
      if (buNone) result.bullet = {
        type: "none",
        ...style
      };
      else if (buBlip) {
        const blip = findChild(buBlip, "a:blip");
        result.bullet = {
          type: "picture",
          embed: String(blip?.attributes?.["r:embed"] ?? ""),
          ...style
        };
      } else if (buChar) {
        const bullet = {
          type: "char",
          ...style
        };
        if (buChar.attributes?.["char"]) bullet.char = String(buChar.attributes["char"]);
        result.bullet = bullet;
      } else {
        const bullet = {
          type: "autoNum",
          ...style
        };
        if (buAutoNum.attributes?.["type"]) bullet.format = String(buAutoNum.attributes["type"]);
        if (buAutoNum.attributes?.["startAt"] !== void 0) bullet.startAt = Number(buAutoNum.attributes["startAt"]);
        result.bullet = bullet;
      }
    }
  }
  const tabLst = findChild(el, "a:tabLst");
  if (tabLst) {
    const tabs = [];
    for (const child of tabLst.elements ?? []) if (child.name === "a:tab") {
      const tab = {};
      if (child.attributes?.["pos"] !== void 0) tab.position = Number(child.attributes["pos"]);
      if (child.attributes?.["algn"] !== void 0) tab.alignment = xsdTextTabAlignment.from(String(child.attributes["algn"]));
      tabs.push(tab);
    }
    result.tabStops = tabs;
  }
  const defRPr = findChild(el, "a:defRPr");
  if (defRPr) result.defaultRunProperties = runPropertiesDesc.parse(defRPr, ctx);
  const extLst = findChild(el, "a:extLst");
  if (extLst) {
    const inner = stringify(extLst);
    if (inner) result.ext = inner;
  }
  return result;
}
var paragraphDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.properties) {
      const pPrXml = stringifyParagraphProperties(opts.properties, ctx);
      if (pPrXml) parts.push(pPrXml);
    }
    if (opts.text) parts.push(stringifyTextRun(opts.text));
    if (opts.children) for (const child of opts.children) if (typeof child === "string") parts.push(stringifyTextRun(child));
    else if (isTextField(child)) parts.push(stringifyTextField(child, ctx));
    else if (isBreak(child)) parts.push(stringifyBreak(child, ctx));
    else parts.push(textRunDesc.stringify(child, ctx) ?? "");
    if (opts.endParagraphProperties === false) {
    } else {
      const epr = opts.endParagraphProperties ?? { lang: "en-US" };
      parts.push(stringifyEndParaRPr(epr, ctx));
    }
    const body = parts.join("");
    return body ? `<a:p>${body}</a:p>` : "<a:p/>";
  },
  parse(el, ctx) {
    const result = {};
    const pPr = findChild(el, "a:pPr");
    if (pPr) result.properties = readParagraphProperties(pPr, ctx);
    const children2 = [];
    for (const child of el.elements ?? []) if (child.name === "a:r") children2.push(textRunDesc.parse(child, ctx));
    else if (child.name === "a:fld") children2.push(readTextField(child, ctx));
    else if (child.name === "a:br") children2.push(readBreak(child, ctx));
    const [onlyRun] = children2;
    if (onlyRun !== void 0 && !isTextField(onlyRun) && !isBreak(onlyRun) && children2.length === 1 && !result.properties && onlyRun.text !== void 0 && Object.keys(onlyRun).length === 1) result.text = onlyRun.text;
    else if (children2.length > 0) result.children = children2;
    const endParaRPr = findChild(el, "a:endParaRPr");
    if (endParaRPr) result.endParagraphProperties = runPropertiesDesc.parse(endParaRPr, ctx);
    else result.endParagraphProperties = false;
    return result;
  }
};
function isTextField(child) {
  return typeof child.type === "string";
}
function isBreak(child) {
  return child.break === true;
}
function stringifyBreak(opts, ctx) {
  const rPr = opts.properties ? runPropertiesDesc.stringify(opts.properties, ctx) ?? "" : "";
  return rPr ? `<a:br>${rPr}</a:br>` : "<a:br/>";
}
function readBreak(el, ctx) {
  const result = { break: true };
  const rPr = findChild(el, "a:rPr");
  if (rPr) result.properties = runPropertiesDesc.parse(rPr, ctx);
  return result;
}
function stringifyEndParaRPr(opts, ctx) {
  return stringifyRunProperties("a:endParaRPr", opts, ctx) || "<a:endParaRPr/>";
}
function stringifyTextField(opts, ctx) {
  const id = opts.id ?? "{00000000-0000-0000-0000-000000000000}";
  const rPr = opts.properties ? runPropertiesDesc.stringify(opts.properties, ctx) ?? "" : "";
  const pPr = (opts.paragraphProperties ? stringifyParagraphProperties(opts.paragraphProperties, ctx) ?? "" : "") || (opts.paragraphProperties ? "<a:pPr/>" : "");
  const t = opts.text !== void 0 ? `<a:t>${escapeXml(opts.text)}</a:t>` : "";
  return `<a:fld id="${id}" type="${opts.type}">${rPr}${pPr}${t}</a:fld>`;
}
function readTextField(el, ctx) {
  const result = { type: String(el.attributes?.["type"] ?? "") };
  const id = el.attributes?.["id"];
  if (id !== void 0) result.id = String(id);
  const rPr = findChild(el, "a:rPr");
  if (rPr) result.properties = runPropertiesDesc.parse(rPr, ctx);
  const pPr = findChild(el, "a:pPr");
  if (pPr) result.paragraphProperties = readParagraphProperties(pPr, ctx);
  const t = findChild(el, "a:t");
  if (t) result.text = (t.elements ?? []).filter((e) => e.type === "text").map((e) => e.text ?? "").join("");
  return result;
}
function parseGroup(el, ctx) {
  if (!el) return void 0;
  const group = {};
  const defPPr = findChild(el, "a:defPPr");
  if (defPPr) group.defaultParagraph = readParagraphProperties(defPPr, ctx);
  const levels = [];
  for (let i = 1; i <= 9; i++) {
    const lvlEl = findChild(el, `a:lvl${i}pPr`);
    levels.push(lvlEl ? readParagraphProperties(lvlEl, ctx) : null);
  }
  if (group.defaultParagraph || levels.some((l) => l !== null)) group.levels = levels;
  const extLst = findChild(el, "a:extLst");
  if (extLst) group.ext = stringify(extLst);
  return group;
}
var textListStyleDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    if (opts.defaultParagraph) parts.push(stringifyParagraphPropertiesElement("a:defPPr", opts.defaultParagraph, ctx));
    const levels = opts.levels ?? [];
    for (let i = 0; i < Math.min(levels.length, 9); i++) {
      const lvl = levels[i];
      if (lvl) parts.push(stringifyParagraphPropertiesElement(`a:lvl${i + 1}pPr`, lvl, ctx));
    }
    if (opts.ext !== void 0) parts.push(`<a:extLst>${opts.ext}</a:extLst>`);
    return parts.join("");
  },
  parse(el, ctx) {
    return parseGroup(el, ctx) ?? {};
  }
};
var MJ_RUN = {
  fill: {
    type: "solid",
    color: { value: "tx1" }
  },
  font: {
    latin: "+mj-lt",
    eastAsia: "+mj-ea",
    complexScript: "+mj-cs"
  }
};
var MN_RUN = {
  fill: {
    type: "solid",
    color: { value: "tx1" }
  },
  font: {
    latin: "+mn-lt",
    eastAsia: "+mn-ea",
    complexScript: "+mn-cs"
  }
};
var BASE_ATTRS = {
  alignment: "left",
  defTabSize: 914400,
  rightToLeft: false,
  eastAsianLineBreak: true,
  latinLineBreak: false,
  hangingPunctuation: true
};
var BODY_MARL = [
  228600,
  685800,
  1143e3,
  1600200,
  2057400,
  2514600,
  2971800,
  3429e3,
  3886200
];
var BODY_SZ = [
  28,
  24,
  20,
  18,
  18,
  18,
  18,
  18,
  18
];
var OTHER_MARL = [
  0,
  457200,
  914400,
  1371600,
  1828800,
  2286e3,
  2743200,
  3200400,
  3657600
];
var DEFAULT_TEXT_STYLES = {
  title: { levels: [{
    ...BASE_ATTRS,
    lineSpacingPercent: 90,
    spaceBeforePercent: 0,
    bullet: { type: "none" },
    defaultRunProperties: {
      size: 44,
      kern: 12,
      ...MJ_RUN
    }
  }] },
  body: { levels: BODY_MARL.map((marL, i) => ({
    ...BASE_ATTRS,
    marginIndent: marL,
    indent: -228600,
    lineSpacingPercent: 90,
    spaceBeforePercent: i === 0 ? 0 : void 0,
    spaceBefore: i === 0 ? void 0 : 5,
    bullet: {
      type: "char",
      char: "\u2022",
      font: "Arial"
    },
    defaultRunProperties: {
      size: BODY_SZ[i],
      kern: 12,
      ...MN_RUN
    }
  })) },
  other: {
    defaultParagraph: { defaultRunProperties: {} },
    levels: OTHER_MARL.map((marL, i) => ({
      ...BASE_ATTRS,
      marginIndent: marL,
      indent: i === 8 ? -228600 : void 0,
      defaultRunProperties: {
        size: 18,
        kern: 12,
        ...MN_RUN
      }
    }))
  }
};
function bodyPropertiesSugar(opts) {
  if (opts.anchor === void 0 && opts.autoFit === void 0 && opts.columns === void 0 && opts.columnSpacing === void 0 && opts.margins === void 0 && opts.wrap === void 0 && opts.vertical === void 0) return;
  const sugar = {};
  if (opts.anchor !== void 0) sugar.anchor = opts.anchor;
  if (opts.autoFit === "normal") sugar.normAutofit = {};
  else if (opts.autoFit === "shape") sugar.spAutoFit = true;
  if (opts.columns !== void 0) sugar.numCol = opts.columns;
  if (opts.columnSpacing !== void 0) sugar.spcCol = opts.columnSpacing;
  if (opts.margins !== void 0) sugar.margins = opts.margins;
  if (opts.wrap !== void 0) sugar.wrap = opts.wrap;
  if (opts.vertical !== void 0) sugar.vertical = opts.vertical;
  return sugar;
}
var textBodyDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    const sugar = bodyPropertiesSugar(opts);
    if (opts.bodyProperties || sugar !== void 0) parts.push(createBodyProperties({
      ...sugar,
      ...opts.bodyProperties
    }));
    else parts.push("<a:bodyPr/>");
    parts.push(opts.listStyle ? `<a:lstStyle>${textListStyleDesc.stringify(opts.listStyle, ctx) ?? ""}</a:lstStyle>` : "<a:lstStyle/>");
    const paragraphs = opts.paragraphs ?? (opts.text !== void 0 ? [{ text: opts.text }] : []);
    if (paragraphs.length > 0) for (const p of paragraphs) {
      const para = typeof p === "string" ? { children: [p] } : p;
      parts.push(paragraphDesc.stringify(para, ctx) ?? "<a:p/>");
    }
    else parts.push("<a:p/>");
    return parts.join("");
  },
  parse(el, ctx) {
    const result = {};
    const bodyPr = findChild(el, "a:bodyPr");
    if (bodyPr) result.bodyProperties = parseBodyProperties(bodyPr, ctx);
    const lstStyle = findChild(el, "a:lstStyle");
    if (lstStyle) {
      const parsed = textListStyleDesc.parse(lstStyle, ctx);
      if (parsed.defaultParagraph || parsed.ext !== void 0 || (parsed.levels?.length ?? 0) > 0) result.listStyle = parsed;
    }
    const paragraphs = [];
    for (const child of el.elements ?? []) if (child.name === "a:p") paragraphs.push(paragraphDesc.parse(child, ctx));
    if (paragraphs.length > 0) result.paragraphs = paragraphs;
    return result;
  }
};

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/style-matrix-B6jhPAT3.mjs
function stringifyStyleMatrixReference(tag, opts, ctx) {
  const color = opts.color ? stringifyColorChoice(opts.color, ctx) : "";
  return `<${tag} idx="${opts.index}">${color}</${tag}>`;
}
function parseStyleMatrixReference(el, ctx) {
  if (!el?.attributes) return void 0;
  const idx = el.attributes["idx"];
  if (idx === void 0) return void 0;
  const parsedColor = parseColorChoice(el, ctx);
  const color = parsedColor && Object.keys(parsedColor).length > 0 ? parsedColor : void 0;
  return color ? {
    index: Number(idx),
    color
  } : { index: Number(idx) };
}
function stringifyFontReference(opts, ctx) {
  const color = opts.color ? stringifyColorChoice(opts.color, ctx) : "";
  return `<a:fontRef idx="${opts.collection}">${color}</a:fontRef>`;
}
function parseFontReference(el, ctx) {
  if (!el?.attributes) return void 0;
  const idx = el.attributes["idx"];
  if (idx !== "major" && idx !== "minor" && idx !== "none") return void 0;
  const parsedColor = parseColorChoice(el, ctx);
  const color = parsedColor && Object.keys(parsedColor).length > 0 ? parsedColor : void 0;
  return color ? {
    collection: idx,
    color
  } : { collection: idx };
}
function stringifyShapeStyle(opts, ctx, wrapTag = "a:style") {
  return `<${wrapTag}>${stringifyStyleMatrixReference("a:lnRef", opts.lineReference, ctx)}${stringifyStyleMatrixReference("a:fillRef", opts.fillReference, ctx)}${stringifyStyleMatrixReference("a:effectRef", opts.effectReference, ctx)}${stringifyFontReference(opts.fontReference, ctx)}</${wrapTag}>`;
}
function parseShapeStyle(el, ctx) {
  if (!el) return void 0;
  const lineReference = parseStyleMatrixReference(findChild(el, "a:lnRef"), ctx);
  const fillReference = parseStyleMatrixReference(findChild(el, "a:fillRef"), ctx);
  const effectReference = parseStyleMatrixReference(findChild(el, "a:effectRef"), ctx);
  const fontReference = parseFontReference(findChild(el, "a:fontRef"), ctx);
  if (!lineReference || !fillReference || !effectReference || !fontReference) return void 0;
  return {
    lineReference,
    fillReference,
    effectReference,
    fontReference
  };
}
function stringifyEffectStyle(opts, ctx) {
  return `<a:effectStyle>${opts.effects ? effectListDesc.stringify(opts.effects, ctx) ?? "" : "<a:effectLst/>"}${opts.scene3d ? scene3DDesc.stringify(opts.scene3d, ctx) ?? "" : ""}${opts.shape3d ? shape3DDesc.stringify(opts.shape3d, ctx) ?? "" : ""}</a:effectStyle>`;
}
function parseEffectStyle(el, ctx) {
  if (!el) return void 0;
  const result = {};
  const effectLst = findChild(el, "a:effectLst");
  if (effectLst) {
    const effects = effectListDesc.parse(effectLst, ctx);
    if (effects && Object.keys(effects).length > 0) result.effects = effects;
  }
  const scene3dEl = findChild(el, "a:scene3d");
  if (scene3dEl) result.scene3d = scene3DDesc.parse(scene3dEl, ctx);
  const shape3dEl = findChild(el, "a:sp3d");
  if (shape3dEl) result.shape3d = shape3DDesc.parse(shape3dEl, ctx);
  return result;
}
function stringifyFormatScheme(opts, ctx) {
  const fillStyles = opts.fillStyles.map((f) => fillDesc.stringify(f, ctx) ?? "").join("");
  const lineStyles = opts.lineStyles.map((l) => outlineDesc.stringify(l, ctx) ?? "").join("");
  const effectStyles = opts.effectStyles.map((e) => stringifyEffectStyle(e, ctx)).join("");
  const backgroundFillStyles = opts.backgroundFillStyles.map((f) => fillDesc.stringify(f, ctx) ?? "").join("");
  return `<a:fmtScheme name="${opts.name ?? "Office"}"><a:fillStyleLst>${fillStyles}</a:fillStyleLst><a:lnStyleLst>${lineStyles}</a:lnStyleLst><a:effectStyleLst>${effectStyles}</a:effectStyleLst><a:bgFillStyleLst>${backgroundFillStyles}</a:bgFillStyleLst></a:fmtScheme>`;
}
function parseFormatScheme(el, ctx) {
  if (!el) return void 0;
  const result = {
    fillStyles: [],
    lineStyles: [],
    effectStyles: [],
    backgroundFillStyles: []
  };
  const name = el.attributes?.["name"];
  if (name) result.name = String(name);
  const fillStyleLst = findChild(el, "a:fillStyleLst");
  if (fillStyleLst) for (const child of fillStyleLst.elements ?? []) {
    const fill2 = fillDesc.parse(child, ctx);
    if (fill2) result.fillStyles.push(fill2);
  }
  const lnStyleLst = findChild(el, "a:lnStyleLst");
  if (lnStyleLst) for (const child of lnStyleLst.elements ?? []) {
    if (child.name !== "a:ln") continue;
    const line = outlineDesc.parse(child, ctx);
    if (line) result.lineStyles.push(line);
  }
  const effectStyleLst = findChild(el, "a:effectStyleLst");
  if (effectStyleLst) for (const child of effectStyleLst.elements ?? []) {
    if (child.name !== "a:effectStyle") continue;
    const effect = parseEffectStyle(child, ctx);
    if (effect) result.effectStyles.push(effect);
  }
  const bgFillStyleLst = findChild(el, "a:bgFillStyleLst");
  if (bgFillStyleLst) for (const child of bgFillStyleLst.elements ?? []) {
    const fill2 = fillDesc.parse(child, ctx);
    if (fill2) result.backgroundFillStyles.push(fill2);
  }
  return result;
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/color-mapping-CFF0vRSe.mjs
var MAPPING_ATTRS = [
  {
    attr: "bg1",
    key: "background1"
  },
  {
    attr: "tx1",
    key: "text1"
  },
  {
    attr: "bg2",
    key: "background2"
  },
  {
    attr: "tx2",
    key: "text2"
  },
  {
    attr: "accent1",
    key: "accent1"
  },
  {
    attr: "accent2",
    key: "accent2"
  },
  {
    attr: "accent3",
    key: "accent3"
  },
  {
    attr: "accent4",
    key: "accent4"
  },
  {
    attr: "accent5",
    key: "accent5"
  },
  {
    attr: "accent6",
    key: "accent6"
  },
  {
    attr: "hlink",
    key: "hyperlink"
  },
  {
    attr: "folHlink",
    key: "followedHyperlink"
  }
];
var COLOR_SCHEME_INDEX_TO_XML = {
  dark1: "dk1",
  light1: "lt1",
  dark2: "dk2",
  light2: "lt2",
  accent1: "accent1",
  accent2: "accent2",
  accent3: "accent3",
  accent4: "accent4",
  accent5: "accent5",
  accent6: "accent6",
  hyperlink: "hlink",
  followedHyperlink: "folHlink"
};
var XML_TO_COLOR_SCHEME_INDEX = Object.fromEntries(Object.entries(COLOR_SCHEME_INDEX_TO_XML).map(([key, value]) => [value, key]));
var DEFAULT_COLOR_MAPPING = {
  background1: "light1",
  text1: "dark1",
  background2: "light2",
  text2: "dark2",
  accent1: "accent1",
  accent2: "accent2",
  accent3: "accent3",
  accent4: "accent4",
  accent5: "accent5",
  accent6: "accent6",
  hyperlink: "hyperlink",
  followedHyperlink: "followedHyperlink"
};
function stringifyColorMapping(opts, elementName = "a:clrMap") {
  const merged = {
    ...DEFAULT_COLOR_MAPPING,
    ...opts
  };
  return `<${elementName} ${MAPPING_ATTRS.map(({ attr: attr2, key }) => {
    const value = COLOR_SCHEME_INDEX_TO_XML[merged[key]];
    return `${attr2}="${escapeXml(value)}"`;
  }).join(" ")}/>`;
}
function parseColorMapping(el) {
  if (!el?.attributes) return void 0;
  const result = {};
  for (const { attr: attr2, key } of MAPPING_ATTRS) {
    const value = el.attributes[attr2];
    if (value === void 0) continue;
    const parsed = XML_TO_COLOR_SCHEME_INDEX[String(value)];
    if (parsed !== void 0) result[key] = parsed;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/chart-DED4tXC9.mjs
var ChartCollection = class {
  map;
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  addChart(key, chartData) {
    this.map.set(key, chartData);
  }
  get array() {
    return [...this.map.values()];
  }
};
var CHART_TYPE_TAGS = {
  column: "c:barChart",
  bar: "c:barChart",
  line: "c:lineChart",
  pie: "c:pieChart",
  area: "c:areaChart",
  scatter: "c:scatterChart",
  bubble: "c:bubbleChart",
  doughnut: "c:doughnutChart",
  radar: "c:radarChart",
  stock: "c:stockChart",
  surface: "c:surfaceChart",
  ofPie: "c:ofPieChart"
};
var CHART_TYPE_TAGS_3D = {
  column: "c:bar3DChart",
  bar: "c:bar3DChart",
  line: "c:line3DChart",
  pie: "c:pie3DChart",
  area: "c:area3DChart"
};
var NO_AXES_TYPES = /* @__PURE__ */ new Set([
  "pie",
  "doughnut",
  "ofPie"
]);
var TAG_TO_CHART_TYPE = {
  "c:barChart": { type: "column" },
  "c:bar3DChart": {
    type: "column",
    threeD: true
  },
  "c:lineChart": { type: "line" },
  "c:line3DChart": {
    type: "line",
    threeD: true
  },
  "c:pieChart": { type: "pie" },
  "c:pie3DChart": {
    type: "pie",
    threeD: true
  },
  "c:areaChart": { type: "area" },
  "c:area3DChart": {
    type: "area",
    threeD: true
  },
  "c:scatterChart": { type: "scatter" },
  "c:bubbleChart": { type: "bubble" },
  "c:doughnutChart": { type: "doughnut" },
  "c:radarChart": { type: "radar" },
  "c:stockChart": { type: "stock" },
  "c:surfaceChart": { type: "surface" },
  "c:surface3DChart": {
    type: "surface",
    threeD: true
  },
  "c:ofPieChart": { type: "ofPie" }
};
function attrVal(name, value) {
  return `${name}="${escapeXml(String(value))}"`;
}
function emptyEl(tag) {
  return `<${tag}/>`;
}
function valEl(tag, value) {
  return `<${tag} ${attrVal("val", value)}/>`;
}
function boolVal(value) {
  return ` val="${value === false ? 0 : 1}"`;
}
function stringifyNumLit(value) {
  return `<c:numLit><c:formatCode>General</c:formatCode><c:ptCount val="1"/><c:pt idx="0"><c:v>${value}</c:v></c:pt></c:numLit>`;
}
function stringifyTrendline(opts) {
  const parts = [];
  if (opts.name !== void 0) parts.push(`<c:name>${escapeXml(opts.name)}</c:name>`);
  parts.push(valEl("c:trendlineType", xsdTrendlineType.to(opts.type ?? "linear")));
  if (opts.order !== void 0) parts.push(valEl("c:order", opts.order));
  if (opts.period !== void 0) parts.push(valEl("c:period", opts.period));
  if (opts.forward !== void 0) parts.push(valEl("c:forward", opts.forward));
  if (opts.backward !== void 0) parts.push(valEl("c:backward", opts.backward));
  if (opts.intercept !== void 0) parts.push(valEl("c:intercept", opts.intercept));
  if (opts.dispRSqr !== void 0) parts.push(`<c:dispRSqr${boolVal(opts.dispRSqr)}/>`);
  if (opts.dispEq !== void 0) parts.push(`<c:dispEq${boolVal(opts.dispEq)}/>`);
  const labelFmt = opts.label?.numberFormat;
  if (labelFmt !== void 0) parts.push(`<c:trendlineLbl><c:numFmt formatCode="${escapeXml(labelFmt)}" sourceLinked="0"/></c:trendlineLbl>`);
  return `<c:trendline>${parts.join("")}</c:trendline>`;
}
function stringifyErrBars(opts) {
  const parts = [];
  if (opts.direction === "x" || opts.direction === "y") parts.push(valEl("c:errDir", opts.direction));
  parts.push(valEl("c:errBarType", opts.barType ?? "both"));
  parts.push(valEl("c:errValType", xsdErrorValueType.to(opts.valueType ?? "fixedValue")));
  if (opts.noEndCap !== void 0) parts.push(`<c:noEndCap${boolVal(opts.noEndCap)}/>`);
  if (opts.plusValue !== void 0) parts.push(`<c:plus>${stringifyNumLit(opts.plusValue)}</c:plus>`);
  if (opts.minusValue !== void 0) parts.push(`<c:minus>${stringifyNumLit(opts.minusValue)}</c:minus>`);
  if (opts.value !== void 0) parts.push(valEl("c:val", opts.value));
  return `<c:errBars>${parts.join("")}</c:errBars>`;
}
function stringifyDataLabel(opts, ctx) {
  if (opts.delete) return `<c:dLbl><c:idx val="${opts.index}"/><c:delete val="1"/></c:dLbl>`;
  const inner = [];
  if (opts.layout === true) inner.push("<c:layout/>");
  else if (opts.layout) inner.push(stringifyLayout(opts.layout));
  if (opts.text) inner.push(`<c:tx><c:rich>${textBodyDesc.stringify(opts.text, ctx) ?? ""}</c:rich></c:tx>`);
  if (opts.numberFormat !== void 0) inner.push(`<c:numFmt formatCode="${escapeXml(opts.numberFormat)}" sourceLinked="0"/>`);
  inner.push(chartSpPr(opts.shapeProperties, ctx));
  if (opts.textProperties) inner.push(`<c:txPr>${textBodyDesc.stringify(opts.textProperties, ctx) ?? ""}</c:txPr>`);
  if (opts.position !== void 0) inner.push(valEl("c:dLblPos", xsdDataLabelPosition.to(opts.position)));
  if (opts.showLegendKey !== void 0) inner.push(`<c:showLegendKey${boolVal(opts.showLegendKey)}/>`);
  if (opts.showVal !== void 0) inner.push(`<c:showVal${boolVal(opts.showVal)}/>`);
  if (opts.showCatName !== void 0) inner.push(`<c:showCatName${boolVal(opts.showCatName)}/>`);
  if (opts.showSerName !== void 0) inner.push(`<c:showSerName${boolVal(opts.showSerName)}/>`);
  if (opts.showPercent !== void 0) inner.push(`<c:showPercent${boolVal(opts.showPercent)}/>`);
  if (opts.showBubbleSize !== void 0) inner.push(`<c:showBubbleSize${boolVal(opts.showBubbleSize)}/>`);
  if (opts.separator !== void 0) inner.push(`<c:separator>${escapeXml(opts.separator)}</c:separator>`);
  return `<c:dLbl><c:idx val="${opts.index}"/>${inner.join("")}</c:dLbl>`;
}
function stringifyDataLabels(opts, ctx) {
  const parts = [];
  if (opts.labels) for (const lbl of opts.labels) parts.push(stringifyDataLabel(lbl, ctx));
  if (opts.delete !== void 0) parts.push(`<c:delete${boolVal(opts.delete)}/>`);
  if (opts.numberFormat !== void 0) parts.push(`<c:numFmt formatCode="${escapeXml(opts.numberFormat)}" sourceLinked="0"/>`);
  parts.push(chartSpPr(opts.shapeProperties, ctx));
  if (opts.textProperties) parts.push(`<c:txPr>${textBodyDesc.stringify(opts.textProperties, ctx) ?? ""}</c:txPr>`);
  if (opts.position !== void 0) parts.push(valEl("c:dLblPos", xsdDataLabelPosition.to(opts.position)));
  if (opts.showLegendKey !== void 0) parts.push(`<c:showLegendKey${boolVal(opts.showLegendKey)}/>`);
  if (opts.showVal !== void 0) parts.push(`<c:showVal${boolVal(opts.showVal)}/>`);
  if (opts.showCatName !== void 0) parts.push(`<c:showCatName${boolVal(opts.showCatName)}/>`);
  if (opts.showSerName !== void 0) parts.push(`<c:showSerName${boolVal(opts.showSerName)}/>`);
  if (opts.showPercent !== void 0) parts.push(`<c:showPercent${boolVal(opts.showPercent)}/>`);
  if (opts.showBubbleSize !== void 0) parts.push(`<c:showBubbleSize${boolVal(opts.showBubbleSize)}/>`);
  if (opts.separator !== void 0) parts.push(`<c:separator>${escapeXml(opts.separator)}</c:separator>`);
  if (opts.delete === void 0) {
    if (opts.showLeaderLines !== void 0) parts.push(`<c:showLeaderLines${boolVal(opts.showLeaderLines)}/>`);
    if (opts.leaderLines) parts.push(emptyEl("c:leaderLines"));
  }
  return `<c:dLbls>${parts.join("")}</c:dLbls>`;
}
function stringifyView3D(opts) {
  const parts = [];
  if (opts.rotX !== void 0) parts.push(valEl("c:rotX", opts.rotX));
  if (opts.hPercent !== void 0) parts.push(valEl("c:hPercent", opts.hPercent));
  if (opts.rotY !== void 0) parts.push(valEl("c:rotY", opts.rotY));
  if (opts.depthPercent !== void 0) parts.push(valEl("c:depthPercent", opts.depthPercent));
  if (opts.rAngAx !== void 0) parts.push(`<c:rAngAx${boolVal(opts.rAngAx)}/>`);
  if (opts.perspective !== void 0) parts.push(valEl("c:perspective", opts.perspective));
  return `<c:view3D>${parts.join("")}</c:view3D>`;
}
function stringifyLayout(manualLayout) {
  if (!manualLayout) return emptyEl("c:layout");
  const parts = [];
  if (manualLayout.layoutTarget !== void 0) parts.push(valEl("c:layoutTarget", manualLayout.layoutTarget));
  if (manualLayout.xMode !== void 0) parts.push(valEl("c:xMode", manualLayout.xMode));
  if (manualLayout.yMode !== void 0) parts.push(valEl("c:yMode", manualLayout.yMode));
  if (manualLayout.wMode !== void 0) parts.push(valEl("c:wMode", manualLayout.wMode));
  if (manualLayout.hMode !== void 0) parts.push(valEl("c:hMode", manualLayout.hMode));
  if (manualLayout.x !== void 0) parts.push(valEl("c:x", manualLayout.x));
  if (manualLayout.y !== void 0) parts.push(valEl("c:y", manualLayout.y));
  if (manualLayout.w !== void 0) parts.push(valEl("c:w", manualLayout.w));
  if (manualLayout.h !== void 0) parts.push(valEl("c:h", manualLayout.h));
  return `<c:layout><c:manualLayout>${parts.join("")}</c:manualLayout></c:layout>`;
}
function stringifySurface(tag, opts, ctx) {
  if (!opts) return "";
  const parts = [];
  if (opts.thickness !== void 0) parts.push(valEl("c:thickness", typeof opts.thickness === "string" ? Number(opts.thickness.replace("%", "")) : opts.thickness));
  if (opts.shapeProperties) parts.push(chartSpPr(opts.shapeProperties, ctx));
  return parts.length ? `<${tag}>${parts.join("")}</${tag}>` : `<${tag}/>`;
}
var AXIS_TAG = {
  category: "c:catAx",
  value: "c:valAx",
  date: "c:dateAx",
  series: "c:serAx"
};
function stringifyScaling(opts) {
  if (!opts) return emptyEl("c:scaling");
  const parts = [];
  if (opts.logBase !== void 0) parts.push(valEl("c:logBase", opts.logBase));
  if (opts.orientation !== void 0) parts.push(valEl("c:orientation", xsdAxisOrientation.to(opts.orientation)));
  if (opts.max !== void 0) parts.push(valEl("c:max", opts.max));
  if (opts.min !== void 0) parts.push(valEl("c:min", opts.min));
  return `<c:scaling>${parts.join("")}</c:scaling>`;
}
function stringifyDisplayUnits(opts) {
  const parts = [];
  if (opts.customUnit !== void 0) parts.push(valEl("c:custUnit", opts.customUnit));
  else if (opts.builtInUnit !== void 0) parts.push(valEl("c:builtInUnit", opts.builtInUnit));
  if (opts.label) parts.push(emptyEl("c:dispUnitsLbl"));
  return `<c:dispUnits>${parts.join("")}</c:dispUnits>`;
}
function stringifyAxis(opts, ctx) {
  const parts = [];
  parts.push(valEl("c:axId", opts.id));
  parts.push(stringifyScaling(opts.scaling));
  if (opts.delete !== void 0) parts.push(`<c:delete${boolVal(opts.delete)}/>`);
  const axPos = opts.position ?? (opts.kind === "value" ? "left" : "bottom");
  parts.push(valEl("c:axPos", xsdAxisPosition.to(axPos)));
  parts.push(stringifyChartLines("c:majorGridlines", opts.majorGridlines, ctx));
  parts.push(stringifyChartLines("c:minorGridlines", opts.minorGridlines, ctx));
  if (opts.title !== void 0) parts.push(typeof opts.title === "string" && opts.title === "" ? emptyEl("c:title") : stringifyTitle(opts.title, ctx));
  if (opts.numberFormat !== void 0) {
    const fmt = typeof opts.numberFormat === "string" ? { formatCode: opts.numberFormat } : opts.numberFormat;
    const linked = fmt.sourceLinked === void 0 || fmt.sourceLinked ? 1 : 0;
    parts.push(`<c:numFmt formatCode="${escapeXml(fmt.formatCode)}" sourceLinked="${linked}"/>`);
  }
  if (opts.majorTickMark !== void 0) parts.push(valEl("c:majorTickMark", opts.majorTickMark));
  if (opts.minorTickMark !== void 0) parts.push(valEl("c:minorTickMark", opts.minorTickMark));
  if (opts.tickLabelPosition !== void 0) parts.push(valEl("c:tickLblPos", opts.tickLabelPosition));
  parts.push(chartSpPr(opts.shapeProperties, ctx));
  if (opts.textProperties) parts.push(`<c:txPr>${textBodyDesc.stringify(opts.textProperties, ctx) ?? ""}</c:txPr>`);
  parts.push(valEl("c:crossAx", opts.crossAxisId));
  if (opts.crossesAt !== void 0) parts.push(valEl("c:crossesAt", opts.crossesAt));
  else if (opts.crosses !== void 0) parts.push(valEl("c:crosses", xsdAxisCrosses.to(opts.crosses)));
  switch (opts.kind) {
    case "category":
      if (opts.auto !== void 0) parts.push(`<c:auto${boolVal(opts.auto)}/>`);
      if (opts.labelAlignment !== void 0) parts.push(valEl("c:lblAlgn", xsdAxisLabelAlignment.to(opts.labelAlignment)));
      if (opts.labelOffset !== void 0) parts.push(valEl("c:lblOffset", opts.labelOffset));
      if (opts.tickLabelSkip !== void 0) parts.push(valEl("c:tickLblSkip", opts.tickLabelSkip));
      if (opts.tickMarkSkip !== void 0) parts.push(valEl("c:tickMarkSkip", opts.tickMarkSkip));
      if (opts.noMultiLevelLabel !== void 0) parts.push(`<c:noMultiLvlLbl${boolVal(opts.noMultiLevelLabel)}/>`);
      break;
    case "date":
      if (opts.auto !== void 0) parts.push(`<c:auto${boolVal(opts.auto)}/>`);
      if (opts.labelOffset !== void 0) parts.push(valEl("c:lblOffset", opts.labelOffset));
      if (opts.baseTimeUnit !== void 0) parts.push(valEl("c:baseTimeUnit", opts.baseTimeUnit));
      if (opts.majorUnit !== void 0) parts.push(valEl("c:majorUnit", opts.majorUnit));
      if (opts.majorTimeUnit !== void 0) parts.push(valEl("c:majorTimeUnit", opts.majorTimeUnit));
      if (opts.minorUnit !== void 0) parts.push(valEl("c:minorUnit", opts.minorUnit));
      if (opts.minorTimeUnit !== void 0) parts.push(valEl("c:minorTimeUnit", opts.minorTimeUnit));
      break;
    case "series":
      if (opts.tickLabelSkip !== void 0) parts.push(valEl("c:tickLblSkip", opts.tickLabelSkip));
      if (opts.tickMarkSkip !== void 0) parts.push(valEl("c:tickMarkSkip", opts.tickMarkSkip));
      break;
    case "value":
      if (opts.crossBetween !== void 0) parts.push(valEl("c:crossBetween", xsdAxisCrossBetween.to(opts.crossBetween)));
      if (opts.majorUnit !== void 0) parts.push(valEl("c:majorUnit", opts.majorUnit));
      if (opts.minorUnit !== void 0) parts.push(valEl("c:minorUnit", opts.minorUnit));
      if (opts.displayUnits) parts.push(stringifyDisplayUnits(opts.displayUnits));
  }
  const tag = AXIS_TAG[opts.kind];
  return `<${tag}>${parts.join("")}</${tag}>`;
}
function refFormula(formula) {
  return `<c:f>${escapeXml(formula ?? "")}</c:f>`;
}
function stringifyStrRef(values, formula) {
  const pts = values.map((v, i) => `<c:pt idx="${i}"><c:v>${escapeXml(v ?? "")}</c:v></c:pt>`).join("");
  return `<c:strRef>${refFormula(formula)}<c:strCache><c:ptCount ${attrVal("val", values.length)}/>${pts}</c:strCache></c:strRef>`;
}
function stringifyStrLit(values) {
  const pts = values.map((v, i) => `<c:pt idx="${i}"><c:v>${escapeXml(v)}</c:v></c:pt>`).join("");
  return `<c:strLit><c:ptCount ${attrVal("val", values.length)}/>${pts}</c:strLit>`;
}
function stringifyMultiLvlStrRef(levels, formula) {
  const ptCount = levels.reduce((max2, lvl) => Math.max(max2, lvl.length), 0);
  const lvls = levels.map((lvl) => {
    return `<c:lvl>${lvl.map((v, i) => `<c:pt idx="${i}"><c:v>${escapeXml(v)}</c:v></c:pt>`).join("")}</c:lvl>`;
  }).join("");
  return `<c:multiLvlStrRef>${refFormula(formula)}<c:multiLvlStrCache><c:ptCount ${attrVal("val", ptCount)}/>${lvls}</c:multiLvlStrCache></c:multiLvlStrRef>`;
}
function stringifyNumCatRef(values, formula, formatCode) {
  const pts = values.map((v, i) => `<c:pt idx="${i}"><c:v>${escapeXml(v)}</c:v></c:pt>`).join("");
  return `<c:numRef>${refFormula(formula)}<c:numCache><c:formatCode>${escapeXml(formatCode ?? "General")}</c:formatCode><c:ptCount ${attrVal("val", values.length)}/>${pts}</c:numCache></c:numRef>`;
}
function hasCategoryData(opts) {
  return opts.categories !== void 0 || opts.categoryLabels !== void 0 || opts.multiLevelCategories !== void 0 || opts.numericCategories === true;
}
function stringifyCategorySource(opts) {
  if (opts.multiLevelCategories) return stringifyMultiLvlStrRef(opts.multiLevelCategories, opts.categoryFormula);
  if (opts.categoryLabels) return stringifyStrLit(opts.categoryLabels);
  if (opts.numericCategories) return stringifyNumCatRef(opts.categories ?? [], opts.categoryFormula, opts.categoryFormatCode);
  return stringifyStrRef(opts.categories ?? [], opts.categoryFormula);
}
function stringifyNumRef(values, formula, formatCode) {
  const pts = values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("");
  return `<c:numRef>${refFormula(formula)}<c:numCache><c:formatCode>${escapeXml(formatCode ?? "General")}</c:formatCode><c:ptCount ${attrVal("val", values.length)}/>${pts}</c:numCache></c:numRef>`;
}
function stringifyNumLitList(values, formatCode) {
  const pts = values.map((v, i) => `<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join("");
  return `<c:numLit><c:formatCode>${escapeXml(formatCode ?? "General")}</c:formatCode><c:ptCount ${attrVal("val", values.length)}/>${pts}</c:numLit>`;
}
function stringifyUpDownBars(gapWidth) {
  const inner = [];
  if (gapWidth !== void 0) inner.push(valEl("c:gapWidth", gapWidth));
  inner.push(emptyEl("c:upBars"));
  inner.push(emptyEl("c:downBars"));
  return `<c:upDownBars>${inner.join("")}</c:upDownBars>`;
}
function stringifyDataTable(opts, ctx) {
  const parts = [];
  if (opts.showHorizontalBorder !== void 0) parts.push(`<c:showHorzBorder${boolVal(opts.showHorizontalBorder)}/>`);
  if (opts.showVerticalBorder !== void 0) parts.push(`<c:showVertBorder${boolVal(opts.showVerticalBorder)}/>`);
  if (opts.showOutline !== void 0) parts.push(`<c:showOutline${boolVal(opts.showOutline)}/>`);
  if (opts.showLegendKeys !== void 0) parts.push(`<c:showKeys${boolVal(opts.showLegendKeys)}/>`);
  if (opts.shapeProperties) parts.push(chartSpPr(opts.shapeProperties, ctx));
  if (opts.textProperties) parts.push(`<c:txPr>${textBodyDesc.stringify(opts.textProperties, ctx) ?? ""}</c:txPr>`);
  return `<c:dTable>${parts.join("")}</c:dTable>`;
}
function stringifyProtection(opts) {
  const parts = [];
  if (opts.chartObject !== void 0) parts.push(`<c:chartObject val="${opts.chartObject ? 1 : 0}"/>`);
  if (opts.data !== void 0) parts.push(`<c:data val="${opts.data ? 1 : 0}"/>`);
  if (opts.formatting !== void 0) parts.push(`<c:formatting val="${opts.formatting ? 1 : 0}"/>`);
  if (opts.selection !== void 0) parts.push(`<c:selection val="${opts.selection ? 1 : 0}"/>`);
  if (opts.userInterface !== void 0) parts.push(`<c:userInterface val="${opts.userInterface ? 1 : 0}"/>`);
  return `<c:protection>${parts.join("")}</c:protection>`;
}
function stringifyExternalData(opts) {
  if (!opts.relationshipId || /^r?Id?(0|undefined)?$/i.test(opts.relationshipId)) return void 0;
  const auto = opts.autoUpdate !== void 0 ? `<c:autoUpdate val="${opts.autoUpdate ? 1 : 0}"/>` : "";
  return `<c:externalData r:id="${escapeXml(opts.relationshipId)}">${auto}</c:externalData>`;
}
function stringifyHeaderFooter(opts) {
  const parts = [];
  if (opts.oddHeader !== void 0) parts.push(`<c:oddHeader>${escapeXml(opts.oddHeader)}</c:oddHeader>`);
  if (opts.oddFooter !== void 0) parts.push(`<c:oddFooter>${escapeXml(opts.oddFooter)}</c:oddFooter>`);
  if (opts.evenHeader !== void 0) parts.push(`<c:evenHeader>${escapeXml(opts.evenHeader)}</c:evenHeader>`);
  if (opts.evenFooter !== void 0) parts.push(`<c:evenFooter>${escapeXml(opts.evenFooter)}</c:evenFooter>`);
  if (opts.firstHeader !== void 0) parts.push(`<c:firstHeader>${escapeXml(opts.firstHeader)}</c:firstHeader>`);
  if (opts.firstFooter !== void 0) parts.push(`<c:firstFooter>${escapeXml(opts.firstFooter)}</c:firstFooter>`);
  const attrs2 = [];
  if (opts.alignWithMargins !== void 0) attrs2.push(`alignWithMargins="${opts.alignWithMargins ? 1 : 0}"`);
  if (opts.differentOddEven !== void 0) attrs2.push(`differentOddEven="${opts.differentOddEven ? 1 : 0}"`);
  if (opts.differentFirst !== void 0) attrs2.push(`differentFirst="${opts.differentFirst ? 1 : 0}"`);
  const attrStr = attrs2.length ? " " + attrs2.join(" ") : "";
  if (parts.length === 0) return `<c:headerFooter${attrStr}/>`;
  return `<c:headerFooter${attrStr}>${parts.join("")}</c:headerFooter>`;
}
function stringifyPageMargins(opts) {
  return `<c:pageMargins l="${opts.left ?? 0.7}" r="${opts.right ?? 0.7}" t="${opts.top ?? 0.75}" b="${opts.bottom ?? 0.75}" header="${opts.header ?? 0.3}" footer="${opts.footer ?? 0.3}"/>`;
}
function stringifyPageSetup(opts) {
  const attrs2 = [];
  if (opts.paperSize !== void 0) attrs2.push(`paperSize="${opts.paperSize}"`);
  if (opts.paperHeight !== void 0) attrs2.push(`paperHeight="${escapeXml(opts.paperHeight)}"`);
  if (opts.paperWidth !== void 0) attrs2.push(`paperWidth="${escapeXml(opts.paperWidth)}"`);
  if (opts.firstPageNumber !== void 0) attrs2.push(`firstPageNumber="${opts.firstPageNumber}"`);
  if (opts.orientation !== void 0) attrs2.push(`orientation="${opts.orientation}"`);
  if (opts.blackAndWhite !== void 0) attrs2.push(`blackAndWhite="${opts.blackAndWhite ? 1 : 0}"`);
  if (opts.draft !== void 0) attrs2.push(`draft="${opts.draft ? 1 : 0}"`);
  if (opts.useFirstPageNumber !== void 0) attrs2.push(`useFirstPageNumber="${opts.useFirstPageNumber ? 1 : 0}"`);
  if (opts.horizontalDpi !== void 0) attrs2.push(`horizontalDpi="${opts.horizontalDpi}"`);
  if (opts.verticalDpi !== void 0) attrs2.push(`verticalDpi="${opts.verticalDpi}"`);
  if (opts.copies !== void 0) attrs2.push(`copies="${opts.copies}"`);
  if (attrs2.length === 0) return `<c:pageSetup/>`;
  return `<c:pageSetup ${attrs2.join(" ")}/>`;
}
function stringifyPrintSettings(opts) {
  const parts = [];
  if (opts.headerFooter) parts.push(stringifyHeaderFooter(opts.headerFooter));
  if (opts.pageMargins) parts.push(stringifyPageMargins(opts.pageMargins));
  if (opts.pageSetup) parts.push(stringifyPageSetup(opts.pageSetup));
  if (opts.legacyDrawingId !== void 0) parts.push(`<c:legacyDrawingHF r:id="${escapeXml(opts.legacyDrawingId)}"/>`);
  return `<c:printSettings>${parts.join("")}</c:printSettings>`;
}
function chartTypeHeader(opts) {
  const tag = opts.threeD ? CHART_TYPE_TAGS_3D[opts.type] : CHART_TYPE_TAGS[opts.type];
  if (!tag) throw new Error(`Unsupported chart type: ${opts.type}`);
  const headerParts = [];
  switch (opts.type) {
    case "column":
    case "bar":
      headerParts.push(valEl("c:barDir", opts.type === "column" ? "col" : "bar"));
      headerParts.push(valEl("c:grouping", opts.grouping ?? "clustered"));
      break;
    case "line":
    case "area":
      headerParts.push(valEl("c:grouping", opts.grouping ?? "standard"));
      break;
    case "scatter":
      headerParts.push(valEl("c:scatterStyle", "line"));
      break;
    case "radar":
      headerParts.push(valEl("c:radarStyle", opts.radarStyle ?? "standard"));
      break;
    case "ofPie":
      headerParts.push(valEl("c:ofPieType", opts.ofPieType ?? "pie"));
      break;
    case "surface":
      if (opts.wireframe !== void 0) headerParts.push(`<c:wireframe${boolVal(opts.wireframe)}/>`);
  }
  if (opts.varyColors !== void 0) headerParts.push(`<c:varyColors${boolVal(opts.varyColors)}/>`);
  return `<${tag}>${headerParts.join("")}`;
}
function chartTypeFooter(opts, ctx) {
  const tag = opts.threeD ? CHART_TYPE_TAGS_3D[opts.type] : CHART_TYPE_TAGS[opts.type];
  const parts = [];
  switch (opts.type) {
    case "column":
    case "bar":
      if (opts.gapWidth !== void 0) parts.push(valEl("c:gapWidth", opts.gapWidth));
      if (opts.threeD) {
        if (opts.gapDepth !== void 0) parts.push(valEl("c:gapDepth", opts.gapDepth));
        if (opts.shape !== void 0) parts.push(valEl("c:shape", opts.shape));
      } else {
        if (opts.overlap !== void 0) parts.push(valEl("c:overlap", opts.overlap));
        parts.push(stringifyChartLines("c:serLines", opts.seriesLines, ctx));
      }
      break;
    case "line":
      parts.push(stringifyChartLines("c:dropLines", opts.dropLines, ctx));
      if (!opts.threeD) {
        parts.push(stringifyChartLines("c:hiLowLines", opts.highLowLines, ctx));
        if (opts.upDownBars) parts.push(stringifyUpDownBars(opts.upDownBarsGapWidth));
        if (opts.markers !== void 0) parts.push(`<c:marker${boolVal(opts.markers)}/>`);
        if (opts.smooth !== void 0) parts.push(`<c:smooth${boolVal(opts.smooth)}/>`);
      } else if (opts.gapDepth !== void 0) parts.push(valEl("c:gapDepth", opts.gapDepth));
      break;
    case "area":
      parts.push(stringifyChartLines("c:dropLines", opts.dropLines, ctx));
      if (opts.threeD && opts.gapDepth !== void 0) parts.push(valEl("c:gapDepth", opts.gapDepth));
      break;
    case "stock":
      parts.push(stringifyChartLines("c:dropLines", opts.dropLines, ctx));
      parts.push(stringifyChartLines("c:hiLowLines", opts.highLowLines, ctx));
      if (opts.upDownBars) parts.push(stringifyUpDownBars(opts.upDownBarsGapWidth));
      break;
    case "pie":
      if (!opts.threeD && opts.firstSliceAngle !== void 0) parts.push(valEl("c:firstSliceAng", opts.firstSliceAngle));
      break;
    case "doughnut":
      if (opts.firstSliceAngle !== void 0) parts.push(valEl("c:firstSliceAng", opts.firstSliceAngle));
      parts.push(valEl("c:holeSize", opts.holeSize ?? 10));
      break;
    case "bubble":
      if (opts.bubbleScale !== void 0) parts.push(valEl("c:bubbleScale", opts.bubbleScale));
      if (opts.showNegativeBubbles !== void 0) parts.push(`<c:showNegBubbles${boolVal(opts.showNegativeBubbles)}/>`);
      if (opts.sizeRepresents !== void 0) parts.push(valEl("c:sizeRepresents", xsdSizeRepresents.to(opts.sizeRepresents)));
      break;
    case "ofPie":
      if (opts.gapWidth !== void 0) parts.push(valEl("c:gapWidth", opts.gapWidth));
      if (opts.splitType !== void 0) parts.push(valEl("c:splitType", xsdSplitType.to(opts.splitType)));
      if (opts.splitPosition !== void 0) parts.push(valEl("c:splitPos", opts.splitPosition));
      if (opts.customSplitPoints?.length) {
        const pts = opts.customSplitPoints.map((p) => valEl("c:secondPiePt", p)).join("");
        parts.push(`<c:custSplit>${pts}</c:custSplit>`);
      }
      if (opts.secondPieSize !== void 0) parts.push(valEl("c:secondPieSize", opts.secondPieSize));
      parts.push(stringifyChartLines("c:serLines", opts.seriesLines, ctx));
      break;
    case "surface":
      if (opts.bandFormats?.length) parts.push(stringifyBandFormats(opts.bandFormats));
  }
  if (!NO_AXES_TYPES.has(opts.type)) {
    const ids = opts.axes && opts.axisIds ? opts.axisIds : axesFor(opts).map((axis) => axis.id);
    for (const id of ids) parts.push(valEl("c:axId", id));
  }
  return `${parts.join("")}</${tag}>`;
}
function stringifyMarker$1(opts, ctx) {
  const parts = [];
  if (opts.symbol !== void 0) parts.push(valEl("c:symbol", opts.symbol));
  if (opts.size !== void 0) parts.push(valEl("c:size", opts.size));
  parts.push(chartSpPr(opts.shapeProperties, ctx));
  return `<c:marker>${parts.join("")}</c:marker>`;
}
function stringifyPictureOptions(opts) {
  const parts = [];
  if (opts.applyToFront !== void 0) parts.push(`<c:applyToFront${boolVal(opts.applyToFront)}/>`);
  if (opts.applyToSides !== void 0) parts.push(`<c:applyToSides${boolVal(opts.applyToSides)}/>`);
  if (opts.applyToEnd !== void 0) parts.push(`<c:applyToEnd${boolVal(opts.applyToEnd)}/>`);
  if (opts.pictureFormat !== void 0) parts.push(valEl("c:pictureFormat", opts.pictureFormat));
  if (opts.pictureStackUnit !== void 0) parts.push(valEl("c:pictureStackUnit", opts.pictureStackUnit));
  return `<c:pictureOptions>${parts.join("")}</c:pictureOptions>`;
}
function stringifyDataPoint(opts, ctx) {
  const parts = [valEl("c:idx", opts.index)];
  if (opts.invertIfNegative !== void 0) parts.push(`<c:invertIfNegative${boolVal(opts.invertIfNegative)}/>`);
  if (opts.marker) parts.push(stringifyMarker$1(opts.marker, ctx));
  if (opts.bubble3D !== void 0) parts.push(`<c:bubble3D${boolVal(opts.bubble3D)}/>`);
  if (opts.explosion !== void 0) parts.push(valEl("c:explosion", opts.explosion));
  parts.push(chartSpPr(opts.shapeProperties, ctx));
  if (opts.pictureOptions) parts.push(stringifyPictureOptions(opts.pictureOptions));
  return `<c:dPt>${parts.join("")}</c:dPt>`;
}
function stringifySeries(index, series, opts, ctx, groupType) {
  const chartType = groupType ?? opts.type;
  const parts = [];
  const s = series;
  parts.push(valEl("c:idx", s.index ?? index));
  parts.push(valEl("c:order", s.order ?? index));
  if (series.nameLiteral && series.name !== void 0) parts.push(`<c:tx><c:v>${escapeXml(series.name)}</c:v></c:tx>`);
  else if (series.name !== void 0 || series.nameFormula !== void 0) parts.push(`<c:tx>${stringifyStrRef([series.name], series.nameFormula)}</c:tx>`);
  parts.push(chartSpPr(s.shapeProperties, ctx));
  if (chartType === "line" || chartType === "scatter" || chartType === "radar") {
    if (s.marker) parts.push(stringifyMarker$1(s.marker, ctx));
  } else if (chartType === "column" || chartType === "bar") {
    if (s.invertIfNegative !== void 0) parts.push(`<c:invertIfNegative${boolVal(s.invertIfNegative)}/>`);
    if (s.pictureOptions) parts.push(stringifyPictureOptions(s.pictureOptions));
  } else if (chartType === "area") {
    if (s.pictureOptions) parts.push(stringifyPictureOptions(s.pictureOptions));
  } else if (chartType === "bubble") {
    if (s.invertIfNegative !== void 0) parts.push(`<c:invertIfNegative${boolVal(s.invertIfNegative)}/>`);
  } else if (chartType === "pie" || chartType === "doughnut" || chartType === "ofPie") {
    if (s.explosion !== void 0) parts.push(valEl("c:explosion", s.explosion));
  }
  if (s.dataPoints) for (const dp of s.dataPoints) parts.push(stringifyDataPoint(dp, ctx));
  if (s.dataLabels) parts.push(stringifyDataLabels(s.dataLabels, ctx));
  if (s.trendlines) for (const tl of s.trendlines) parts.push(stringifyTrendline(tl));
  if (s.errorBars) parts.push(stringifyErrBars(s.errorBars));
  if (chartType === "bubble") {
    const bs = series;
    parts.push(`<c:xVal>${stringifyNumRef(bs.xValues)}</c:xVal>`);
    parts.push(`<c:yVal>${stringifyNumRef(bs.yValues)}</c:yVal>`);
    parts.push(`<c:bubbleSize>${stringifyNumRef(bs.bubbleSize)}</c:bubbleSize>`);
  } else if (chartType === "scatter") {
    if ("xValues" in series) {
      parts.push(`<c:xVal>${stringifyNumRef(series.xValues)}</c:xVal>`);
      parts.push(`<c:yVal>${stringifyNumRef(series.yValues, series.valueFormula, series.formatCode)}</c:yVal>`);
    } else {
      parts.push(`<c:xVal>${stringifyCategorySource(opts)}</c:xVal>`);
      parts.push(`<c:yVal>${stringifyNumRef(s.values, s.valueFormula, s.formatCode)}</c:yVal>`);
    }
  } else if (hasCategoryData(opts)) {
    parts.push(`<c:cat>${stringifyCategorySource(opts)}</c:cat>`);
    parts.push(`<c:val>${s.valueLiteral ? stringifyNumLitList(s.values, s.formatCode) : stringifyNumRef(s.values, s.valueFormula, s.formatCode)}</c:val>`);
  } else parts.push(`<c:val>${s.valueLiteral ? stringifyNumLitList(s.values, s.formatCode) : stringifyNumRef(s.values, s.valueFormula, s.formatCode)}</c:val>`);
  if ((chartType === "line" || chartType === "scatter") && s.smooth !== void 0) parts.push(`<c:smooth${boolVal(s.smooth)}/>`);
  if ((chartType === "column" || chartType === "bar") && s.shape !== void 0) parts.push(valEl("c:shape", s.shape));
  if (chartType === "bubble" && s.bubble3D !== void 0) parts.push(`<c:bubble3D${boolVal(s.bubble3D)}/>`);
  if (s.ext) parts.push(`<c:extLst>${s.ext}</c:extLst>`);
  return `<c:ser>${parts.join("")}</c:ser>`;
}
function stringifyChartLines(tag, opts, ctx) {
  if (opts === void 0 || opts === false) return "";
  if (opts === true) return emptyEl(tag);
  return `<${tag}>${chartSpPr(opts.shapeProperties, ctx)}</${tag}>`;
}
function readChartLines(parent, tag, ctx) {
  const el = findChild(parent, tag);
  if (!el) return void 0;
  const spPrEl = findChild(el, "c:spPr");
  if (!spPrEl) return true;
  const lines = {};
  const shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  if (shapeProperties) lines.shapeProperties = shapeProperties;
  return lines;
}
function readSecondaryGroup(secondaryEl, ctx) {
  const mapping = TAG_TO_CHART_TYPE[secondaryEl.name ?? ""];
  if (!mapping) return void 0;
  let secType = mapping.type;
  if (secondaryEl.name === "c:barChart" || secondaryEl.name === "c:bar3DChart") {
    const barDir = findChild(secondaryEl, "c:barDir");
    const barDirVal = barDir ? attr(barDir, "val") : void 0;
    if (barDirVal === "bar") secType = "bar";
    else if (barDirVal === "col") secType = "column";
  }
  const g = {
    type: secType,
    series: []
  };
  const grouping = readValStr(secondaryEl, "c:grouping");
  if (grouping) g.grouping = grouping;
  const varyColors = readBoolAttr(secondaryEl, "c:varyColors");
  if (varyColors !== void 0) g.varyColors = varyColors;
  const groupLabels = readDataLabels(secondaryEl, ctx);
  if (groupLabels) g.dataLabels = groupLabels;
  if (secType === "bar" || secType === "column") {
    const gapWidth = readValNum(secondaryEl, "c:gapWidth");
    if (gapWidth !== void 0) g.gapWidth = gapWidth;
    if (!mapping.threeD) {
      const overlap = readValNum(secondaryEl, "c:overlap");
      if (overlap !== void 0) g.overlap = overlap;
    } else {
      const gapDepth = readValNum(secondaryEl, "c:gapDepth");
      if (gapDepth !== void 0) g.gapDepth = gapDepth;
    }
    const seriesLines = readChartLines(secondaryEl, "c:serLines", ctx);
    if (seriesLines !== void 0) g.seriesLines = seriesLines;
  } else if (secType === "line") {
    const dropLines = readChartLines(secondaryEl, "c:dropLines", ctx);
    if (dropLines !== void 0) g.dropLines = dropLines;
    const highLowLines = readChartLines(secondaryEl, "c:hiLowLines", ctx);
    if (highLowLines !== void 0) g.highLowLines = highLowLines;
    const upDownBars = findChild(secondaryEl, "c:upDownBars");
    if (upDownBars) {
      g.upDownBars = true;
      const gw = readValNum(upDownBars, "c:gapWidth");
      if (gw !== void 0) g.upDownBarsGapWidth = gw;
    }
    const markers = readBoolAttr(secondaryEl, "c:marker");
    if (markers !== void 0) g.markers = markers;
    const smooth = readBoolAttr(secondaryEl, "c:smooth");
    if (smooth !== void 0) g.smooth = smooth;
  } else if (secType === "area") {
    const dropLines = readChartLines(secondaryEl, "c:dropLines", ctx);
    if (dropLines !== void 0) g.dropLines = dropLines;
  }
  const secAxIds = children(secondaryEl, "c:axId");
  if (secAxIds.length > 0) {
    const ids = secAxIds.map((e) => Number(attr(e, "val"))).filter((n) => !isNaN(n));
    if (ids.length > 0) g.axisIds = ids;
  }
  const secSeries = [];
  for (const serEl of children(secondaryEl, "c:ser")) {
    const { name, literal: nameLiteral } = readSeriesName(serEl);
    const txEl = findChild(serEl, "c:tx");
    const nameFormula = txEl ? readRefMeta(txEl).formula : void 0;
    const valueEl = findChild(serEl, "c:val") ?? findChild(serEl, "c:yVal");
    const valueLiteral = valueEl ? findChild(valueEl, "c:numLit") !== void 0 : false;
    const values = valueEl ? readNumCache(valueEl) : [];
    const valMeta = valueEl ? readRefMeta(valueEl) : {};
    secSeries.push({
      name,
      ...nameLiteral ? { nameLiteral } : {},
      ...nameFormula ? { nameFormula } : {},
      ...valueLiteral ? { valueLiteral } : {},
      ...valMeta.formula ? { valueFormula: valMeta.formula } : {},
      ...valMeta.formatCode ? { formatCode: valMeta.formatCode } : {},
      values,
      ...readSeriesCommon(serEl, ctx)
    });
  }
  g.series = secSeries;
  return g;
}
function stringifySecondaryGroup(g, opts, ctx) {
  const parts = [chartTypeHeader(g)];
  for (const [i, series] of (g.series ?? []).entries()) parts.push(stringifySeries(i, series, opts, ctx, g.type));
  if (g.dataLabels) parts.push(stringifyDataLabels(g.dataLabels, ctx));
  switch (g.type) {
    case "bar":
    case "column":
      if (g.gapWidth !== void 0) parts.push(valEl("c:gapWidth", g.gapWidth));
      if (g.overlap !== void 0) parts.push(valEl("c:overlap", g.overlap));
      parts.push(stringifyChartLines("c:serLines", g.seriesLines, ctx));
      break;
    case "line":
      parts.push(stringifyChartLines("c:dropLines", g.dropLines, ctx));
      parts.push(stringifyChartLines("c:hiLowLines", g.highLowLines, ctx));
      if (g.upDownBars) parts.push(stringifyUpDownBars(g.upDownBarsGapWidth));
      if (g.markers !== void 0) parts.push(`<c:marker${boolVal(g.markers)}/>`);
      if (g.smooth !== void 0) parts.push(`<c:smooth${boolVal(g.smooth)}/>`);
      break;
    case "area":
      parts.push(stringifyChartLines("c:dropLines", g.dropLines, ctx));
  }
  for (const id of g.axisIds ?? []) parts.push(valEl("c:axId", id));
  return `${parts.join("")}</${CHART_TYPE_TAGS[g.type]}>`;
}
function stringifyTitle(title, ctx) {
  if (typeof title !== "string") {
    const parts = [];
    if (title.text !== void 0) parts.push(typeof title.text === "string" ? `<c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${escapeXml(title.text)}</a:t></a:r></a:p></c:rich></c:tx>` : `<c:tx><c:rich>${textBodyDesc.stringify(title.text, ctx) ?? ""}</c:rich></c:tx>`);
    if (title.layout !== void 0) parts.push(title.layout === true ? "<c:layout/>" : stringifyLayout(title.layout));
    if (title.overlay !== void 0) parts.push(`<c:overlay${boolVal(title.overlay)}/>`);
    if (title.shapeProperties) parts.push(chartSpPr(title.shapeProperties, ctx));
    if (title.textProperties) parts.push(`<c:txPr>${textBodyDesc.stringify(title.textProperties, ctx) ?? ""}</c:txPr>`);
    return `<c:title>${parts.join("")}</c:title>`;
  }
  return `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${escapeXml(title)}</a:t></a:r></a:p></c:rich></c:tx></c:title>`;
}
function stringifyLegendEntry(entry, ctx) {
  if (entry.delete) return `<c:legendEntry><c:idx val="${entry.index}"/><c:delete val="1"/></c:legendEntry>`;
  if (entry.textProperties) {
    const txPr = textBodyDesc.stringify(entry.textProperties, ctx) ?? "";
    return `<c:legendEntry><c:idx val="${entry.index}"/><c:txPr>${txPr}</c:txPr></c:legendEntry>`;
  }
  return "";
}
function stringifyLegend(opts, ctx) {
  return `<c:legend>${opts.legendPosition !== void 0 ? `<c:legendPos val="${xsdLegendPosition.to(opts.legendPosition)}"/>` : opts.showLegend === true ? "" : `<c:legendPos val="b"/>`}${(opts.legendEntries ?? []).map((e) => stringifyLegendEntry(e, ctx)).join("")}${opts.legendLayout === true ? "<c:layout/>" : opts.legendLayout ? stringifyLayout(opts.legendLayout) : ""}${opts.legendOverlay !== void 0 ? `<c:overlay${boolVal(opts.legendOverlay)}/>` : ""}${chartSpPr(opts.legendShapeProperties, ctx)}${opts.legendTextProperties ? `<c:txPr>${textBodyDesc.stringify(opts.legendTextProperties, ctx) ?? ""}</c:txPr>` : ""}</c:legend>`;
}
function stringifyPivotSource(opts) {
  return `<c:pivotSource><c:name>${escapeXml(opts.name)}</c:name><c:fmtId val="${opts.formatId}"/></c:pivotSource>`;
}
function stringifyPivotFormats(formats, ctx) {
  return `<c:pivotFmts>${formats.map((f) => {
    let entry = `<c:idx val="${f.index}"/>`;
    if (f.marker) entry += stringifyMarker$1(f.marker, ctx);
    return `<c:pivotFmt>${entry}</c:pivotFmt>`;
  }).join("")}</c:pivotFmts>`;
}
function stringifyBandFormats(formats) {
  return `<c:bandFmts>${formats.map((f) => `<c:bandFmt><c:idx val="${f.index}"/></c:bandFmt>`).join("")}</c:bandFmts>`;
}
function chartSpPr(opts, ctx) {
  if (!opts) return "";
  return `<c:spPr>${shapePropertiesDesc.stringify(opts, ctx) ?? ""}</c:spPr>`;
}
function categoryAxis(id, crossAxisId) {
  return {
    kind: "category",
    id,
    crossAxisId,
    scaling: { orientation: "ascending" },
    delete: false,
    position: "bottom",
    crosses: "zero",
    auto: true,
    labelOffset: 100,
    noMultiLevelLabel: false
  };
}
function valueAxis(id, crossAxisId) {
  return {
    kind: "value",
    id,
    crossAxisId,
    scaling: { orientation: "ascending" },
    delete: false,
    position: "left",
    numberFormat: "General",
    crosses: "zero"
  };
}
function seriesAxis(id, crossAxisId) {
  return {
    kind: "series",
    id,
    crossAxisId,
    scaling: { orientation: "ascending" },
    delete: false,
    position: "bottom",
    numberFormat: "General",
    crosses: "zero",
    tickLabelSkip: 1
  };
}
function defaultAxesFor(chartType, threeD) {
  if (NO_AXES_TYPES.has(chartType)) return [];
  if (chartType === "scatter" || chartType === "bubble") return [valueAxis(10, 20), valueAxis(20, 10)];
  if (chartType === "surface") return [
    categoryAxis(10, 20),
    valueAxis(20, 10),
    seriesAxis(30, 10)
  ];
  if (chartType === "stock") return [categoryAxis(10, 20), valueAxis(20, 10)];
  if (threeD) return [
    categoryAxis(10, 20),
    valueAxis(20, 10),
    seriesAxis(30, 10)
  ];
  return [categoryAxis(10, 20), valueAxis(20, 10)];
}
function axesFor(opts) {
  if (!opts.axes) return defaultAxesFor(opts.type, opts.threeD);
  const slots = defaultAxesFor(opts.type, opts.threeD);
  return opts.axes.map((axis, i) => {
    const slot = slots[i] ?? slots[slots.length - 1];
    return {
      ...axis,
      id: axis.id ?? slot.id,
      crossAxisId: axis.crossAxisId ?? slot.crossAxisId
    };
  });
}
function stringifyAxes(opts, ctx) {
  return axesFor(opts).map((axis) => stringifyAxis(axis, ctx)).join("");
}
function readStrCache(el) {
  const strRef = findChild(el, "c:strRef");
  if (!strRef) return [];
  const strCache = findChild(strRef, "c:strCache");
  if (!strCache?.elements) return [];
  const result = [];
  for (const pt of strCache.elements) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    const text = v ? textOf(v) : "";
    if (text !== "") result.push(text);
  }
  return result;
}
function readNumCacheText(el) {
  const numRef = findChild(el, "c:numRef");
  if (!numRef) return [];
  const numCache = findChild(numRef, "c:numCache");
  if (!numCache?.elements) return [];
  const result = [];
  for (const pt of numCache.elements) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    const text = v ? textOf(v) ?? "" : "";
    result.push(text);
  }
  return result;
}
function readRefMeta(el) {
  const strRef = findChild(el, "c:strRef");
  const numRef = strRef ? void 0 : findChild(el, "c:numRef");
  const ref = strRef ?? numRef;
  const meta = {};
  if (ref) {
    const f = findChild(ref, "c:f");
    const text = f ? textOf(f) : "";
    if (text) meta.formula = text;
  }
  if (numRef) {
    const cache = findChild(numRef, "c:numCache");
    const fc = cache ? findChild(cache, "c:formatCode") : void 0;
    const text = fc ? textOf(fc) : "";
    if (text) meta.formatCode = text;
  }
  const numLit = strRef || numRef ? void 0 : findChild(el, "c:numLit");
  if (numLit) {
    const fc = findChild(numLit, "c:formatCode");
    const text = fc ? textOf(fc) : "";
    if (text) meta.formatCode = text;
  }
  return meta;
}
function readStrLit(el) {
  const strLit = findChild(el, "c:strLit");
  if (!strLit) return void 0;
  const result = [];
  for (const pt of strLit.elements ?? []) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    const text = v ? textOf(v) : "";
    if (text !== "") result.push(text);
  }
  return result;
}
function readMultiLvlStrCache(el) {
  const ref = findChild(el, "c:multiLvlStrRef");
  if (!ref) return void 0;
  const cache = findChild(ref, "c:multiLvlStrCache");
  if (!cache) return [];
  const levels = [];
  for (const lvl of cache.elements ?? []) {
    if (lvl.name !== "c:lvl") continue;
    const level = [];
    for (const pt of lvl.elements ?? []) if (pt.name === "c:pt") {
      const v = findChild(pt, "c:v");
      const text = v ? textOf(v) : "";
      if (text !== "") level.push(text);
    }
    levels.push(level);
  }
  return levels;
}
function readNumLitPoints(numLit) {
  const result = [];
  for (const pt of numLit.elements ?? []) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    const text = v ? textOf(v) : "";
    if (text !== "") result.push(Number(text));
  }
  return result;
}
function hasNumericXRef(serEl) {
  const xVal = findChild(serEl, "c:xVal");
  return xVal !== void 0 && (findChild(xVal, "c:numRef") !== void 0 || findChild(xVal, "c:numLit") !== void 0);
}
function readNumCache(el) {
  const numLit = findChild(el, "c:numLit");
  if (numLit) return readNumLitPoints(numLit);
  const numRef = findChild(el, "c:numRef");
  if (!numRef) return [];
  const numCache = findChild(numRef, "c:numCache");
  if (!numCache?.elements) return [];
  const result = [];
  for (const pt of numCache.elements) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    const text = v ? textOf(v) : "";
    if (text !== "") result.push(Number(text));
  }
  return result;
}
function readSeriesName(serEl) {
  const tx = findChild(serEl, "c:tx");
  if (!tx) return {
    name: void 0,
    literal: false
  };
  const v = findChild(tx, "c:v");
  if (v && !findChild(tx, "c:strRef")) {
    const text = textOf(v);
    return {
      name: text !== "" ? text : void 0,
      literal: true
    };
  }
  return {
    name: readStrCache(tx)[0] ?? "",
    literal: false
  };
}
function readTitleBody(titleEl, ctx) {
  const rich = findChild(findChild(titleEl, "c:tx") ?? titleEl, "c:rich");
  if (!rich) return void 0;
  return collapseTitleBody(textBodyDesc.parse(rich, ctx));
}
function collapseTitleBody(body) {
  if (body.listStyle !== void 0) return body;
  if (body.bodyProperties !== void 0 && Object.keys(body.bodyProperties).length > 0) return body;
  const ps = body.paragraphs ?? [];
  if (ps.length !== 1) return body;
  const p = ps[0];
  if (p === void 0) return body;
  if (typeof p === "string") return p;
  if (p.properties !== void 0 || p.children !== void 0) return body;
  if (p.endParagraphProperties !== void 0 && p.endParagraphProperties !== false) return body;
  return p.text ?? "";
}
function readTitle(titleEl, ctx) {
  const body = readTitleBody(titleEl, ctx);
  const text = body === void 0 ? readTitleText(titleEl) : void 0;
  const layoutEl = findChild(titleEl, "c:layout");
  const overlayEl = findChild(titleEl, "c:overlay");
  const spPrEl = findChild(titleEl, "c:spPr");
  const txPrEl = findChild(titleEl, "c:txPr");
  if (!layoutEl && !overlayEl && !spPrEl && !txPrEl) {
    if (typeof body === "string" || body === void 0) return body ?? text ?? "";
    return { text: body };
  }
  const title = {};
  if (body !== void 0) title.text = body;
  else if (text !== void 0) title.text = text;
  if (layoutEl) title.layout = readManualLayout(layoutEl) ?? true;
  if (overlayEl) title.overlay = parseOnOff(attr(overlayEl, "val")) ?? false;
  if (spPrEl) title.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  if (txPrEl) title.textProperties = textBodyDesc.parse(txPrEl, ctx);
  return title;
}
function readTitleText(titleEl) {
  const tx = findChild(titleEl, "c:tx");
  if (!tx?.elements) return void 0;
  for (const child of tx.elements) {
    if (child.name !== "c:rich") continue;
    for (const sub of child.elements ?? []) {
      if (sub.name !== "a:p") continue;
      for (const r of sub.elements ?? []) {
        if (r.name !== "a:r") continue;
        const t = findChild(r, "a:t");
        if (t) {
          const text = textOf(t);
          if (text) return text;
        }
      }
    }
  }
}
function readBoolAttr(el, childName) {
  const child = findChild(el, childName);
  if (!child) return void 0;
  const v = attr(child, "val");
  if (v === void 0) return true;
  return parseOnOff(v) ?? true;
}
function readValNum(el, childName) {
  const child = findChild(el, childName);
  if (!child) return void 0;
  const v = attr(child, "val");
  return v !== void 0 ? Number(v) : void 0;
}
function readValStr(el, childName) {
  const child = findChild(el, childName);
  if (!child) return void 0;
  return attr(child, "val") ?? void 0;
}
function readNumLit(el, childName) {
  const child = findChild(el, childName);
  if (!child) return void 0;
  const numLit = findChild(child, "c:numLit");
  if (!numLit?.elements) return void 0;
  for (const pt of numLit.elements) if (pt.name === "c:pt") {
    const v = findChild(pt, "c:v");
    if (v) {
      const text = textOf(v);
      if (text) return Number(text);
    }
  }
}
function readTrendlines(serEl) {
  const tlEls = children(serEl, "c:trendline");
  if (tlEls.length === 0) return void 0;
  return tlEls.map((tl) => {
    const opts = {};
    const type = readValStr(tl, "c:trendlineType");
    if (type) opts.type = xsdTrendlineType.from(type);
    const order = readValNum(tl, "c:order");
    if (order !== void 0) opts.order = order;
    const period = readValNum(tl, "c:period");
    if (period !== void 0) opts.period = period;
    const forward = readValNum(tl, "c:forward");
    if (forward !== void 0) opts.forward = forward;
    const backward = readValNum(tl, "c:backward");
    if (backward !== void 0) opts.backward = backward;
    const intercept = readValNum(tl, "c:intercept");
    if (intercept !== void 0) opts.intercept = intercept;
    const dispRSqr = readBoolAttr(tl, "c:dispRSqr");
    if (dispRSqr !== void 0) opts.dispRSqr = dispRSqr;
    const dispEq = readBoolAttr(tl, "c:dispEq");
    if (dispEq !== void 0) opts.dispEq = dispEq;
    const nameEl = findChild(tl, "c:name");
    const nameText = textOf(nameEl);
    if (nameText) opts.name = nameText;
    const labelFmt = attr(findChild(findChild(tl, "c:trendlineLbl"), "c:numFmt"), "formatCode");
    if (labelFmt) opts.label = { numberFormat: labelFmt };
    return opts;
  });
}
function readErrBars(serEl) {
  const ebEl = findChild(serEl, "c:errBars");
  if (!ebEl) return void 0;
  const opts = {};
  const direction = readValStr(ebEl, "c:errDir");
  if (direction) opts.direction = direction;
  const barType = readValStr(ebEl, "c:errBarType");
  if (barType) opts.barType = barType;
  const valueType = readValStr(ebEl, "c:errValType");
  if (valueType) opts.valueType = xsdErrorValueType.from(valueType);
  const noEndCap = readBoolAttr(ebEl, "c:noEndCap");
  if (noEndCap !== void 0) opts.noEndCap = noEndCap;
  const plusValue = readNumLit(ebEl, "c:plus");
  if (plusValue !== void 0) opts.plusValue = plusValue;
  const minusValue = readNumLit(ebEl, "c:minus");
  if (minusValue !== void 0) opts.minusValue = minusValue;
  const value = readValNum(ebEl, "c:val");
  if (value !== void 0) opts.value = value;
  return opts;
}
function readDataLabels(serEl, ctx) {
  const dlEl = findChild(serEl, "c:dLbls");
  if (!dlEl) return void 0;
  const opts = {};
  const groupDelete = readBoolAttr(dlEl, "c:delete");
  if (groupDelete !== void 0) opts.delete = groupDelete;
  const numFmt = attr(findChild(dlEl, "c:numFmt"), "formatCode");
  if (numFmt) opts.numberFormat = numFmt;
  const dlSpPr = findChild(dlEl, "c:spPr");
  if (dlSpPr) {
    const shapeProperties = shapePropertiesDesc.parse(dlSpPr, ctx);
    if (shapeProperties) opts.shapeProperties = shapeProperties;
  }
  const dlTxPr = findChild(dlEl, "c:txPr");
  if (dlTxPr) {
    const textProperties = textBodyDesc.parse(dlTxPr, ctx);
    if (textProperties) opts.textProperties = textProperties;
  }
  const position = readValStr(dlEl, "c:dLblPos");
  if (position) opts.position = xsdDataLabelPosition.from(position);
  const showLegendKey = readBoolAttr(dlEl, "c:showLegendKey");
  if (showLegendKey !== void 0) opts.showLegendKey = showLegendKey;
  const showVal = readBoolAttr(dlEl, "c:showVal");
  if (showVal !== void 0) opts.showVal = showVal;
  const showCatName = readBoolAttr(dlEl, "c:showCatName");
  if (showCatName !== void 0) opts.showCatName = showCatName;
  const showSerName = readBoolAttr(dlEl, "c:showSerName");
  if (showSerName !== void 0) opts.showSerName = showSerName;
  const showPercent = readBoolAttr(dlEl, "c:showPercent");
  if (showPercent !== void 0) opts.showPercent = showPercent;
  const showBubbleSize = readBoolAttr(dlEl, "c:showBubbleSize");
  if (showBubbleSize !== void 0) opts.showBubbleSize = showBubbleSize;
  const showLeaderLines = readBoolAttr(dlEl, "c:showLeaderLines");
  if (showLeaderLines !== void 0) opts.showLeaderLines = showLeaderLines;
  const sepEl = findChild(dlEl, "c:separator");
  const sepText = textOf(sepEl);
  if (sepText) opts.separator = sepText;
  const lblEls = children(dlEl, "c:dLbl");
  if (lblEls.length > 0) opts.labels = lblEls.map((el) => {
    const result = { index: readValNum(el, "c:idx") ?? 0 };
    if (findChild(el, "c:delete")) result.delete = true;
    const layoutEl = findChild(el, "c:layout");
    if (layoutEl) result.layout = readManualLayout(layoutEl) ?? true;
    const richEl = findChild(findChild(el, "c:tx"), "c:rich");
    if (richEl) {
      const text = textBodyDesc.parse(richEl, ctx);
      if (text) result.text = text;
    }
    const numFmt2 = attr(findChild(el, "c:numFmt"), "formatCode");
    if (numFmt2) result.numberFormat = numFmt2;
    const lblSpPr = findChild(el, "c:spPr");
    if (lblSpPr) {
      const shapeProperties = shapePropertiesDesc.parse(lblSpPr, ctx);
      if (shapeProperties) result.shapeProperties = shapeProperties;
    }
    const lblTxPr = findChild(el, "c:txPr");
    if (lblTxPr) {
      const textProperties = textBodyDesc.parse(lblTxPr, ctx);
      if (textProperties) result.textProperties = textProperties;
    }
    const pos = readValStr(el, "c:dLblPos");
    if (pos) result.position = xsdDataLabelPosition.from(pos);
    for (const flag of [
      "showLegendKey",
      "showVal",
      "showCatName",
      "showSerName",
      "showPercent",
      "showBubbleSize"
    ]) {
      const v = readBoolAttr(el, `c:${flag}`);
      if (v !== void 0) result[flag] = v;
    }
    const sep = textOf(findChild(el, "c:separator"));
    if (sep) result.separator = sep;
    return result;
  });
  if (findChild(dlEl, "c:leaderLines")) opts.leaderLines = true;
  return opts;
}
function readMarker$1(parent, ctx) {
  const el = findChild(parent, "c:marker");
  if (!el) return void 0;
  const opts = {};
  const symbol = readValStr(el, "c:symbol");
  if (symbol) opts.symbol = symbol;
  const size = readValNum(el, "c:size");
  if (size !== void 0) opts.size = size;
  const spPr = findChild(el, "c:spPr");
  if (spPr) {
    const shapeProperties = shapePropertiesDesc.parse(spPr, ctx);
    if (shapeProperties) opts.shapeProperties = shapeProperties;
  }
  return Object.keys(opts).length ? opts : void 0;
}
function readPictureOptions(parent) {
  const el = findChild(parent, "c:pictureOptions");
  if (!el) return void 0;
  const opts = {};
  const front = readBoolAttr(el, "c:applyToFront");
  if (front !== void 0) opts.applyToFront = front;
  const sides = readBoolAttr(el, "c:applyToSides");
  if (sides !== void 0) opts.applyToSides = sides;
  const end = readBoolAttr(el, "c:applyToEnd");
  if (end !== void 0) opts.applyToEnd = end;
  const fmt = readValStr(el, "c:pictureFormat");
  if (fmt) opts.pictureFormat = fmt;
  const stack = readValNum(el, "c:pictureStackUnit");
  if (stack !== void 0) opts.pictureStackUnit = stack;
  return Object.keys(opts).length ? opts : void 0;
}
function readDataPoints(serEl, ctx) {
  const els = children(serEl, "c:dPt");
  if (els.length === 0) return void 0;
  return els.map((el) => {
    const dp = { index: readValNum(el, "c:idx") ?? 0 };
    const invertIfNegative = readBoolAttr(el, "c:invertIfNegative");
    if (invertIfNegative !== void 0) dp.invertIfNegative = invertIfNegative;
    const marker = readMarker$1(el, ctx);
    if (marker) dp.marker = marker;
    const bubble3D = readBoolAttr(el, "c:bubble3D");
    if (bubble3D !== void 0) dp.bubble3D = bubble3D;
    const explosion = readValNum(el, "c:explosion");
    if (explosion !== void 0) dp.explosion = explosion;
    const spPr = findChild(el, "c:spPr");
    if (spPr) {
      const shapeProperties = shapePropertiesDesc.parse(spPr, ctx);
      if (shapeProperties) dp.shapeProperties = shapeProperties;
    }
    const pictureOptions = readPictureOptions(el);
    if (pictureOptions) dp.pictureOptions = pictureOptions;
    return dp;
  });
}
function readSeriesCommon(serEl, ctx) {
  const common = {};
  const idx = readValNum(serEl, "c:idx");
  if (idx !== void 0) common.index = idx;
  const order = readValNum(serEl, "c:order");
  if (order !== void 0) common.order = order;
  const spPrEl = findChild(serEl, "c:spPr");
  if (spPrEl) common.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  const trendlines = readTrendlines(serEl);
  if (trendlines) common.trendlines = trendlines;
  const errorBars = readErrBars(serEl);
  if (errorBars) common.errorBars = errorBars;
  const dataLabels = readDataLabels(serEl, ctx);
  if (dataLabels) common.dataLabels = dataLabels;
  const dataPoints = readDataPoints(serEl, ctx);
  if (dataPoints) common.dataPoints = dataPoints;
  const marker = readMarker$1(serEl, ctx);
  if (marker) common.marker = marker;
  const invertIfNegative = readBoolAttr(serEl, "c:invertIfNegative");
  if (invertIfNegative !== void 0) common.invertIfNegative = invertIfNegative;
  const smooth = readBoolAttr(serEl, "c:smooth");
  if (smooth !== void 0) common.smooth = smooth;
  const explosion = readValNum(serEl, "c:explosion");
  if (explosion !== void 0) common.explosion = explosion;
  const pictureOptions = readPictureOptions(serEl);
  if (pictureOptions) common.pictureOptions = pictureOptions;
  const shape = readValStr(serEl, "c:shape");
  if (shape) common.shape = shape;
  const bubble3D = readBoolAttr(serEl, "c:bubble3D");
  if (bubble3D !== void 0) common.bubble3D = bubble3D;
  const extLst = findChild(serEl, "c:extLst");
  if (extLst) {
    const inner = stringify(extLst);
    if (inner) common.ext = inner;
  }
  return common;
}
function readView3D(chartEl) {
  const v3d = findChild(chartEl, "c:view3D");
  if (!v3d) return void 0;
  const opts = {};
  const rotX = readValNum(v3d, "c:rotX");
  if (rotX !== void 0) opts.rotX = rotX;
  const hPercent = readValNum(v3d, "c:hPercent");
  if (hPercent !== void 0) opts.hPercent = hPercent;
  const rotY = readValNum(v3d, "c:rotY");
  if (rotY !== void 0) opts.rotY = rotY;
  const depthPercent = readValNum(v3d, "c:depthPercent");
  if (depthPercent !== void 0) opts.depthPercent = depthPercent;
  const rAngAx = readBoolAttr(v3d, "c:rAngAx");
  if (rAngAx !== void 0) opts.rAngAx = rAngAx;
  const perspective = readValNum(v3d, "c:perspective");
  if (perspective !== void 0) opts.perspective = perspective;
  return opts;
}
function readManualLayout(layoutEl) {
  if (!layoutEl) return void 0;
  const ml = findChild(layoutEl, "c:manualLayout");
  if (!ml) return void 0;
  const opts = {};
  const layoutTarget = readValStr(ml, "c:layoutTarget");
  if (layoutTarget) opts.layoutTarget = layoutTarget;
  const xMode = readValStr(ml, "c:xMode");
  if (xMode) opts.xMode = xMode;
  const yMode = readValStr(ml, "c:yMode");
  if (yMode) opts.yMode = yMode;
  const wMode = readValStr(ml, "c:wMode");
  if (wMode) opts.wMode = wMode;
  const hMode = readValStr(ml, "c:hMode");
  if (hMode) opts.hMode = hMode;
  const x = readValNum(ml, "c:x");
  if (x !== void 0) opts.x = x;
  const y = readValNum(ml, "c:y");
  if (y !== void 0) opts.y = y;
  const w = readValNum(ml, "c:w");
  if (w !== void 0) opts.w = w;
  const h = readValNum(ml, "c:h");
  if (h !== void 0) opts.h = h;
  return Object.keys(opts).length ? opts : void 0;
}
function readSurface(chartEl, tag, ctx) {
  const el = findChild(chartEl, tag);
  if (!el) return void 0;
  const opts = {};
  const thickness = readValStr(el, "c:thickness");
  if (thickness !== void 0) opts.thickness = thickness.endsWith("%") ? thickness : Number(thickness);
  const spPr = findChild(el, "c:spPr");
  if (spPr) opts.shapeProperties = shapePropertiesDesc.parse(spPr, ctx);
  return opts;
}
function readChartTypeScalars(chartTypeEl, type, threeD, result, ctx) {
  if (!chartTypeEl) return;
  if (type !== "surface" && type !== "stock") {
    const varyColors = readBoolAttr(chartTypeEl, "c:varyColors");
    if (varyColors !== void 0) result.varyColors = varyColors;
  }
  if (type === "column" || type === "bar" || type === "line" || type === "area") {
    const grouping = readValStr(chartTypeEl, "c:grouping");
    if (grouping) {
      if (grouping !== (type === "column" || type === "bar" ? "clustered" : "standard")) result.grouping = grouping;
    }
  }
  if (type === "column" || type === "bar") {
    const gapWidth = readValNum(chartTypeEl, "c:gapWidth");
    if (gapWidth !== void 0) result.gapWidth = gapWidth;
    if (threeD) {
      const gapDepth = readValNum(chartTypeEl, "c:gapDepth");
      if (gapDepth !== void 0) result.gapDepth = gapDepth;
      const shape = readValStr(chartTypeEl, "c:shape");
      if (shape) result.shape = shape;
    } else {
      const overlap = readValNum(chartTypeEl, "c:overlap");
      if (overlap !== void 0) result.overlap = overlap;
    }
  } else if (type === "area" && threeD) {
    const gapDepth = readValNum(chartTypeEl, "c:gapDepth");
    if (gapDepth !== void 0) result.gapDepth = gapDepth;
  } else if (type === "pie" || type === "doughnut") {
    const firstSliceAng = readValNum(chartTypeEl, "c:firstSliceAng");
    if (firstSliceAng !== void 0) result.firstSliceAngle = firstSliceAng;
    const holeSize = readValNum(chartTypeEl, "c:holeSize");
    if (holeSize !== void 0) result.holeSize = holeSize;
  } else if (type === "bubble") {
    const bubbleScale = readValNum(chartTypeEl, "c:bubbleScale");
    if (bubbleScale !== void 0) result.bubbleScale = bubbleScale;
    const showNeg = readBoolAttr(chartTypeEl, "c:showNegBubbles");
    if (showNeg !== void 0) result.showNegativeBubbles = showNeg;
    const sizeRep = readValStr(chartTypeEl, "c:sizeRepresents");
    if (sizeRep) result.sizeRepresents = xsdSizeRepresents.from(sizeRep);
  } else if (type === "surface") {
    const wireframe = readBoolAttr(chartTypeEl, "c:wireframe");
    if (wireframe !== void 0) result.wireframe = wireframe;
    const bandFormats = readBandFormats(chartTypeEl);
    if (bandFormats) result.bandFormats = bandFormats;
  } else if (type === "radar") {
    const radarStyle = readValStr(chartTypeEl, "c:radarStyle");
    if (radarStyle) result.radarStyle = radarStyle;
  } else if (type === "ofPie") {
    const ofPieType = readValStr(chartTypeEl, "c:ofPieType");
    if (ofPieType) result.ofPieType = ofPieType;
    const gapWidth = readValNum(chartTypeEl, "c:gapWidth");
    if (gapWidth !== void 0) result.gapWidth = gapWidth;
    const splitType = readValStr(chartTypeEl, "c:splitType");
    if (splitType) result.splitType = xsdSplitType.from(splitType);
    const splitPos = readValNum(chartTypeEl, "c:splitPos");
    if (splitPos !== void 0) result.splitPosition = splitPos;
    const custSplit = findChild(chartTypeEl, "c:custSplit");
    if (custSplit) {
      const pts = children(custSplit, "c:secondPiePt").map((el) => attr(el, "val")).filter((v) => v !== void 0).map(Number);
      if (pts.length) result.customSplitPoints = pts;
    }
    const secondPieSize = readValStr(chartTypeEl, "c:secondPieSize");
    if (secondPieSize !== void 0) result.secondPieSize = secondPieSize.endsWith("%") ? secondPieSize : Number(secondPieSize);
    const seriesLines = readChartLines(chartTypeEl, "c:serLines", ctx);
    if (seriesLines !== void 0) result.seriesLines = seriesLines;
  }
}
function readChartTypeDecorations(chartTypeEl, type, threeD, result, ctx) {
  if (!chartTypeEl) return;
  const readUpDownBars = (el) => {
    result.upDownBars = true;
    const gw = readValNum(el, "c:gapWidth");
    if (gw !== void 0) result.upDownBarsGapWidth = gw;
  };
  if (type === "line") {
    if (threeD) {
      const dropLinesV = readChartLines(chartTypeEl, "c:dropLines", ctx);
      if (dropLinesV !== void 0) result.dropLines = dropLinesV;
    } else {
      const highLowLinesV = readChartLines(chartTypeEl, "c:hiLowLines", ctx);
      if (highLowLinesV !== void 0) result.highLowLines = highLowLinesV;
      const upDownBars = findChild(chartTypeEl, "c:upDownBars");
      if (upDownBars) readUpDownBars(upDownBars);
      const dropLinesV = readChartLines(chartTypeEl, "c:dropLines", ctx);
      if (dropLinesV !== void 0) result.dropLines = dropLinesV;
      const markers = readBoolAttr(chartTypeEl, "c:marker");
      if (markers !== void 0) result.markers = markers;
      const smooth = readBoolAttr(chartTypeEl, "c:smooth");
      if (smooth !== void 0) result.smooth = smooth;
    }
  } else if (type === "area") {
    const dropLinesV = readChartLines(chartTypeEl, "c:dropLines", ctx);
    if (dropLinesV !== void 0) result.dropLines = dropLinesV;
    const threeDSeriesLines = readChartLines(chartTypeEl, "c:serLines", ctx);
    if (threeD && threeDSeriesLines !== void 0) result.seriesLines = threeDSeriesLines;
  } else if (type === "stock") {
    const dropLinesV = readChartLines(chartTypeEl, "c:dropLines", ctx);
    if (dropLinesV !== void 0) result.dropLines = dropLinesV;
    const highLowLinesV = readChartLines(chartTypeEl, "c:hiLowLines", ctx);
    if (highLowLinesV !== void 0) result.highLowLines = highLowLinesV;
    const upDownBars = findChild(chartTypeEl, "c:upDownBars");
    if (upDownBars) readUpDownBars(upDownBars);
    const seriesLines = readChartLines(chartTypeEl, "c:serLines", ctx);
    if (seriesLines !== void 0) result.seriesLines = seriesLines;
  } else if ((type === "column" || type === "bar") && !threeD) {
    const seriesLines = readChartLines(chartTypeEl, "c:serLines", ctx);
    if (seriesLines !== void 0) result.seriesLines = seriesLines;
  }
}
function readDataTable(plotArea, ctx) {
  if (!plotArea) return void 0;
  const dTable = findChild(plotArea, "c:dTable");
  if (!dTable) return void 0;
  const opts = {};
  const horz = readBoolAttr(dTable, "c:showHorzBorder");
  if (horz !== void 0) opts.showHorizontalBorder = horz;
  const vert = readBoolAttr(dTable, "c:showVertBorder");
  if (vert !== void 0) opts.showVerticalBorder = vert;
  const outline = readBoolAttr(dTable, "c:showOutline");
  if (outline !== void 0) opts.showOutline = outline;
  const keys = readBoolAttr(dTable, "c:showKeys");
  if (keys !== void 0) opts.showLegendKeys = keys;
  const spPrEl = findChild(dTable, "c:spPr");
  if (spPrEl) opts.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  const txPrEl = findChild(dTable, "c:txPr");
  if (txPrEl) opts.textProperties = textBodyDesc.parse(txPrEl, ctx);
  return opts;
}
function readProtection(el) {
  const protection = findChild(el, "c:protection");
  if (!protection) return void 0;
  const opts = {};
  const readFlag = (tag) => {
    const child = findChild(protection, tag);
    if (!child) return void 0;
    const v = attr(child, "val");
    return v === void 0 ? void 0 : parseOnOff(v) ?? true;
  };
  const chartObject = readFlag("c:chartObject");
  if (chartObject !== void 0) opts.chartObject = chartObject;
  const data = readFlag("c:data");
  if (data !== void 0) opts.data = data;
  const formatting = readFlag("c:formatting");
  if (formatting !== void 0) opts.formatting = formatting;
  const selection = readFlag("c:selection");
  if (selection !== void 0) opts.selection = selection;
  const userInterface = readFlag("c:userInterface");
  if (userInterface !== void 0) opts.userInterface = userInterface;
  return Object.keys(opts).length ? opts : void 0;
}
function readExternalData(el) {
  const externalData = findChild(el, "c:externalData");
  if (!externalData) return void 0;
  const relationshipId = attr(externalData, "r:id");
  if (relationshipId === void 0) return void 0;
  const opts = { relationshipId };
  const autoUpdateEl = findChild(externalData, "c:autoUpdate");
  if (autoUpdateEl) {
    const v = attr(autoUpdateEl, "val");
    if (v !== void 0) opts.autoUpdate = parseOnOff(v) ?? true;
  }
  return opts;
}
function readPivotSource(el) {
  const ps = findChild(el, "c:pivotSource");
  if (!ps) return void 0;
  const nameEl = findChild(ps, "c:name");
  const fmtIdEl = findChild(ps, "c:fmtId");
  if (!nameEl || !fmtIdEl) return void 0;
  return {
    name: textOf(nameEl) ?? "",
    formatId: Number(attr(fmtIdEl, "val"))
  };
}
function readPivotFormats(chart, ctx) {
  const pf = findChild(chart, "c:pivotFmts");
  if (!pf) return void 0;
  const result = [];
  for (const fmt of children(pf, "c:pivotFmt")) {
    const idxEl = findChild(fmt, "c:idx");
    if (!idxEl) continue;
    const opt = { index: Number(attr(idxEl, "val")) };
    const marker = readMarker$1(fmt, ctx);
    if (marker) opt.marker = marker;
    result.push(opt);
  }
  return result.length ? result : void 0;
}
function readBandFormats(chartTypeEl) {
  const bf = findChild(chartTypeEl, "c:bandFmts");
  if (!bf) return void 0;
  const result = [];
  for (const fmt of children(bf, "c:bandFmt")) {
    const idxEl = findChild(fmt, "c:idx");
    if (idxEl) result.push({ index: Number(attr(idxEl, "val")) });
  }
  return result.length ? result : void 0;
}
function readLegendEntries(legend, ctx) {
  const entries = children(legend, "c:legendEntry");
  if (!entries.length) return void 0;
  const result = [];
  for (const entry of entries) {
    const idxEl = findChild(entry, "c:idx");
    if (!idxEl) continue;
    const deleteEl = findChild(entry, "c:delete");
    if (deleteEl) {
      const v = attr(deleteEl, "val");
      result.push({
        index: Number(attr(idxEl, "val")),
        delete: parseOnOff(v) ?? true
      });
      continue;
    }
    const txPrEl = findChild(entry, "c:txPr");
    if (txPrEl) result.push({
      index: Number(attr(idxEl, "val")),
      textProperties: textBodyDesc.parse(txPrEl, ctx)
    });
  }
  return result.length ? result : void 0;
}
function readLegend(chart, ctx) {
  const legend = findChild(chart, "c:legend");
  if (!legend) return void 0;
  const result = {};
  const posEl = findChild(legend, "c:legendPos");
  if (posEl) {
    const v = attr(posEl, "val");
    if (v) result.position = xsdLegendPosition.from(v);
  }
  const entries = readLegendEntries(legend, ctx);
  if (entries) result.entries = entries;
  const layoutEl = findChild(legend, "c:layout");
  if (layoutEl) result.layout = readManualLayout(layoutEl) ?? true;
  const overlayEl = findChild(legend, "c:overlay");
  if (overlayEl) result.overlay = parseOnOff(attr(overlayEl, "val")) ?? false;
  const spPrEl = findChild(legend, "c:spPr");
  if (spPrEl) result.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  const txPr = findChild(legend, "c:txPr");
  if (txPr) result.textProperties = textBodyDesc.parse(txPr, ctx);
  return Object.keys(result).length ? result : void 0;
}
function readHeaderFooter(ps) {
  const hf = findChild(ps, "c:headerFooter");
  if (!hf) return void 0;
  const opts = {};
  const readStr2 = (tag) => {
    const child = findChild(hf, tag);
    return child ? textOf(child) : void 0;
  };
  const oh = readStr2("c:oddHeader");
  if (oh !== void 0) opts.oddHeader = oh;
  const of = readStr2("c:oddFooter");
  if (of !== void 0) opts.oddFooter = of;
  const eh = readStr2("c:evenHeader");
  if (eh !== void 0) opts.evenHeader = eh;
  const ef = readStr2("c:evenFooter");
  if (ef !== void 0) opts.evenFooter = ef;
  const fh = readStr2("c:firstHeader");
  if (fh !== void 0) opts.firstHeader = fh;
  const ff = readStr2("c:firstFooter");
  if (ff !== void 0) opts.firstFooter = ff;
  const readFlag = (name) => {
    const v = attr(hf, name);
    return v === void 0 ? void 0 : parseOnOff(v) ?? true;
  };
  const alignWithMargins = readFlag("alignWithMargins");
  if (alignWithMargins !== void 0) opts.alignWithMargins = alignWithMargins;
  const differentOddEven = readFlag("differentOddEven");
  if (differentOddEven !== void 0) opts.differentOddEven = differentOddEven;
  const differentFirst = readFlag("differentFirst");
  if (differentFirst !== void 0) opts.differentFirst = differentFirst;
  return opts;
}
function readPageMargins(ps) {
  const pm = findChild(ps, "c:pageMargins");
  if (!pm) return void 0;
  const opts = {};
  const readNum2 = (name) => {
    const v = attr(pm, name);
    return v === void 0 ? void 0 : Number(v);
  };
  const left = readNum2("l");
  if (left !== void 0) opts.left = left;
  const right = readNum2("r");
  if (right !== void 0) opts.right = right;
  const top = readNum2("t");
  if (top !== void 0) opts.top = top;
  const bottom = readNum2("b");
  if (bottom !== void 0) opts.bottom = bottom;
  const header = readNum2("header");
  if (header !== void 0) opts.header = header;
  const footer = readNum2("footer");
  if (footer !== void 0) opts.footer = footer;
  return Object.keys(opts).length ? opts : void 0;
}
function readPageSetup(ps) {
  const pg = findChild(ps, "c:pageSetup");
  if (!pg) return void 0;
  const opts = {};
  const readNum2 = (name) => {
    const v = attr(pg, name);
    return v === void 0 ? void 0 : Number(v);
  };
  const readFlag = (name) => {
    const v = attr(pg, name);
    return v === void 0 ? void 0 : parseOnOff(v) ?? true;
  };
  const paperSize = readNum2("paperSize");
  if (paperSize !== void 0) opts.paperSize = paperSize;
  const paperHeight = attr(pg, "paperHeight");
  if (paperHeight !== void 0) opts.paperHeight = paperHeight;
  const paperWidth = attr(pg, "paperWidth");
  if (paperWidth !== void 0) opts.paperWidth = paperWidth;
  const firstPageNumber = readNum2("firstPageNumber");
  if (firstPageNumber !== void 0) opts.firstPageNumber = firstPageNumber;
  const orientation = attr(pg, "orientation");
  if (orientation !== void 0) opts.orientation = orientation;
  const blackAndWhite = readFlag("blackAndWhite");
  if (blackAndWhite !== void 0) opts.blackAndWhite = blackAndWhite;
  const draft = readFlag("draft");
  if (draft !== void 0) opts.draft = draft;
  const useFirstPageNumber = readFlag("useFirstPageNumber");
  if (useFirstPageNumber !== void 0) opts.useFirstPageNumber = useFirstPageNumber;
  const horizontalDpi = readNum2("horizontalDpi");
  if (horizontalDpi !== void 0) opts.horizontalDpi = horizontalDpi;
  const verticalDpi = readNum2("verticalDpi");
  if (verticalDpi !== void 0) opts.verticalDpi = verticalDpi;
  const copies = readNum2("copies");
  if (copies !== void 0) opts.copies = copies;
  return opts;
}
function readPrintSettings(el) {
  const ps = findChild(el, "c:printSettings");
  if (!ps) return void 0;
  const opts = {};
  const headerFooter = readHeaderFooter(ps);
  if (headerFooter) opts.headerFooter = headerFooter;
  const pageMargins = readPageMargins(ps);
  if (pageMargins) opts.pageMargins = pageMargins;
  const pageSetup = readPageSetup(ps);
  if (pageSetup) opts.pageSetup = pageSetup;
  const legacyDrawingHF = findChild(ps, "c:legacyDrawingHF");
  if (legacyDrawingHF) {
    const rId = attr(legacyDrawingHF, "r:id");
    if (rId !== void 0) opts.legacyDrawingId = rId;
  }
  return Object.keys(opts).length ? opts : void 0;
}
var AXIS_KIND_BY_TAG = {
  "c:catAx": "category",
  "c:valAx": "value",
  "c:dateAx": "date",
  "c:serAx": "series"
};
function readAxis(el, kind, ctx) {
  const result = {
    kind,
    id: readValNum(el, "c:axId") ?? 0,
    crossAxisId: readValNum(el, "c:crossAx") ?? 0
  };
  const scalingEl = findChild(el, "c:scaling");
  if (scalingEl) {
    const scaling = {};
    const logBase = readValNum(scalingEl, "c:logBase");
    if (logBase !== void 0) scaling.logBase = logBase;
    const orientation = readValStr(scalingEl, "c:orientation");
    if (orientation) scaling.orientation = xsdAxisOrientation.from(orientation);
    const max2 = readValNum(scalingEl, "c:max");
    if (max2 !== void 0) scaling.max = max2;
    const min = readValNum(scalingEl, "c:min");
    if (min !== void 0) scaling.min = min;
    if (logBase !== void 0 || orientation || max2 !== void 0 || min !== void 0) result.scaling = scaling;
  }
  const del = readBoolAttr(el, "c:delete");
  if (del !== void 0) result.delete = del;
  const pos = readValStr(el, "c:axPos");
  if (pos) result.position = xsdAxisPosition.from(pos);
  result.majorGridlines = readChartLines(el, "c:majorGridlines", ctx);
  result.minorGridlines = readChartLines(el, "c:minorGridlines", ctx);
  const titleEl = findChild(el, "c:title");
  if (titleEl) result.title = readTitle(titleEl, ctx);
  const numFmtEl = findChild(el, "c:numFmt");
  if (numFmtEl) {
    const formatCode = attr(numFmtEl, "formatCode");
    if (formatCode) result.numberFormat = attr(numFmtEl, "sourceLinked") === "0" ? {
      formatCode,
      sourceLinked: false
    } : formatCode;
  }
  const majorTickMark = readValStr(el, "c:majorTickMark");
  if (majorTickMark) result.majorTickMark = majorTickMark;
  const minorTickMark = readValStr(el, "c:minorTickMark");
  if (minorTickMark) result.minorTickMark = minorTickMark;
  const tickLblPos = readValStr(el, "c:tickLblPos");
  if (tickLblPos) result.tickLabelPosition = tickLblPos;
  const spPrEl = findChild(el, "c:spPr");
  if (spPrEl) result.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
  const axisTxPr = findChild(el, "c:txPr");
  if (axisTxPr) result.textProperties = textBodyDesc.parse(axisTxPr, ctx);
  const crossesAt = readValNum(el, "c:crossesAt");
  if (crossesAt !== void 0) result.crossesAt = crossesAt;
  else {
    const crosses = readValStr(el, "c:crosses");
    if (crosses) result.crosses = xsdAxisCrosses.from(crosses);
  }
  if (kind === "category" || kind === "date") {
    const auto = readBoolAttr(el, "c:auto");
    if (auto !== void 0) result.auto = auto;
  }
  if (kind === "category") {
    const lblAlgn = readValStr(el, "c:lblAlgn");
    if (lblAlgn) result.labelAlignment = xsdAxisLabelAlignment.from(lblAlgn);
  }
  if (kind === "category" || kind === "date") {
    const lblOffsetEl = findChild(el, "c:lblOffset");
    if (lblOffsetEl) {
      const v = attr(lblOffsetEl, "val");
      if (v !== void 0) result.labelOffset = v.endsWith("%") ? v : Number(v);
    }
  }
  if (kind === "category" || kind === "series") {
    const tickLblSkip = readValNum(el, "c:tickLblSkip");
    if (tickLblSkip !== void 0) result.tickLabelSkip = tickLblSkip;
    const tickMarkSkip = readValNum(el, "c:tickMarkSkip");
    if (tickMarkSkip !== void 0) result.tickMarkSkip = tickMarkSkip;
  }
  if (kind === "category") {
    const noMulti = readBoolAttr(el, "c:noMultiLvlLbl");
    if (noMulti !== void 0) result.noMultiLevelLabel = noMulti;
  }
  if (kind === "date") {
    const baseTimeUnit = readValStr(el, "c:baseTimeUnit");
    if (baseTimeUnit) result.baseTimeUnit = baseTimeUnit;
    const majorTimeUnit = readValStr(el, "c:majorTimeUnit");
    if (majorTimeUnit) result.majorTimeUnit = majorTimeUnit;
    const minorTimeUnit = readValStr(el, "c:minorTimeUnit");
    if (minorTimeUnit) result.minorTimeUnit = minorTimeUnit;
  }
  if (kind === "date" || kind === "value") {
    const majorUnit = readValNum(el, "c:majorUnit");
    if (majorUnit !== void 0) result.majorUnit = majorUnit;
    const minorUnit = readValNum(el, "c:minorUnit");
    if (minorUnit !== void 0) result.minorUnit = minorUnit;
  }
  if (kind === "value") {
    const crossBetween = readValStr(el, "c:crossBetween");
    if (crossBetween) result.crossBetween = xsdAxisCrossBetween.from(crossBetween);
    const dispUnitsEl = findChild(el, "c:dispUnits");
    if (dispUnitsEl) {
      const displayUnits = {};
      const customUnit = readValNum(dispUnitsEl, "c:custUnit");
      if (customUnit !== void 0) displayUnits.customUnit = customUnit;
      const builtInUnit = readValStr(dispUnitsEl, "c:builtInUnit");
      if (builtInUnit) displayUnits.builtInUnit = builtInUnit;
      if (findChild(dispUnitsEl, "c:dispUnitsLbl")) displayUnits.label = true;
      if (customUnit !== void 0 || builtInUnit || displayUnits.label) result.displayUnits = displayUnits;
    }
  }
  return result;
}
function readAxes(plotArea, ctx) {
  if (!plotArea?.elements) return void 0;
  const axes = [];
  for (const child of plotArea.elements) {
    if (!child.name) continue;
    const kind = AXIS_KIND_BY_TAG[child.name];
    if (kind) axes.push(readAxis(child, kind, ctx));
  }
  return axes.length > 0 ? axes : void 0;
}
var chartSpaceDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const parts = [];
    const ns = opts.dialect === "strict" ? `xmlns:c="http://purl.oclc.org/ooxml/drawingml/chart" xmlns:a="http://purl.oclc.org/ooxml/drawingml/main" xmlns:r="http://purl.oclc.org/ooxml/officeDocument/relationships"` : `xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"`;
    parts.push(`<c:chartSpace ${ns}>`);
    if (opts.date1904 !== void 0) parts.push(`<c:date1904${boolVal(opts.date1904)}/>`);
    if (opts.lang !== void 0) parts.push(valEl("c:lang", opts.lang));
    if (opts.roundedCorners !== void 0) parts.push(`<c:roundedCorners${boolVal(opts.roundedCorners)}/>`);
    if (opts.style2010) {
      const fallback = opts.style2010.fallbackStyle !== void 0 ? `<mc:Fallback>${valEl("c:style", opts.style2010.fallbackStyle)}</mc:Fallback>` : "";
      parts.push(`<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart" Requires="c14"><c14:style val="${opts.style2010.style}"/></mc:Choice>${fallback}</mc:AlternateContent>`);
    } else if (opts.style !== void 0) parts.push(valEl("c:style", opts.style));
    if (opts.colorMappingOverride) parts.push(stringifyColorMapping(opts.colorMappingOverride, "c:clrMapOvr"));
    if (opts.pivotSource) parts.push(stringifyPivotSource(opts.pivotSource));
    if (opts.protection) parts.push(stringifyProtection(opts.protection));
    parts.push("<c:chart>");
    if (opts.title !== void 0) parts.push(typeof opts.title === "string" && opts.title === "" ? emptyEl("c:title") : stringifyTitle(opts.title, ctx));
    if (opts.autoTitleDeleted !== void 0) parts.push(`<c:autoTitleDeleted${boolVal(opts.autoTitleDeleted)}/>`);
    if (opts.pivotFormats?.length) parts.push(stringifyPivotFormats(opts.pivotFormats, ctx));
    if (opts.view3D) parts.push(stringifyView3D(opts.view3D));
    parts.push(stringifySurface("c:floor", opts.floor, ctx));
    parts.push(stringifySurface("c:sideWall", opts.sideWall, ctx));
    parts.push(stringifySurface("c:backWall", opts.backWall, ctx));
    parts.push(`<c:plotArea>${stringifyLayout(opts.plotAreaLayout)}`);
    parts.push(chartTypeHeader(opts));
    for (const [i, series] of (opts.series ?? []).entries()) parts.push(stringifySeries(i, series, opts, ctx));
    if (opts.dataLabels) parts.push(stringifyDataLabels(opts.dataLabels, ctx));
    parts.push(chartTypeFooter(opts, ctx));
    for (const g of opts.secondaryGroups ?? []) parts.push(stringifySecondaryGroup(g, opts, ctx));
    parts.push(stringifyAxes(opts, ctx));
    if (opts.dataTable) parts.push(stringifyDataTable(opts.dataTable, ctx));
    parts.push(chartSpPr(opts.plotAreaShapeProperties, ctx));
    parts.push("</c:plotArea>");
    if (opts.showLegend !== false) parts.push(stringifyLegend(opts, ctx));
    parts.push(`<c:plotVisOnly${boolVal(opts.plotVisOnly ?? true)}/>`);
    if (opts.displayBlanksAs !== void 0) parts.push(valEl("c:dispBlanksAs", opts.displayBlanksAs));
    if (opts.showDataLabelsOverMax !== void 0) parts.push(`<c:showDLblsOverMax${boolVal(opts.showDataLabelsOverMax)}/>`);
    parts.push("</c:chart>");
    parts.push(chartSpPr(opts.shapeProperties, ctx));
    if (opts.textProperties) parts.push(`<c:txPr>${textBodyDesc.stringify(opts.textProperties, ctx) ?? ""}</c:txPr>`);
    if (opts.externalData) {
      const ext = stringifyExternalData(opts.externalData);
      if (ext) parts.push(ext);
    }
    if (opts.printSettings) parts.push(stringifyPrintSettings(opts.printSettings));
    if (opts.userShapes !== void 0) parts.push(`<c:userShapes r:id="${escapeXml(opts.userShapes)}"/>`);
    if (opts.ext) parts.push(`<c:extLst>${opts.ext}</c:extLst>`);
    parts.push("</c:chartSpace>");
    return parts.join("");
  },
  parse(el, ctx) {
    const result = {};
    if (el.attributes?.["xmlns:c"] === "http://purl.oclc.org/ooxml/drawingml/chart") result.dialect = "strict";
    const date1904 = readBoolAttr(el, "c:date1904");
    if (date1904 !== void 0) result.date1904 = date1904;
    const langVal = readValStr(el, "c:lang");
    if (langVal) result.lang = langVal;
    const roundedCorners = readBoolAttr(el, "c:roundedCorners");
    if (roundedCorners !== void 0) result.roundedCorners = roundedCorners;
    const mcStyleEl = findChild(el, "mc:AlternateContent");
    const c14StyleEl = mcStyleEl && findChild(findChild(mcStyleEl, "mc:Choice") ?? mcStyleEl, "c14:style");
    if (c14StyleEl?.attributes?.["val"] !== void 0) {
      const fallbackEl = findFirst(mcStyleEl, "c:style");
      result.style2010 = {
        style: Number(c14StyleEl.attributes["val"]),
        ...fallbackEl?.attributes?.["val"] !== void 0 ? { fallbackStyle: Number(fallbackEl.attributes["val"]) } : {}
      };
    } else {
      const styleEl = findChild(el, "c:style");
      if (styleEl?.attributes?.["val"] !== void 0) result.style = Number(styleEl.attributes["val"]);
    }
    const colorMappingOverride = parseColorMapping(findChild(el, "c:clrMapOvr"));
    if (colorMappingOverride) result.colorMappingOverride = colorMappingOverride;
    const protection = readProtection(el);
    if (protection) result.protection = protection;
    const pivotSource = readPivotSource(el);
    if (pivotSource) result.pivotSource = pivotSource;
    const chart = findChild(el, "c:chart");
    if (!chart) return result;
    const titleEl = findChild(chart, "c:title");
    if (titleEl) result.title = readTitle(titleEl, ctx);
    const autoTitleDeleted = readBoolAttr(chart, "c:autoTitleDeleted");
    if (autoTitleDeleted !== void 0) result.autoTitleDeleted = autoTitleDeleted;
    const pivotFormats = readPivotFormats(chart, ctx);
    if (pivotFormats) result.pivotFormats = pivotFormats;
    const view3D = readView3D(chart);
    if (view3D) result.view3D = view3D;
    const floor = readSurface(chart, "c:floor", ctx);
    if (floor) result.floor = floor;
    const sideWall = readSurface(chart, "c:sideWall", ctx);
    if (sideWall) result.sideWall = sideWall;
    const backWall = readSurface(chart, "c:backWall", ctx);
    if (backWall) result.backWall = backWall;
    const plotArea = findChild(chart, "c:plotArea");
    if (plotArea?.elements) {
      const manualLayout = readManualLayout(findChild(plotArea, "c:layout"));
      if (manualLayout) result.plotAreaLayout = manualLayout;
      const dataTable = readDataTable(plotArea, ctx);
      if (dataTable) result.dataTable = dataTable;
      let detectedType;
      let threeD = false;
      let chartTypeEl;
      const secondaryEls = [];
      for (const child of plotArea.elements) {
        if (!child.name) continue;
        const mapping = TAG_TO_CHART_TYPE[child.name];
        if (mapping) {
          if (chartTypeEl) {
            secondaryEls.push(child);
            continue;
          }
          detectedType = mapping.type;
          threeD = mapping.threeD ?? false;
          chartTypeEl = child;
          if (child.name === "c:barChart" || child.name === "c:bar3DChart") {
            const barDir = findChild(child, "c:barDir");
            const barDirVal = barDir ? attr(barDir, "val") : void 0;
            if (barDirVal === "bar") detectedType = "bar";
            else if (barDirVal === "col") detectedType = "column";
          }
        }
      }
      if (detectedType && chartTypeEl) {
        result.type = detectedType;
        if (threeD) result.threeD = true;
        readChartTypeScalars(chartTypeEl, detectedType, threeD, result, ctx);
        readChartTypeDecorations(chartTypeEl, detectedType, threeD, result, ctx);
        const groupLabels = readDataLabels(chartTypeEl, ctx);
        if (groupLabels) result.dataLabels = groupLabels;
        const axIdEls = children(chartTypeEl, "c:axId");
        if (axIdEls.length > 0) result.axisIds = axIdEls.map((e) => Number(attr(e, "val"))).filter((n) => !isNaN(n));
      }
      const seriesEls = chartTypeEl ? children(chartTypeEl, "c:ser") : [];
      if (seriesEls.length > 0) {
        if (detectedType === "bubble") {
          const bubbleSeries = [];
          for (const serEl of seriesEls) {
            const { name } = readSeriesName(serEl);
            const xVal = findChild(serEl, "c:xVal");
            const yVal = findChild(serEl, "c:yVal");
            const bubbleSize = findChild(serEl, "c:bubbleSize");
            bubbleSeries.push({
              name,
              xValues: xVal ? readNumCache(xVal) : [],
              yValues: yVal ? readNumCache(yVal) : [],
              bubbleSize: bubbleSize ? readNumCache(bubbleSize) : [],
              ...readSeriesCommon(serEl, ctx)
            });
          }
          result.series = bubbleSeries;
        } else if (detectedType === "scatter" && hasNumericXRef(seriesEls[0])) {
          const xySeries = [];
          for (const serEl of seriesEls) {
            const { name, literal: nameLiteral } = readSeriesName(serEl);
            const txEl = findChild(serEl, "c:tx");
            const nameFormula = txEl ? readRefMeta(txEl).formula : void 0;
            const xVal = findChild(serEl, "c:xVal");
            const yVal = findChild(serEl, "c:yVal");
            const valueLiteral = yVal ? findChild(yVal, "c:numLit") !== void 0 : false;
            const yMeta = yVal ? readRefMeta(yVal) : {};
            xySeries.push({
              name,
              ...nameLiteral ? { nameLiteral } : {},
              ...nameFormula ? { nameFormula } : {},
              ...valueLiteral ? { valueLiteral } : {},
              ...yMeta.formula ? { valueFormula: yMeta.formula } : {},
              ...yMeta.formatCode ? { formatCode: yMeta.formatCode } : {},
              xValues: xVal ? readNumCache(xVal) : [],
              yValues: yVal ? readNumCache(yVal) : [],
              ...readSeriesCommon(serEl, ctx)
            });
          }
          result.series = xySeries;
        } else {
          const chartSeries = [];
          let categories;
          for (const serEl of seriesEls) {
            const { name, literal: nameLiteral } = readSeriesName(serEl);
            const txEl = findChild(serEl, "c:tx");
            const nameFormula = txEl ? readRefMeta(txEl).formula : void 0;
            if (!categories && !result.multiLevelCategories && !result.categoryLabels) {
              const catEl = findChild(serEl, "c:cat") ?? findChild(serEl, "c:xVal");
              if (catEl) {
                const multi = readMultiLvlStrCache(catEl);
                if (multi) {
                  result.multiLevelCategories = multi;
                  const multiRef = findChild(catEl, "c:multiLvlStrRef");
                  const multiF = multiRef ? findChild(multiRef, "c:f") : void 0;
                  const multiText = multiF ? textOf(multiF) : "";
                  if (multiText) result.categoryFormula = multiText;
                } else {
                  const lit = readStrLit(catEl);
                  if (lit) {
                    result.categoryLabels = lit;
                    categories = lit;
                  } else if (findChild(catEl, "c:numRef")) {
                    result.numericCategories = true;
                    categories = readNumCacheText(catEl);
                  } else categories = readStrCache(catEl);
                  const catMeta = readRefMeta(catEl);
                  if (catMeta.formula) result.categoryFormula = catMeta.formula;
                  if (catMeta.formatCode) result.categoryFormatCode = catMeta.formatCode;
                }
              }
            }
            const valueEl = findChild(serEl, "c:val") ?? findChild(serEl, "c:yVal");
            const valueLiteral = valueEl ? findChild(valueEl, "c:numLit") !== void 0 : false;
            const values = valueEl ? readNumCache(valueEl) : [];
            const valMeta = valueEl ? readRefMeta(valueEl) : {};
            chartSeries.push({
              name,
              ...nameLiteral ? { nameLiteral } : {},
              ...nameFormula ? { nameFormula } : {},
              ...valueLiteral ? { valueLiteral } : {},
              ...valMeta.formula ? { valueFormula: valMeta.formula } : {},
              ...valMeta.formatCode ? { formatCode: valMeta.formatCode } : {},
              values,
              ...readSeriesCommon(serEl, ctx)
            });
          }
          result.series = chartSeries;
          if (categories) result.categories = categories;
        }
      }
      if (secondaryEls.length > 0) {
        const groups = [];
        for (const secondaryEl of secondaryEls) {
          const g = readSecondaryGroup(secondaryEl, ctx);
          if (g) groups.push(g);
        }
        if (groups.length > 0) result.secondaryGroups = groups;
      }
    }
    const axes = readAxes(plotArea, ctx);
    if (axes) result.axes = axes;
    const plotSpPr = plotArea && findChild(plotArea, "c:spPr");
    if (plotSpPr) result.plotAreaShapeProperties = shapePropertiesDesc.parse(plotSpPr, ctx);
    if (!findChild(chart, "c:legend")) result.showLegend = false;
    else {
      result.showLegend = true;
      const legendData = readLegend(chart, ctx);
      if (legendData?.position) result.legendPosition = legendData.position;
      if (legendData?.layout !== void 0) result.legendLayout = legendData.layout;
      if (legendData?.overlay !== void 0) result.legendOverlay = legendData.overlay;
      if (legendData?.shapeProperties) result.legendShapeProperties = legendData.shapeProperties;
      if (legendData?.textProperties) result.legendTextProperties = legendData.textProperties;
      if (legendData?.entries) result.legendEntries = legendData.entries;
    }
    const plotVisOnly = readBoolAttr(chart, "c:plotVisOnly");
    if (plotVisOnly !== void 0) result.plotVisOnly = plotVisOnly;
    const dispBlanksAs = readValStr(chart, "c:dispBlanksAs");
    if (dispBlanksAs) result.displayBlanksAs = dispBlanksAs;
    const showDLblsOverMax = readBoolAttr(chart, "c:showDLblsOverMax");
    if (showDLblsOverMax !== void 0) result.showDataLabelsOverMax = showDLblsOverMax;
    const spPrEl = findChild(el, "c:spPr");
    if (spPrEl) result.shapeProperties = shapePropertiesDesc.parse(spPrEl, ctx);
    const spaceTxPr = findChild(el, "c:txPr");
    if (spaceTxPr) result.textProperties = textBodyDesc.parse(spaceTxPr, ctx);
    const externalData = readExternalData(el);
    if (externalData) result.externalData = externalData;
    const printSettings = readPrintSettings(el);
    if (printSettings) result.printSettings = printSettings;
    const userShapesEl = findChild(el, "c:userShapes");
    if (userShapesEl) {
      const rid = attr(userShapesEl, "r:id");
      if (rid !== void 0) result.userShapes = rid;
    }
    const spaceExtLst = findChild(el, "c:extLst");
    if (spaceExtLst) result.ext = (spaceExtLst.elements ?? []).map((e) => stringifyElement(e)).join("");
    return result;
  }
};

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/vector-DhLGZjP5.mjs
var styleToKeyMap = {
  flip: "flip",
  height: "height",
  left: "left",
  marginBottom: "margin-bottom",
  marginLeft: "margin-left",
  marginRight: "margin-right",
  marginTop: "margin-top",
  position: "position",
  positionHorizontal: "mso-position-horizontal",
  positionHorizontalRelative: "mso-position-horizontal-relative",
  positionVertical: "mso-position-vertical",
  positionVerticalRelative: "mso-position-vertical-relative",
  rotation: "rotation",
  top: "top",
  visibility: "visibility",
  width: "width",
  wrapDistanceBottom: "mso-wrap-distance-bottom",
  wrapDistanceLeft: "mso-wrap-distance-left",
  wrapDistanceRight: "mso-wrap-distance-right",
  wrapDistanceTop: "mso-wrap-distance-top",
  wrapEdited: "mso-wrap-edited",
  wrapStyle: "mso-wrap-style",
  fitShapeToText: "mso-fit-shape-to-text",
  directionAlt: "mso-direction-alt",
  zIndex: "z-index"
};
function stringifyVmlStyle(style) {
  return Object.entries(style).map(([key, value]) => {
    const text = typeof value === "boolean" ? value ? "t" : "f" : String(value);
    return `${styleToKeyMap[key]}:${text}`;
  }).join(";");
}
function parseVmlStyle(styleStr) {
  const style = {};
  for (const part of styleStr.split(";")) {
    const [key, val] = part.split(":").map((s) => s.trim());
    if (key && val) style[key] = val;
  }
  return style;
}
var keyToStyleMap = Object.fromEntries(Object.entries(styleToKeyMap).map(([field, key]) => [key, field]));
var NUMERIC = /^-?\d+(\.\d+)?$/;
function parseVmlShapeStyle(record) {
  const style = {};
  for (const [key, value] of Object.entries(record)) {
    const field = keyToStyleMap[key];
    if (!field) continue;
    if (field === "wrapEdited" || field === "fitShapeToText") style[field] = value === "t" || value === "true";
    else if (NUMERIC.test(value)) style[field] = Number(value);
    else style[field] = value;
  }
  return style;
}
var VML_CORE_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "href",
    attr: "href",
    kind: "string"
  },
  {
    field: "target",
    attr: "target",
    kind: "string"
  },
  {
    field: "class",
    attr: "class",
    kind: "string"
  },
  {
    field: "title",
    attr: "title",
    kind: "string"
  },
  {
    field: "alt",
    attr: "alt",
    kind: "string"
  },
  {
    field: "coordsize",
    attr: "coordsize",
    kind: "string"
  },
  {
    field: "coordorigin",
    attr: "coordorigin",
    kind: "string"
  },
  {
    field: "wrapcoords",
    attr: "wrapcoords",
    kind: "string"
  },
  {
    field: "print",
    attr: "print",
    kind: "trueFalse"
  }
];
var VML_SHAPE_ATTRS = [
  {
    field: "chromakey",
    attr: "chromakey",
    kind: "string"
  },
  {
    field: "filled",
    attr: "filled",
    kind: "trueFalse"
  },
  {
    field: "fillcolor",
    attr: "fillcolor",
    kind: "string"
  },
  {
    field: "opacity",
    attr: "opacity",
    kind: "string"
  },
  {
    field: "stroked",
    attr: "stroked",
    kind: "trueFalse"
  },
  {
    field: "strokecolor",
    attr: "strokecolor",
    kind: "string"
  },
  {
    field: "strokeweight",
    attr: "strokeweight",
    kind: "string"
  },
  {
    field: "insetpen",
    attr: "insetpen",
    kind: "trueFalse"
  }
];
var VML_OFFICE_CORE_ATTRS = [
  {
    field: "spid",
    attr: "o:spid",
    kind: "string"
  },
  {
    field: "oned",
    attr: "o:oned",
    kind: "trueFalse"
  },
  {
    field: "regroupid",
    attr: "o:regroupid",
    kind: "number"
  },
  {
    field: "doubleclicknotify",
    attr: "o:doubleclicknotify",
    kind: "trueFalse"
  },
  {
    field: "button",
    attr: "o:button",
    kind: "trueFalse"
  },
  {
    field: "userhidden",
    attr: "o:userhidden",
    kind: "trueFalse"
  },
  {
    field: "bullet",
    attr: "o:bullet",
    kind: "trueFalse"
  },
  {
    field: "hr",
    attr: "o:hr",
    kind: "trueFalse"
  },
  {
    field: "hrstd",
    attr: "o:hrstd",
    kind: "trueFalse"
  },
  {
    field: "hrnoshade",
    attr: "o:hrnoshade",
    kind: "trueFalse"
  },
  {
    field: "hrpct",
    attr: "o:hrpct",
    kind: "number"
  },
  {
    field: "hralign",
    attr: "o:hralign",
    kind: "string"
  },
  {
    field: "allowincell",
    attr: "o:allowincell",
    kind: "trueFalse"
  },
  {
    field: "allowoverlap",
    attr: "o:allowoverlap",
    kind: "trueFalse"
  },
  {
    field: "userdrawn",
    attr: "o:userdrawn",
    kind: "trueFalse"
  },
  {
    field: "bordertopcolor",
    attr: "o:bordertopcolor",
    kind: "string"
  },
  {
    field: "borderleftcolor",
    attr: "o:borderleftcolor",
    kind: "string"
  },
  {
    field: "borderbottomcolor",
    attr: "o:borderbottomcolor",
    kind: "string"
  },
  {
    field: "borderrightcolor",
    attr: "o:borderrightcolor",
    kind: "string"
  },
  {
    field: "dgmlayout",
    attr: "o:dgmlayout",
    kind: "string"
  },
  {
    field: "dgmnodekind",
    attr: "o:dgmnodekind",
    kind: "number"
  },
  {
    field: "dgmlayoutmru",
    attr: "o:dgmlayoutmru",
    kind: "string"
  },
  {
    field: "insetmode",
    attr: "o:insetmode",
    kind: "string"
  }
];
var VML_OFFICE_SHAPE_ATTRS = [
  {
    field: "spt",
    attr: "o:spt",
    kind: "number"
  },
  {
    field: "connectortype",
    attr: "o:connectortype",
    kind: "string"
  },
  {
    field: "bwmode",
    attr: "o:bwmode",
    kind: "string"
  },
  {
    field: "bwpure",
    attr: "o:bwpure",
    kind: "string"
  },
  {
    field: "bwnormal",
    attr: "o:bwnormal",
    kind: "string"
  },
  {
    field: "forcedash",
    attr: "o:forcedash",
    kind: "trueFalse"
  },
  {
    field: "oleicon",
    attr: "o:oleicon",
    kind: "trueFalse"
  },
  {
    field: "ole",
    attr: "o:ole",
    kind: "string"
  },
  {
    field: "preferrelative",
    attr: "o:preferrelative",
    kind: "trueFalse"
  },
  {
    field: "cliptowrap",
    attr: "o:cliptowrap",
    kind: "trueFalse"
  },
  {
    field: "clip",
    attr: "o:clip",
    kind: "trueFalse"
  }
];
function stringifyVmlTrueFalse(value) {
  return value ? "t" : "f";
}
function parseVmlTrueFalse(value) {
  return value === "t" || value === "true" || value === "1";
}
function stringifyVmlAttributes(opts, specs) {
  const parts = [];
  for (const spec of specs) {
    const value = opts[spec.field];
    if (value === void 0) continue;
    const text = spec.kind === "trueFalse" ? stringifyVmlTrueFalse(value) : spec.kind === "trueFalseBlank" ? stringifyVmlTrueFalseBlank(value) : spec.kind === "number" ? String(value) : escapeXml(String(value));
    parts.push(`${spec.attr}="${text}"`);
  }
  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}
function stringifyVmlTrueFalseBlank(value) {
  return value === "" ? "" : stringifyVmlTrueFalse(value);
}
function parseVmlTrueFalseBlank(value) {
  return value === "" ? "" : parseVmlTrueFalse(value);
}
function parseVmlAttributes(el, specs, out) {
  for (const spec of specs) {
    const raw = el.attributes?.[spec.attr];
    if (raw === void 0) continue;
    out[spec.field] = spec.kind === "trueFalse" ? parseVmlTrueFalse(String(raw)) : spec.kind === "trueFalseBlank" ? parseVmlTrueFalseBlank(String(raw)) : spec.kind === "number" ? Number(raw) : String(raw);
  }
}
var EXT_ATTR = [{
  field: "ext",
  attr: "v:ext",
  kind: "string"
}];
var SKEW_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "offset",
    attr: "offset",
    kind: "string"
  },
  {
    field: "origin",
    attr: "origin",
    kind: "string"
  },
  {
    field: "matrix",
    attr: "matrix",
    kind: "string"
  }
];
function stringifyVmlSkew(opts) {
  return `<o:skew${stringifyVmlAttributes(opts, [...EXT_ATTR, ...SKEW_ATTRS])}/>`;
}
function parseVmlSkew(el) {
  const out = {};
  parseVmlAttributes(el, [...EXT_ATTR, ...SKEW_ATTRS], out);
  return out;
}
var EXTRUSION_ATTRS = [
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "render",
    attr: "render",
    kind: "string"
  },
  {
    field: "viewpointorigin",
    attr: "viewpointorigin",
    kind: "string"
  },
  {
    field: "viewpoint",
    attr: "viewpoint",
    kind: "string"
  },
  {
    field: "plane",
    attr: "plane",
    kind: "string"
  },
  {
    field: "skewangle",
    attr: "skewangle",
    kind: "number"
  },
  {
    field: "skewamt",
    attr: "skewamt",
    kind: "string"
  },
  {
    field: "foredepth",
    attr: "foredepth",
    kind: "string"
  },
  {
    field: "backdepth",
    attr: "backdepth",
    kind: "string"
  },
  {
    field: "orientation",
    attr: "orientation",
    kind: "string"
  },
  {
    field: "orientationangle",
    attr: "orientationangle",
    kind: "number"
  },
  {
    field: "lockrotationcenter",
    attr: "lockrotationcenter",
    kind: "trueFalse"
  },
  {
    field: "autorotationcenter",
    attr: "autorotationcenter",
    kind: "trueFalse"
  },
  {
    field: "rotationcenter",
    attr: "rotationcenter",
    kind: "string"
  },
  {
    field: "rotationangle",
    attr: "rotationangle",
    kind: "string"
  },
  {
    field: "colormode",
    attr: "colormode",
    kind: "string"
  },
  {
    field: "color",
    attr: "color",
    kind: "string"
  },
  {
    field: "shininess",
    attr: "shininess",
    kind: "number"
  },
  {
    field: "specularity",
    attr: "specularity",
    kind: "string"
  },
  {
    field: "diffusity",
    attr: "diffusity",
    kind: "string"
  },
  {
    field: "metal",
    attr: "metal",
    kind: "trueFalse"
  },
  {
    field: "edge",
    attr: "edge",
    kind: "string"
  },
  {
    field: "facet",
    attr: "facet",
    kind: "string"
  },
  {
    field: "lightface",
    attr: "lightface",
    kind: "trueFalse"
  },
  {
    field: "brightness",
    attr: "brightness",
    kind: "string"
  },
  {
    field: "lightposition",
    attr: "lightposition",
    kind: "string"
  },
  {
    field: "lightlevel",
    attr: "lightlevel",
    kind: "string"
  },
  {
    field: "lightharsh",
    attr: "lightharsh",
    kind: "trueFalse"
  },
  {
    field: "lightposition2",
    attr: "lightposition2",
    kind: "string"
  },
  {
    field: "lightlevel2",
    attr: "lightlevel2",
    kind: "string"
  },
  {
    field: "lightharsh2",
    attr: "lightharsh2",
    kind: "trueFalse"
  }
];
function stringifyVmlExtrusion(opts) {
  return `<o:extrusion${stringifyVmlAttributes(opts, [...EXT_ATTR, ...EXTRUSION_ATTRS])}/>`;
}
function parseVmlExtrusion(el) {
  const out = {};
  parseVmlAttributes(el, [...EXT_ATTR, ...EXTRUSION_ATTRS], out);
  return out;
}
var CALLOUT_ATTRS = [
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "gap",
    attr: "gap",
    kind: "string"
  },
  {
    field: "angle",
    attr: "angle",
    kind: "string"
  },
  {
    field: "dropauto",
    attr: "dropauto",
    kind: "trueFalse"
  },
  {
    field: "drop",
    attr: "drop",
    kind: "string"
  },
  {
    field: "distance",
    attr: "distance",
    kind: "string"
  },
  {
    field: "lengthspecified",
    attr: "lengthspecified",
    kind: "trueFalse"
  },
  {
    field: "length",
    attr: "length",
    kind: "string"
  },
  {
    field: "accentbar",
    attr: "accentbar",
    kind: "trueFalse"
  },
  {
    field: "textborder",
    attr: "textborder",
    kind: "trueFalse"
  },
  {
    field: "minusx",
    attr: "minusx",
    kind: "trueFalse"
  },
  {
    field: "minusy",
    attr: "minusy",
    kind: "trueFalse"
  }
];
function stringifyVmlCallout(opts) {
  return `<o:callout${stringifyVmlAttributes(opts, [...EXT_ATTR, ...CALLOUT_ATTRS])}/>`;
}
function parseVmlCallout(el) {
  const out = {};
  parseVmlAttributes(el, [...EXT_ATTR, ...CALLOUT_ATTRS], out);
  return out;
}
var LOCK_ATTRS = [
  {
    field: "position",
    attr: "position",
    kind: "trueFalse"
  },
  {
    field: "selection",
    attr: "selection",
    kind: "trueFalse"
  },
  {
    field: "grouping",
    attr: "grouping",
    kind: "trueFalse"
  },
  {
    field: "ungrouping",
    attr: "ungrouping",
    kind: "trueFalse"
  },
  {
    field: "rotation",
    attr: "rotation",
    kind: "trueFalse"
  },
  {
    field: "cropping",
    attr: "cropping",
    kind: "trueFalse"
  },
  {
    field: "verticies",
    attr: "verticies",
    kind: "trueFalse"
  },
  {
    field: "adjusthandles",
    attr: "adjusthandles",
    kind: "trueFalse"
  },
  {
    field: "text",
    attr: "text",
    kind: "trueFalse"
  },
  {
    field: "aspectratio",
    attr: "aspectratio",
    kind: "trueFalse"
  },
  {
    field: "shapetype",
    attr: "shapetype",
    kind: "trueFalse"
  }
];
function stringifyVmlLock(opts) {
  return `<o:lock${stringifyVmlAttributes(opts, [...EXT_ATTR, ...LOCK_ATTRS])}/>`;
}
function parseVmlLock(el) {
  const out = {};
  parseVmlAttributes(el, [...EXT_ATTR, ...LOCK_ATTRS], out);
  return out;
}
function stringifyVmlClipPath(opts) {
  return `<o:clippath v:v="${escapeXml(opts.v)}"/>`;
}
function parseVmlClipPath(el) {
  return { v: String(el.attributes?.["v:v"] ?? "") };
}
var SIGNATURE_ATTRS = [
  {
    field: "issignatureline",
    attr: "issignatureline",
    kind: "trueFalse"
  },
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "provid",
    attr: "provid",
    kind: "string"
  },
  {
    field: "signinginstructionsset",
    attr: "signinginstructionsset",
    kind: "trueFalse"
  },
  {
    field: "allowcomments",
    attr: "allowcomments",
    kind: "trueFalse"
  },
  {
    field: "showsigndate",
    attr: "showsigndate",
    kind: "trueFalse"
  },
  {
    field: "suggestedsigner",
    attr: "o:suggestedsigner",
    kind: "string"
  },
  {
    field: "suggestedsigner2",
    attr: "o:suggestedsigner2",
    kind: "string"
  },
  {
    field: "suggestedsigneremail",
    attr: "o:suggestedsigneremail",
    kind: "string"
  },
  {
    field: "signinginstructions",
    attr: "signinginstructions",
    kind: "string"
  },
  {
    field: "addlxml",
    attr: "addlxml",
    kind: "string"
  },
  {
    field: "sigprovurl",
    attr: "sigprovurl",
    kind: "string"
  }
];
function stringifyVmlSignatureLine(opts) {
  return `<o:signatureline${stringifyVmlAttributes(opts, [...EXT_ATTR, ...SIGNATURE_ATTRS])}/>`;
}
function parseVmlSignatureLine(el) {
  const out = {};
  parseVmlAttributes(el, [...EXT_ATTR, ...SIGNATURE_ATTRS], out);
  return out;
}
function stringifyVmlInk(opts) {
  const attrs2 = [`i="${escapeXml(opts.i)}"`];
  if (opts.annotation !== void 0) attrs2.push(`annotation="${stringifyVmlTrueFalse(opts.annotation)}"`);
  if (opts.contentType !== void 0) attrs2.push(`contentType="${escapeXml(opts.contentType)}"`);
  return `<o:ink ${attrs2.join(" ")}/>`;
}
function parseVmlInk(el) {
  const out = { i: String(el.attributes?.i ?? "") };
  if (el.attributes?.annotation !== void 0) out.annotation = parseVmlTrueFalse(String(el.attributes.annotation));
  if (el.attributes?.contentType !== void 0) out.contentType = String(el.attributes.contentType);
  return out;
}
function stringifyVmlEquationXml(opts) {
  return `<o:equationxml${opts.contentType !== void 0 ? ` contentType="${escapeXml(opts.contentType)}"` : ""}>${opts.content ?? ""}</o:equationxml>`;
}
function parseVmlEquationXml(el) {
  const out = {};
  const contentType = el.attributes?.contentType;
  if (contentType !== void 0) out.contentType = String(contentType);
  if ((el.elements ?? []).length > 0) {
    const child = el.elements.find((c) => c.type === "element");
    if (child) out.content = stringifyElement(child);
  }
  return out;
}
function stringifyVmlComplex(opts) {
  return `<o:complex${stringifyVmlAttributes(opts, EXT_ATTR)}/>`;
}
function stringifyVmlOfficeFill(opts) {
  return `<o:fill${stringifyVmlAttributes(opts, EXT_ATTR)}${opts.type !== void 0 ? ` type="${opts.type}"` : ""}/>`;
}
function parseVmlOfficeFill(el) {
  const out = {};
  parseVmlAttributes(el, EXT_ATTR, out);
  if (el.attributes?.type !== void 0) out.type = String(el.attributes.type);
  return out;
}
var TRUE_FALSE_BLANK_FIELDS = [
  "MoveWithCells",
  "SizeWithCells",
  "Locked",
  "DefaultSize",
  "PrintObject",
  "Disabled",
  "AutoFill",
  "AutoLine",
  "AutoPict",
  "LockText",
  "JustLastX",
  "SecretEdit",
  "Default",
  "Help",
  "Cancel",
  "Dismiss",
  "Visible",
  "RowHidden",
  "ColHidden",
  "MultiLine",
  "VScroll",
  "ValidIds",
  "NoThreeD2",
  "Colored",
  "NoThreeD",
  "FirstButton",
  "Horiz",
  "MapOCX",
  "Camera",
  "RecalcAlways",
  "AutoScale",
  "DDE",
  "UIObj"
];
var INTEGER_FIELDS = [
  "Accel",
  "Accel2",
  "Row",
  "Column",
  "VTEdit",
  "WidthMin",
  "Sel",
  "DropLines",
  "Checked",
  "Val",
  "Min",
  "Max",
  "Inc",
  "Page",
  "Dx",
  "ScriptLanguage",
  "ScriptLocation"
];
var STRING_FIELDS = [
  "Anchor",
  "FmlaMacro",
  "TextHAlign",
  "TextVAlign",
  "FmlaRange",
  "SelType",
  "MultiSel",
  "LCT",
  "ListItem",
  "DropStyle",
  "FmlaLink",
  "FmlaPict",
  "FmlaGroup",
  "ScriptText",
  "ScriptExtended",
  "FmlaTxbx",
  "CF"
];
var TRUE_FALSE_BLANK_FIELD_SET = new Set(TRUE_FALSE_BLANK_FIELDS);
var INTEGER_FIELD_SET = new Set(INTEGER_FIELDS);
var STRING_FIELD_SET = new Set(STRING_FIELDS);
function stringifyVmlClientData(opts) {
  const children2 = [];
  for (const field of TRUE_FALSE_BLANK_FIELDS) {
    const value = opts[field];
    if (value !== void 0) children2.push(`<x:${field}>${stringifyVmlTrueFalseBlank(value)}</x:${field}>`);
  }
  for (const field of INTEGER_FIELDS) {
    const value = opts[field];
    if (value !== void 0) children2.push(`<x:${field}>${value}</x:${field}>`);
  }
  for (const field of STRING_FIELDS) {
    const value = opts[field];
    if (value !== void 0) children2.push(`<x:${field}>${escapeXml(value)}</x:${field}>`);
  }
  return `<x:ClientData ObjectType="${opts.objectType}">${children2.join("")}</x:ClientData>`;
}
function parseVmlClientData(el) {
  const out = { objectType: String(el.attributes?.ObjectType ?? "") };
  const extras = {};
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    const local = child.name?.startsWith("x:") ? child.name.slice(2) : null;
    if (local === null) continue;
    const text = (child.elements ?? []).map((c) => String(c.text ?? "")).join("");
    if (TRUE_FALSE_BLANK_FIELD_SET.has(local)) extras[local] = parseVmlTrueFalseBlank(text);
    else if (INTEGER_FIELD_SET.has(local)) extras[local] = Number(text);
    else if (STRING_FIELD_SET.has(local)) extras[local] = text;
  }
  return Object.assign(out, extras);
}
var FILL_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "color",
    attr: "color",
    kind: "string"
  },
  {
    field: "opacity",
    attr: "opacity",
    kind: "string"
  },
  {
    field: "color2",
    attr: "color2",
    kind: "string"
  },
  {
    field: "src",
    attr: "src",
    kind: "string"
  },
  {
    field: "size",
    attr: "size",
    kind: "string"
  },
  {
    field: "origin",
    attr: "origin",
    kind: "string"
  },
  {
    field: "position",
    attr: "position",
    kind: "string"
  },
  {
    field: "aspect",
    attr: "aspect",
    kind: "string"
  },
  {
    field: "colors",
    attr: "colors",
    kind: "string"
  },
  {
    field: "angle",
    attr: "angle",
    kind: "number"
  },
  {
    field: "alignshape",
    attr: "alignshape",
    kind: "trueFalse"
  },
  {
    field: "focus",
    attr: "focus",
    kind: "string"
  },
  {
    field: "focussize",
    attr: "focussize",
    kind: "string"
  },
  {
    field: "focusposition",
    attr: "focusposition",
    kind: "string"
  },
  {
    field: "method",
    attr: "method",
    kind: "string"
  },
  {
    field: "recolor",
    attr: "recolor",
    kind: "trueFalse"
  },
  {
    field: "rotate",
    attr: "rotate",
    kind: "trueFalse"
  },
  {
    field: "relationshipId",
    attr: "r:id",
    kind: "string"
  },
  {
    field: "officeHref",
    attr: "o:href",
    kind: "string"
  },
  {
    field: "officeAltHref",
    attr: "o:althref",
    kind: "string"
  },
  {
    field: "detectmouseclick",
    attr: "o:detectmouseclick",
    kind: "trueFalse"
  },
  {
    field: "officeTitle",
    attr: "o:title",
    kind: "string"
  },
  {
    field: "opacity2",
    attr: "o:opacity2",
    kind: "string"
  },
  {
    field: "officeRelationshipId",
    attr: "o:relid",
    kind: "string"
  }
];
function stringifyVmlFill(opts) {
  const child = opts.officeFill !== void 0 ? stringifyVmlOfficeFill(opts.officeFill) : "";
  const attrStr = stringifyVmlAttributes(opts, FILL_ATTRS);
  return child !== "" ? `<v:fill${attrStr}>${child}</v:fill>` : `<v:fill${attrStr}/>`;
}
function parseVmlFill(el) {
  const out = {};
  parseVmlAttributes(el, FILL_ATTRS, out);
  for (const child of el.elements ?? []) if (child.type === "element" && child.name === "o:fill") {
    out.officeFill = parseVmlOfficeFill(child);
    break;
  }
  return out;
}
function stringifyVmlFormulas(opts) {
  return `<v:formulas>${(opts.equations ?? []).map((eqn) => `<v:f eqn="${escapeXml(eqn)}"/>`).join("")}</v:formulas>`;
}
function parseVmlFormulas(el) {
  const equations = [];
  for (const child of el.elements ?? []) if (child.type === "element" && child.name === "v:f") {
    const eqn = child.attributes?.eqn;
    if (eqn !== void 0) equations.push(String(eqn));
  }
  return equations.length > 0 ? { equations } : {};
}
var HANDLE_STRING_FIELDS = [
  "position",
  "polar",
  "map",
  "xrange",
  "yrange",
  "radiusrange"
];
var HANDLE_BOOLEAN_FIELDS = [
  "invx",
  "invy",
  "switch"
];
function stringifyVmlHandles(opts) {
  return `<v:handles>${(opts.handles ?? []).map((handle) => {
    const attrs2 = [];
    for (const field of HANDLE_STRING_FIELDS) {
      const value = handle[field];
      if (value !== void 0) attrs2.push(`${field}="${escapeXml(value)}"`);
    }
    for (const field of HANDLE_BOOLEAN_FIELDS) {
      const value = handle[field];
      if (value !== void 0) attrs2.push(`${field}="${stringifyVmlTrueFalse(value)}"`);
    }
    return `<v:h${attrs2.length > 0 ? ` ${attrs2.join(" ")}` : ""}/>`;
  }).join("")}</v:handles>`;
}
function parseVmlHandles(el) {
  const handles = [];
  for (const child of el.elements ?? []) {
    if (child.type !== "element" || child.name !== "v:h") continue;
    const handle = {};
    const attrs2 = child.attributes ?? {};
    for (const field of HANDLE_STRING_FIELDS) {
      const raw = attrs2[field];
      if (raw !== void 0) handle[field] = String(raw);
    }
    for (const field of HANDLE_BOOLEAN_FIELDS) {
      const raw = attrs2[field];
      if (raw !== void 0) handle[field] = parseVmlTrueFalse(String(raw));
    }
    handles.push(handle);
  }
  return handles.length > 0 ? { handles } : {};
}
var IMAGEDATA_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "src",
    attr: "src",
    kind: "string"
  },
  {
    field: "cropleft",
    attr: "cropleft",
    kind: "string"
  },
  {
    field: "croptop",
    attr: "croptop",
    kind: "string"
  },
  {
    field: "cropright",
    attr: "cropright",
    kind: "string"
  },
  {
    field: "cropbottom",
    attr: "cropbottom",
    kind: "string"
  },
  {
    field: "gain",
    attr: "gain",
    kind: "string"
  },
  {
    field: "blacklevel",
    attr: "blacklevel",
    kind: "string"
  },
  {
    field: "gamma",
    attr: "gamma",
    kind: "string"
  },
  {
    field: "grayscale",
    attr: "grayscale",
    kind: "trueFalse"
  },
  {
    field: "bilevel",
    attr: "bilevel",
    kind: "trueFalse"
  },
  {
    field: "chromakey",
    attr: "chromakey",
    kind: "string"
  },
  {
    field: "embosscolor",
    attr: "embosscolor",
    kind: "string"
  },
  {
    field: "recolortarget",
    attr: "recolortarget",
    kind: "string"
  },
  {
    field: "relationshipId",
    attr: "r:id",
    kind: "string"
  },
  {
    field: "pictRelationshipId",
    attr: "r:pict",
    kind: "string"
  },
  {
    field: "hrefRelationshipId",
    attr: "r:href",
    kind: "string"
  },
  {
    field: "officeHref",
    attr: "o:href",
    kind: "string"
  },
  {
    field: "officeAltHref",
    attr: "o:althref",
    kind: "string"
  },
  {
    field: "officeTitle",
    attr: "o:title",
    kind: "string"
  },
  {
    field: "oleid",
    attr: "o:oleid",
    kind: "number"
  },
  {
    field: "detectmouseclick",
    attr: "o:detectmouseclick",
    kind: "trueFalse"
  },
  {
    field: "movie",
    attr: "o:movie",
    kind: "number"
  },
  {
    field: "officeRelationshipId",
    attr: "o:relid",
    kind: "string"
  }
];
function stringifyVmlImageData(opts) {
  return `<v:imagedata${stringifyVmlAttributes(opts, IMAGEDATA_ATTRS)}/>`;
}
function parseVmlImageData(el) {
  const out = {};
  parseVmlAttributes(el, IMAGEDATA_ATTRS, out);
  return out;
}
var PATH_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "v",
    attr: "v",
    kind: "string"
  },
  {
    field: "limo",
    attr: "limo",
    kind: "string"
  },
  {
    field: "textboxrect",
    attr: "textboxrect",
    kind: "string"
  },
  {
    field: "fillok",
    attr: "fillok",
    kind: "trueFalse"
  },
  {
    field: "strokeok",
    attr: "strokeok",
    kind: "trueFalse"
  },
  {
    field: "shadowok",
    attr: "shadowok",
    kind: "trueFalse"
  },
  {
    field: "arrowok",
    attr: "arrowok",
    kind: "trueFalse"
  },
  {
    field: "gradientshapeok",
    attr: "gradientshapeok",
    kind: "trueFalse"
  },
  {
    field: "textpathok",
    attr: "textpathok",
    kind: "trueFalse"
  },
  {
    field: "insetpenok",
    attr: "insetpenok",
    kind: "trueFalse"
  },
  {
    field: "connecttype",
    attr: "o:connecttype",
    kind: "string"
  },
  {
    field: "connectlocs",
    attr: "o:connectlocs",
    kind: "string"
  },
  {
    field: "connectangles",
    attr: "o:connectangles",
    kind: "string"
  },
  {
    field: "extrusionok",
    attr: "o:extrusionok",
    kind: "trueFalse"
  }
];
function stringifyVmlPath(opts) {
  return `<v:path${stringifyVmlAttributes(opts, PATH_ATTRS)}/>`;
}
function parseVmlPath(el) {
  const out = {};
  parseVmlAttributes(el, PATH_ATTRS, out);
  return out;
}
function stringifyVmlIsComment(_opts) {
  return "<pvml:iscomment/>";
}
function parseVmlIsComment(_el) {
  return {};
}
function stringifyVmlTextData(opts) {
  return opts.id !== void 0 ? `<pvml:textdata id="${opts.id}"/>` : "<pvml:textdata/>";
}
function parseVmlTextData(el) {
  const id = el.attributes?.id;
  return id !== void 0 ? { id: String(id) } : {};
}
var SHADOW_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "obscured",
    attr: "obscured",
    kind: "trueFalse"
  },
  {
    field: "color",
    attr: "color",
    kind: "string"
  },
  {
    field: "opacity",
    attr: "opacity",
    kind: "string"
  },
  {
    field: "offset",
    attr: "offset",
    kind: "string"
  },
  {
    field: "color2",
    attr: "color2",
    kind: "string"
  },
  {
    field: "offset2",
    attr: "offset2",
    kind: "string"
  },
  {
    field: "origin",
    attr: "origin",
    kind: "string"
  },
  {
    field: "matrix",
    attr: "matrix",
    kind: "string"
  }
];
function stringifyVmlShadow(opts) {
  return `<v:shadow${stringifyVmlAttributes(opts, SHADOW_ATTRS)}/>`;
}
function parseVmlShadow(el) {
  const out = {};
  parseVmlAttributes(el, SHADOW_ATTRS, out);
  return out;
}
var STROKE_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "weight",
    attr: "weight",
    kind: "string"
  },
  {
    field: "color",
    attr: "color",
    kind: "string"
  },
  {
    field: "opacity",
    attr: "opacity",
    kind: "string"
  },
  {
    field: "linestyle",
    attr: "linestyle",
    kind: "string"
  },
  {
    field: "miterlimit",
    attr: "miterlimit",
    kind: "number"
  },
  {
    field: "joinstyle",
    attr: "joinstyle",
    kind: "string"
  },
  {
    field: "endcap",
    attr: "endcap",
    kind: "string"
  },
  {
    field: "dashstyle",
    attr: "dashstyle",
    kind: "string"
  },
  {
    field: "filltype",
    attr: "filltype",
    kind: "string"
  },
  {
    field: "src",
    attr: "src",
    kind: "string"
  },
  {
    field: "imageaspect",
    attr: "imageaspect",
    kind: "string"
  },
  {
    field: "imagesize",
    attr: "imagesize",
    kind: "string"
  },
  {
    field: "imagealignshape",
    attr: "imagealignshape",
    kind: "trueFalse"
  },
  {
    field: "color2",
    attr: "color2",
    kind: "string"
  },
  {
    field: "startarrow",
    attr: "startarrow",
    kind: "string"
  },
  {
    field: "startarrowwidth",
    attr: "startarrowwidth",
    kind: "string"
  },
  {
    field: "startarrowlength",
    attr: "startarrowlength",
    kind: "string"
  },
  {
    field: "endarrow",
    attr: "endarrow",
    kind: "string"
  },
  {
    field: "endarrowwidth",
    attr: "endarrowwidth",
    kind: "string"
  },
  {
    field: "endarrowlength",
    attr: "endarrowlength",
    kind: "string"
  },
  {
    field: "relationshipId",
    attr: "r:id",
    kind: "string"
  },
  {
    field: "insetpen",
    attr: "insetpen",
    kind: "trueFalse"
  },
  {
    field: "officeHref",
    attr: "o:href",
    kind: "string"
  },
  {
    field: "officeAltHref",
    attr: "o:althref",
    kind: "string"
  },
  {
    field: "officeTitle",
    attr: "o:title",
    kind: "string"
  },
  {
    field: "forcedash",
    attr: "o:forcedash",
    kind: "trueFalse"
  },
  {
    field: "officeRelationshipId",
    attr: "o:relid",
    kind: "string"
  }
];
var STROKE_CHILD_ATTRS = [
  {
    field: "ext",
    attr: "v:ext",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "weight",
    attr: "weight",
    kind: "string"
  },
  {
    field: "color",
    attr: "color",
    kind: "string"
  },
  {
    field: "color2",
    attr: "color2",
    kind: "string"
  },
  {
    field: "opacity",
    attr: "opacity",
    kind: "string"
  },
  {
    field: "linestyle",
    attr: "linestyle",
    kind: "string"
  },
  {
    field: "miterlimit",
    attr: "miterlimit",
    kind: "number"
  },
  {
    field: "joinstyle",
    attr: "joinstyle",
    kind: "string"
  },
  {
    field: "endcap",
    attr: "endcap",
    kind: "string"
  },
  {
    field: "dashstyle",
    attr: "dashstyle",
    kind: "string"
  },
  {
    field: "insetpen",
    attr: "insetpen",
    kind: "trueFalse"
  },
  {
    field: "filltype",
    attr: "filltype",
    kind: "string"
  },
  {
    field: "src",
    attr: "src",
    kind: "string"
  },
  {
    field: "imageaspect",
    attr: "imageaspect",
    kind: "string"
  },
  {
    field: "imagesize",
    attr: "imagesize",
    kind: "string"
  },
  {
    field: "imagealignshape",
    attr: "imagealignshape",
    kind: "trueFalse"
  },
  {
    field: "startarrow",
    attr: "startarrow",
    kind: "string"
  },
  {
    field: "startarrowwidth",
    attr: "startarrowwidth",
    kind: "string"
  },
  {
    field: "startarrowlength",
    attr: "startarrowlength",
    kind: "string"
  },
  {
    field: "endarrow",
    attr: "endarrow",
    kind: "string"
  },
  {
    field: "endarrowwidth",
    attr: "endarrowwidth",
    kind: "string"
  },
  {
    field: "endarrowlength",
    attr: "endarrowlength",
    kind: "string"
  },
  {
    field: "officeHref",
    attr: "o:href",
    kind: "string"
  },
  {
    field: "officeAltHref",
    attr: "o:althref",
    kind: "string"
  },
  {
    field: "officeTitle",
    attr: "o:title",
    kind: "string"
  },
  {
    field: "forcedash",
    attr: "o:forcedash",
    kind: "trueFalse"
  }
];
function stringifyVmlStrokeChild(tag, opts) {
  return `<${tag}${stringifyVmlAttributes(opts, STROKE_CHILD_ATTRS)}/>`;
}
function parseVmlStrokeChild(el) {
  const out = {};
  parseVmlAttributes(el, STROKE_CHILD_ATTRS, out);
  return out;
}
function stringifyVmlStroke(opts) {
  const children2 = [];
  if (opts.leftStroke !== void 0) children2.push(stringifyVmlStrokeChild("o:left", opts.leftStroke));
  if (opts.topStroke !== void 0) children2.push(stringifyVmlStrokeChild("o:top", opts.topStroke));
  if (opts.rightStroke !== void 0) children2.push(stringifyVmlStrokeChild("o:right", opts.rightStroke));
  if (opts.bottomStroke !== void 0) children2.push(stringifyVmlStrokeChild("o:bottom", opts.bottomStroke));
  if (opts.columnStroke !== void 0) children2.push(stringifyVmlStrokeChild("o:column", opts.columnStroke));
  const attrStr = stringifyVmlAttributes(opts, STROKE_ATTRS);
  return children2.length > 0 ? `<v:stroke${attrStr}>${children2.join("")}</v:stroke>` : `<v:stroke${attrStr}/>`;
}
function parseVmlStroke(el) {
  const out = {};
  parseVmlAttributes(el, STROKE_ATTRS, out);
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    switch (child.name) {
      case "o:left":
        out.leftStroke = parseVmlStrokeChild(child);
        break;
      case "o:top":
        out.topStroke = parseVmlStrokeChild(child);
        break;
      case "o:right":
        out.rightStroke = parseVmlStrokeChild(child);
        break;
      case "o:bottom":
        out.bottomStroke = parseVmlStrokeChild(child);
        break;
      case "o:column":
        out.columnStroke = parseVmlStrokeChild(child);
    }
  }
  return out;
}
function stringifyVmlTextbox(opts) {
  const attrs2 = [];
  if (opts.id !== void 0) attrs2.push(`id="${escapeXml(opts.id)}"`);
  if (opts.style !== void 0) attrs2.push(`style="${escapeXml(stringifyVmlStyle(opts.style))}"`);
  if (opts.inset !== void 0) attrs2.push(`inset="${escapeXml(opts.inset)}"`);
  if (opts.singleclick !== void 0) attrs2.push(`o:singleclick="${stringifyVmlTrueFalse(opts.singleclick)}"`);
  if (opts.insetmode !== void 0) attrs2.push(`o:insetmode="${opts.insetmode}"`);
  const attrStr = attrs2.length > 0 ? ` ${attrs2.join(" ")}` : "";
  if (opts.txbxContent !== void 0) return `<v:textbox${attrStr}><w:txbxContent>${opts.txbxContent}</w:txbxContent></v:textbox>`;
  if (opts.content !== void 0) return `<v:textbox${attrStr}>${opts.content}</v:textbox>`;
  return `<v:textbox${attrStr}/>`;
}
function parseVmlTextbox(el) {
  const out = {};
  const attrs2 = el.attributes ?? {};
  if (attrs2.id !== void 0) out.id = String(attrs2.id);
  if (attrs2.style !== void 0) out.style = parseVmlShapeStyle(parseVmlStyle(String(attrs2.style)));
  if (attrs2.inset !== void 0) out.inset = String(attrs2.inset);
  if (attrs2["o:singleclick"] !== void 0) out.singleclick = parseVmlTrueFalse(String(attrs2["o:singleclick"]));
  if (attrs2["o:insetmode"] !== void 0) out.insetmode = String(attrs2["o:insetmode"]);
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    if (child.name === "w:txbxContent") {
      out.txbxContent = (child.elements ?? []).map((e) => stringifyElement(e)).join("");
      break;
    }
    if (!child.name?.includes(":")) {
      out.content = stringifyElement(child);
      break;
    }
  }
  return out;
}
var TEXT_PATH_STYLE_MAP = {
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontStyle: "font-style",
  fontVariant: "font-variant",
  textTransform: "text-transform",
  textDecoration: "text-decoration",
  letterSpacing: "letter-spacing",
  vTextAlign: "v-text-align",
  vTextKern: "v-text-kern",
  vTextSpacing: "v-text-spacing",
  vTextSpacingMode: "v-text-spacing-mode"
};
var KEY_TO_TEXT_PATH_FIELD = Object.fromEntries(Object.entries(TEXT_PATH_STYLE_MAP).map(([field, key]) => [key, field]));
function stringifyVmlTextPathStyle(style) {
  return Object.entries(style).map(([key, value]) => `${TEXT_PATH_STYLE_MAP[key]}:${value}`).join(";");
}
function parseVmlTextPathStyle(styleStr) {
  const style = {};
  for (const part of styleStr.split(";")) {
    const [key, val] = part.split(":").map((s) => s.trim());
    if (!key || !val) continue;
    const field = KEY_TO_TEXT_PATH_FIELD[key];
    if (field) style[field] = val;
  }
  return style;
}
var TEXT_PATH_ATTRS = [
  {
    field: "id",
    attr: "id",
    kind: "string"
  },
  {
    field: "on",
    attr: "on",
    kind: "trueFalse"
  },
  {
    field: "fitshape",
    attr: "fitshape",
    kind: "trueFalse"
  },
  {
    field: "fitpath",
    attr: "fitpath",
    kind: "trueFalse"
  },
  {
    field: "trim",
    attr: "trim",
    kind: "trueFalse"
  },
  {
    field: "xscale",
    attr: "xscale",
    kind: "trueFalse"
  },
  {
    field: "string",
    attr: "string",
    kind: "string"
  }
];
function stringifyVmlTextPath(opts) {
  const attrStr = stringifyVmlAttributes(opts, TEXT_PATH_ATTRS);
  if (opts.style !== void 0) return `<v:textpath${attrStr} style="${escapeXml(stringifyVmlTextPathStyle(opts.style))}"/>`;
  return `<v:textpath${attrStr}/>`;
}
function parseVmlTextPath(el) {
  const out = {};
  parseVmlAttributes(el, TEXT_PATH_ATTRS, out);
  if (el.attributes?.style !== void 0) out.style = parseVmlTextPathStyle(String(el.attributes.style));
  return out;
}
var WRAP_ATTRS = [
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "side",
    attr: "side",
    kind: "string"
  },
  {
    field: "anchorx",
    attr: "anchorx",
    kind: "string"
  },
  {
    field: "anchory",
    attr: "anchory",
    kind: "string"
  }
];
function stringifyVmlWrap(opts) {
  return `<w10:wrap${stringifyVmlAttributes(opts, WRAP_ATTRS)}/>`;
}
function parseVmlWrap(el) {
  const out = {};
  parseVmlAttributes(el, WRAP_ATTRS, out);
  return out;
}
function stringifyVmlAnchorLock(_opts) {
  return "<w10:anchorlock/>";
}
function parseVmlAnchorLock(_el) {
  return {};
}
var BORDER_ATTRS = [
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "width",
    attr: "width",
    kind: "number"
  },
  {
    field: "shadow",
    attr: "shadow",
    kind: "trueFalseBlank"
  }
];
function stringifyVmlBorder(tag, opts) {
  return `<${tag}${stringifyVmlAttributes(opts, BORDER_ATTRS)}/>`;
}
function parseVmlBorder(el) {
  const out = {};
  parseVmlAttributes(el, BORDER_ATTRS, out);
  return out;
}
var GROUP_FILL_ATTRS = [{
  field: "filled",
  attr: "filled",
  kind: "trueFalse"
}, {
  field: "fillcolor",
  attr: "fillcolor",
  kind: "string"
}];
var ALL_SHAPE_ATTRS = [
  ...VML_CORE_ATTRS,
  ...VML_OFFICE_CORE_ATTRS,
  ...VML_SHAPE_ATTRS,
  ...VML_OFFICE_SHAPE_ATTRS
];
var PATH_ATTR = [{
  field: "path",
  attr: "path",
  kind: "string"
}];
function stringifyShapeAttrs(opts, extraSpecs = []) {
  let attrStr = stringifyVmlAttributes(opts, [
    ...ALL_SHAPE_ATTRS,
    ...extraSpecs,
    ...PATH_ATTR
  ]);
  const style = opts.style;
  if (style !== void 0) attrStr += ` style="${escapeXml(stringifyVmlStyle(style))}"`;
  return attrStr;
}
function stringifyShapeElements(opts) {
  const parts = [];
  if (opts.pathElement !== void 0) parts.push(stringifyVmlPath(opts.pathElement));
  if (opts.formulas !== void 0) parts.push(stringifyVmlFormulas(opts.formulas));
  if (opts.handles !== void 0) parts.push(stringifyVmlHandles(opts.handles));
  if (opts.fill !== void 0) parts.push(stringifyVmlFill(opts.fill));
  if (opts.stroke !== void 0) parts.push(stringifyVmlStroke(opts.stroke));
  if (opts.shadow !== void 0) parts.push(stringifyVmlShadow(opts.shadow));
  if (opts.textbox !== void 0) parts.push(stringifyVmlTextbox(opts.textbox));
  if (opts.textpath !== void 0) parts.push(stringifyVmlTextPath(opts.textpath));
  if (opts.imagedata !== void 0) parts.push(stringifyVmlImageData(opts.imagedata));
  if (opts.skew !== void 0) parts.push(stringifyVmlSkew(opts.skew));
  if (opts.extrusion !== void 0) parts.push(stringifyVmlExtrusion(opts.extrusion));
  if (opts.callout !== void 0) parts.push(stringifyVmlCallout(opts.callout));
  if (opts.lock !== void 0) parts.push(stringifyVmlLock(opts.lock));
  if (opts.clippath !== void 0) parts.push(stringifyVmlClipPath(opts.clippath));
  if (opts.signatureline !== void 0) parts.push(stringifyVmlSignatureLine(opts.signatureline));
  if (opts.wrap !== void 0) parts.push(stringifyVmlWrap(opts.wrap));
  if (opts.anchorlock !== void 0) parts.push(stringifyVmlAnchorLock(opts.anchorlock));
  if (opts.bordertop !== void 0) parts.push(stringifyVmlBorder("w10:bordertop", opts.bordertop));
  if (opts.borderbottom !== void 0) parts.push(stringifyVmlBorder("w10:borderbottom", opts.borderbottom));
  if (opts.borderleft !== void 0) parts.push(stringifyVmlBorder("w10:borderleft", opts.borderleft));
  if (opts.borderright !== void 0) parts.push(stringifyVmlBorder("w10:borderright", opts.borderright));
  if (opts.clientData !== void 0) parts.push(stringifyVmlClientData(opts.clientData));
  if (opts.textdata !== void 0) parts.push(stringifyVmlTextData(opts.textdata));
  if (opts.rawChildrenXml) parts.push(opts.rawChildrenXml);
  return parts.join("");
}
function parseShapeAttrs(el, out, extraSpecs = []) {
  parseVmlAttributes(el, [
    ...ALL_SHAPE_ATTRS,
    ...extraSpecs,
    ...PATH_ATTR
  ], out);
  if (el.attributes?.style !== void 0) out.style = parseVmlShapeStyle(parseVmlStyle(String(el.attributes.style)));
}
var NESTED_SHAPE_NAMES = /* @__PURE__ */ new Set([
  "v:shape",
  "v:shapetype",
  "v:group",
  "v:rect",
  "v:roundrect",
  "v:oval",
  "v:line",
  "v:image",
  "v:arc",
  "v:curve",
  "v:polyline"
]);
function parseShapeElements(el, out) {
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    switch (child.name) {
      case "v:path":
        out.pathElement = parseVmlPath(child);
        break;
      case "v:formulas":
        out.formulas = parseVmlFormulas(child);
        break;
      case "v:handles":
        out.handles = parseVmlHandles(child);
        break;
      case "v:fill":
        out.fill = parseVmlFill(child);
        break;
      case "v:stroke":
        out.stroke = parseVmlStroke(child);
        break;
      case "v:shadow":
        out.shadow = parseVmlShadow(child);
        break;
      case "v:textbox":
        out.textbox = parseVmlTextbox(child);
        break;
      case "v:textpath":
        out.textpath = parseVmlTextPath(child);
        break;
      case "v:imagedata":
        out.imagedata = parseVmlImageData(child);
        break;
      case "o:skew":
        out.skew = parseVmlSkew(child);
        break;
      case "o:extrusion":
        out.extrusion = parseVmlExtrusion(child);
        break;
      case "o:callout":
        out.callout = parseVmlCallout(child);
        break;
      case "o:lock":
        out.lock = parseVmlLock(child);
        break;
      case "o:clippath":
        out.clippath = parseVmlClipPath(child);
        break;
      case "o:signatureline":
        out.signatureline = parseVmlSignatureLine(child);
        break;
      case "w10:wrap":
        out.wrap = parseVmlWrap(child);
        break;
      case "w10:anchorlock":
        out.anchorlock = parseVmlAnchorLock(child);
        break;
      case "w10:bordertop":
        out.bordertop = parseVmlBorder(child);
        break;
      case "w10:borderbottom":
        out.borderbottom = parseVmlBorder(child);
        break;
      case "w10:borderleft":
        out.borderleft = parseVmlBorder(child);
        break;
      case "w10:borderright":
        out.borderright = parseVmlBorder(child);
        break;
      case "x:ClientData":
        out.clientData = parseVmlClientData(child);
        break;
      case "pvml:textdata":
        out.textdata = parseVmlTextData(child);
        break;
      case "pvml:iscomment":
        out.iscomment = parseVmlIsComment(child);
        break;
      default:
        if (child.name === "o:complex" || child.name === "o:ink" || child.name === "o:equationxml" || child.name !== void 0 && NESTED_SHAPE_NAMES.has(child.name)) break;
        out.rawChildrenXml = (typeof out.rawChildrenXml === "string" ? out.rawChildrenXml : "") + stringifyElement(child);
    }
  }
}
function stringifyShapeElement(tag, opts, extraSpecs = [], childrenXml = "") {
  const attrStr = stringifyShapeAttrs(opts, extraSpecs);
  return childrenXml !== "" ? `<${tag}${attrStr}>${childrenXml}</${tag}>` : `<${tag}${attrStr}/>`;
}
var SHAPE_EXTRA_ATTRS = [
  {
    field: "type",
    attr: "type",
    kind: "string"
  },
  {
    field: "adj",
    attr: "adj",
    kind: "string"
  },
  {
    field: "gfxdata",
    attr: "o:gfxdata",
    kind: "string"
  },
  {
    field: "equationxml",
    attr: "equationxml",
    kind: "string"
  }
];
function stringifyVmlShape(opts) {
  let children2 = stringifyShapeElements(opts);
  if (opts.ink !== void 0) children2 += stringifyVmlInk(opts.ink);
  if (opts.equationxmlElement !== void 0) children2 += stringifyVmlEquationXml(opts.equationxmlElement);
  if (opts.iscomment !== void 0) children2 += stringifyVmlIsComment(opts.iscomment);
  return stringifyShapeElement("v:shape", opts, SHAPE_EXTRA_ATTRS, children2);
}
function parseVmlShape(el) {
  const out = {};
  parseShapeAttrs(el, out, SHAPE_EXTRA_ATTRS);
  parseShapeElements(el, out);
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    if (child.name === "o:ink") out.ink = parseVmlInk(child);
    else if (child.name === "o:equationxml") out.equationxmlElement = parseVmlEquationXml(child);
  }
  return out;
}
var SHAPETYPE_EXTRA_ATTRS = [{
  field: "adj",
  attr: "adj",
  kind: "string"
}, {
  field: "master",
  attr: "o:master",
  kind: "string"
}];
function stringifyVmlShapetype(opts) {
  let children2 = stringifyShapeElements(opts);
  if (opts.complex !== void 0) children2 += stringifyVmlComplex(opts.complex);
  return stringifyShapeElement("v:shapetype", opts, SHAPETYPE_EXTRA_ATTRS, children2);
}
var GROUP_ATTRS = [
  ...VML_CORE_ATTRS,
  ...VML_OFFICE_CORE_ATTRS,
  ...GROUP_FILL_ATTRS,
  {
    field: "editas",
    attr: "editas",
    kind: "string"
  },
  {
    field: "tableproperties",
    attr: "o:tableproperties",
    kind: "string"
  },
  {
    field: "tablelimits",
    attr: "o:tablelimits",
    kind: "string"
  },
  ...PATH_ATTR
];
var SHAPEDEFAULTS_ATTRS = [
  ...EXT_ATTR,
  {
    field: "spidmax",
    attr: "spidmax",
    kind: "number"
  },
  {
    field: "style",
    attr: "style",
    kind: "string"
  },
  {
    field: "fill",
    attr: "fill",
    kind: "trueFalse"
  },
  {
    field: "fillcolor",
    attr: "fillcolor",
    kind: "string"
  },
  {
    field: "stroke",
    attr: "stroke",
    kind: "trueFalse"
  },
  {
    field: "strokecolor",
    attr: "strokecolor",
    kind: "string"
  },
  {
    field: "allowincell",
    attr: "o:allowincell",
    kind: "trueFalse"
  }
];
var COLORMENU_ATTRS = [
  ...EXT_ATTR,
  {
    field: "strokecolor",
    attr: "strokecolor",
    kind: "string"
  },
  {
    field: "fillcolor",
    attr: "fillcolor",
    kind: "string"
  },
  {
    field: "shadowcolor",
    attr: "shadowcolor",
    kind: "string"
  },
  {
    field: "extrusioncolor",
    attr: "extrusioncolor",
    kind: "string"
  }
];
var ENTRY_ATTRS = [{
  field: "new",
  attr: "new",
  kind: "number"
}, {
  field: "old",
  attr: "old",
  kind: "number"
}];
function stringifyVmlIdMap(opts) {
  return `<o:idmap${stringifyVmlAttributes(opts, [...EXT_ATTR, {
    field: "data",
    attr: "data",
    kind: "string"
  }])}/>`;
}
function stringifyVmlRegroupTable(opts) {
  const entries = (opts.entries ?? []).map((entry) => `<o:entry${stringifyVmlAttributes(entry, ENTRY_ATTRS)}/>`).join("");
  return `<o:regrouptable${stringifyVmlAttributes(opts, EXT_ATTR)}>${entries}</o:regrouptable>`;
}
function stringifyVmlRuleProxy(proxy) {
  const attrs2 = [];
  if (proxy.start !== void 0) attrs2.push(`start="${stringifyVmlTrueFalseBlank(proxy.start)}"`);
  if (proxy.end !== void 0) attrs2.push(`end="${stringifyVmlTrueFalseBlank(proxy.end)}"`);
  if (proxy.idref !== void 0) attrs2.push(`idref="${proxy.idref}"`);
  if (proxy.connectloc !== void 0) attrs2.push(`connectloc="${proxy.connectloc}"`);
  return `<o:proxy${attrs2.length > 0 ? " " + attrs2.join(" ") : ""}/>`;
}
function stringifyVmlRule(rule) {
  const attrs2 = [`id="${rule.id}"`];
  if (rule.type !== void 0) attrs2.push(`type="${rule.type}"`);
  if (rule.how !== void 0) attrs2.push(`how="${rule.how}"`);
  if (rule.idref !== void 0) attrs2.push(`idref="${rule.idref}"`);
  const proxies = (rule.proxies ?? []).map(stringifyVmlRuleProxy).join("");
  return `<o:r${attrs2.length > 0 ? " " + attrs2.join(" ") : ""}>${proxies}</o:r>`;
}
function stringifyVmlRulesBlock(opts) {
  const rules = (opts.rules ?? []).map(stringifyVmlRule).join("");
  return `<o:rules${stringifyVmlAttributes(opts, EXT_ATTR)}>${rules}</o:rules>`;
}
function stringifyVmlShapeLayout(opts) {
  const children2 = [];
  if (opts.idmap !== void 0) children2.push(stringifyVmlIdMap(opts.idmap));
  if (opts.regrouptable !== void 0) children2.push(stringifyVmlRegroupTable(opts.regrouptable));
  if (opts.rules !== void 0) children2.push(stringifyVmlRulesBlock(opts.rules));
  const attrStr = stringifyVmlAttributes(opts, EXT_ATTR);
  return children2.length > 0 ? `<o:shapelayout${attrStr}>${children2.join("")}</o:shapelayout>` : `<o:shapelayout${attrStr}/>`;
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/theme-BKnXRmvn.mjs
var DEFAULT_COLORS = {
  dark1: "000000",
  light1: "FFFFFF",
  dark2: "44546A",
  light2: "E7E6E6",
  accent1: "4472C4",
  accent2: "ED7D31",
  accent3: "A5A5A5",
  accent4: "FFC000",
  accent5: "5B9BD5",
  accent6: "70AD47",
  hyperlink: "0563C1",
  followedHyperlink: "954F72"
};
var COLOR_TAGS = [
  {
    tag: "a:dk1",
    key: "dark1"
  },
  {
    tag: "a:lt1",
    key: "light1"
  },
  {
    tag: "a:dk2",
    key: "dark2"
  },
  {
    tag: "a:lt2",
    key: "light2"
  },
  {
    tag: "a:accent1",
    key: "accent1"
  },
  {
    tag: "a:accent2",
    key: "accent2"
  },
  {
    tag: "a:accent3",
    key: "accent3"
  },
  {
    tag: "a:accent4",
    key: "accent4"
  },
  {
    tag: "a:accent5",
    key: "accent5"
  },
  {
    tag: "a:accent6",
    key: "accent6"
  },
  {
    tag: "a:hlink",
    key: "hyperlink"
  },
  {
    tag: "a:folHlink",
    key: "followedHyperlink"
  }
];
var DEFAULT_SYS_CLR = {
  dark1: "windowText",
  light1: "window"
};
function stringifyColorTag(tag, key, opts) {
  const userValue = opts?.[key];
  if (userValue !== void 0) return `<${tag}>${typeof userValue === "string" ? `<a:srgbClr val="${userValue}"/>` : systemColorDesc.stringify(userValue, void 0) ?? ""}</${tag}>`;
  const defaultValue = DEFAULT_COLORS[key];
  const sysClr = DEFAULT_SYS_CLR[key];
  if (sysClr) return `<${tag}><a:sysClr val="${sysClr}" lastClr="${defaultValue}"/></${tag}>`;
  return `<${tag}><a:srgbClr val="${defaultValue}"/></${tag}>`;
}
function stringifyColorScheme(opts, fallbackName) {
  return `<a:clrScheme name="${opts?.name ?? fallbackName}">${COLOR_TAGS.map(({ tag, key }) => stringifyColorTag(tag, key, opts)).join("")}</a:clrScheme>`;
}
function parseColorScheme(el, ctx) {
  if (!el) return void 0;
  const result = {};
  const name = el.attributes?.["name"];
  if (name) result.name = String(name);
  for (const { tag, key } of COLOR_TAGS) {
    const colorEl = findChild(el, tag);
    if (!colorEl) continue;
    const sysClr = findChild(colorEl, "a:sysClr");
    if (sysClr) {
      result[key] = systemColorDesc.parse(sysClr, ctx);
      continue;
    }
    const val = findChild(colorEl, "a:srgbClr")?.attributes?.["val"];
    if (val !== void 0) result[key] = String(val);
  }
  return result;
}
function stringifyCustomColors(opts, ctx) {
  if (!opts || opts.length === 0) return "";
  return `<a:custClrLst>${opts.map((c) => {
    return `<a:custClr${c.name ? ` name="${c.name}"` : ""}>${stringifyColorChoice(c.color, ctx)}</a:custClr>`;
  }).join("")}</a:custClrLst>`;
}
function parseCustomColors(el, ctx) {
  if (!el) return void 0;
  const result = [];
  for (const child of el.elements ?? []) {
    if (child.name !== "a:custClr") continue;
    const color = parseColorChoice(child, ctx);
    if (!color) continue;
    const name = child.attributes?.["name"];
    result.push(name !== void 0 ? {
      name: String(name),
      color
    } : { color });
  }
  return result.length > 0 ? result : void 0;
}
function stringifyExtraColorSchemes(opts, fallbackName) {
  if (!opts || opts.length === 0) return "<a:extraClrSchemeLst/>";
  return `<a:extraClrSchemeLst>${opts.map((scheme) => {
    return `<a:extraClrScheme>${stringifyColorScheme(scheme.colorScheme, scheme.colorScheme.name ?? fallbackName)}${scheme.colorMapping ? stringifyColorMapping(scheme.colorMapping) : ""}</a:extraClrScheme>`;
  }).join("")}</a:extraClrSchemeLst>`;
}
function parseExtraColorSchemes(el, ctx) {
  if (!el) return void 0;
  const result = [];
  for (const child of el.elements ?? []) {
    if (child.name !== "a:extraClrScheme") continue;
    const colorScheme = parseColorScheme(findChild(child, "a:clrScheme"), ctx);
    if (!colorScheme) continue;
    const colorMapping = parseColorMapping(findChild(child, "a:clrMap"));
    result.push(colorMapping ? {
      colorScheme,
      colorMapping
    } : { colorScheme });
  }
  return result.length > 0 ? result : void 0;
}
function stringifyTextFont(tag, opts) {
  if (!opts) return "";
  const attrs2 = [`typeface="${escapeXml(opts.typeface)}"`];
  if (opts.panose !== void 0) attrs2.push(`panose="${escapeXml(opts.panose)}"`);
  if (opts.pitchFamily !== void 0) attrs2.push(`pitchFamily="${opts.pitchFamily}"`);
  if (opts.charset !== void 0) attrs2.push(`charset="${opts.charset}"`);
  return `<${tag} ${attrs2.join(" ")}/>`;
}
function parseTextFont(el) {
  if (!el?.attributes) return void 0;
  const typeface = el.attributes["typeface"];
  if (typeface === void 0) return void 0;
  const result = { typeface: String(typeface) };
  if (el.attributes["panose"] !== void 0) result.panose = String(el.attributes["panose"]);
  if (el.attributes["pitchFamily"] !== void 0) result.pitchFamily = Number(el.attributes["pitchFamily"]);
  if (el.attributes["charset"] !== void 0) result.charset = Number(el.attributes["charset"]);
  return result;
}
function stringifyFontCollection(tag, opts) {
  return `<${tag}>${stringifyTextFont("a:latin", opts?.latin)}${stringifyTextFont("a:ea", opts?.eastAsian)}${stringifyTextFont("a:cs", opts?.complexScript)}${(opts?.supplementalFonts ?? []).map((f) => `<a:font script="${escapeXml(f.script)}" typeface="${escapeXml(f.typeface)}"/>`).join("")}</${tag}>`;
}
function parseFontCollection(el) {
  if (!el) return void 0;
  const result = {};
  const latin = parseTextFont(findChild(el, "a:latin"));
  if (latin) result.latin = latin;
  const eastAsian = parseTextFont(findChild(el, "a:ea"));
  if (eastAsian) result.eastAsian = eastAsian;
  const complexScript = parseTextFont(findChild(el, "a:cs"));
  if (complexScript) result.complexScript = complexScript;
  const supplementalFonts = (el.elements ?? []).filter((c) => c.name === "a:font").map((c) => {
    const script = c.attributes?.["script"];
    const typeface = c.attributes?.["typeface"];
    if (script === void 0 || typeface === void 0) return void 0;
    return {
      script: String(script),
      typeface: String(typeface)
    };
  }).filter((v) => v !== void 0);
  if (supplementalFonts.length > 0) result.supplementalFonts = supplementalFonts;
  return Object.keys(result).length > 0 ? result : void 0;
}
var DEFAULT_MAJOR_FONT = {
  latin: {
    typeface: "Calibri Light",
    panose: "020F0302020204030204"
  },
  eastAsian: { typeface: "" },
  complexScript: { typeface: "" }
};
var DEFAULT_MINOR_FONT = {
  latin: {
    typeface: "Calibri",
    panose: "020F0502020204030204"
  },
  eastAsian: { typeface: "" },
  complexScript: { typeface: "" }
};
function stringifyFontScheme(opts, fallbackName) {
  const majorFont = stringifyFontCollection("a:majorFont", opts?.majorFont ? {
    ...DEFAULT_MAJOR_FONT,
    ...opts.majorFont
  } : DEFAULT_MAJOR_FONT);
  const minorFont = stringifyFontCollection("a:minorFont", opts?.minorFont ? {
    ...DEFAULT_MINOR_FONT,
    ...opts.minorFont
  } : DEFAULT_MINOR_FONT);
  return `<a:fontScheme name="${opts?.name ?? fallbackName}">${majorFont}${minorFont}</a:fontScheme>`;
}
function parseFontScheme(el) {
  if (!el) return void 0;
  const result = {};
  const name = el.attributes?.["name"];
  if (name) result.name = String(name);
  const majorFont = parseFontCollection(findChild(el, "a:majorFont"));
  if (majorFont) result.majorFont = majorFont;
  const minorFont = parseFontCollection(findChild(el, "a:minorFont"));
  if (minorFont) result.minorFont = minorFont;
  return Object.keys(result).length > 0 ? result : void 0;
}
function stringifyDefaultShapeDefinition(tag, opts, ctx) {
  return `<${tag}>${opts.shapeProperties !== void 0 ? `<a:spPr>${shapePropertiesDesc.stringify(opts.shapeProperties, ctx) ?? ""}</a:spPr>` : ""}${opts.bodyProperties !== void 0 ? bodyPropertiesDesc.stringify(opts.bodyProperties, ctx) || "<a:bodyPr/>" : ""}${opts.listStyle !== void 0 ? `<a:lstStyle>${textListStyleDesc.stringify(opts.listStyle, ctx) ?? ""}</a:lstStyle>` : ""}${opts.shapeStyle ? stringifyShapeStyle(opts.shapeStyle, ctx) : ""}</${tag}>`;
}
function parseDefaultShapeDefinition(el, ctx) {
  if (!el) return void 0;
  const result = {};
  const spPr = findChild(el, "a:spPr");
  if (spPr) result.shapeProperties = shapePropertiesDesc.parse(spPr, ctx) ?? {};
  const bodyPr = findChild(el, "a:bodyPr");
  if (bodyPr) result.bodyProperties = bodyPropertiesDesc.parse(bodyPr, ctx) ?? {};
  const lstStyle = findChild(el, "a:lstStyle");
  if (lstStyle) result.listStyle = textListStyleDesc.parse(lstStyle, ctx) ?? {};
  const style = findChild(el, "a:style");
  if (style) {
    const shapeStyle = parseShapeStyle(style, ctx);
    if (shapeStyle) result.shapeStyle = shapeStyle;
  }
  return Object.keys(result).length > 0 ? result : void 0;
}
function stringifyObjectDefaults(opts, ctx) {
  if (!opts) return "<a:objectDefaults/>";
  const spDef = opts.shapeDefault ? stringifyDefaultShapeDefinition("a:spDef", opts.shapeDefault, ctx) : "";
  const lnDef = opts.lineDefault ? stringifyDefaultShapeDefinition("a:lnDef", opts.lineDefault, ctx) : "";
  const txDef = opts.textDefault ? stringifyDefaultShapeDefinition("a:txDef", opts.textDefault, ctx) : "";
  if (!spDef && !lnDef && !txDef) return "<a:objectDefaults/>";
  return `<a:objectDefaults>${spDef}${lnDef}${txDef}</a:objectDefaults>`;
}
function parseObjectDefaults(el, ctx) {
  if (!el) return void 0;
  const result = {};
  const shapeDefault = parseDefaultShapeDefinition(findChild(el, "a:spDef"), ctx);
  if (shapeDefault) result.shapeDefault = shapeDefault;
  const lineDefault = parseDefaultShapeDefinition(findChild(el, "a:lnDef"), ctx);
  if (lineDefault) result.lineDefault = lineDefault;
  const textDefault = parseDefaultShapeDefinition(findChild(el, "a:txDef"), ctx);
  if (textDefault) result.textDefault = textDefault;
  return Object.keys(result).length > 0 ? result : void 0;
}
var DEFAULT_FORMAT_SCHEME_XML = '<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="110000"/><a:satMod val="105000"/><a:tint val="67000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="103000"/><a:tint val="73000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="105000"/><a:satMod val="109000"/><a:tint val="81000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="102000"/><a:satMod val="103000"/><a:tint val="94000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="100000"/><a:satMod val="110000"/><a:shade val="100000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="99000"/><a:satMod val="120000"/><a:shade val="78000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad="57150" dist="19050" dir="5400000" algn="ctr" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="63000"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/><a:satMod val="170000"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="102000"/><a:satMod val="150000"/><a:tint val="93000"/><a:shade val="98000"/></a:schemeClr></a:gs><a:gs pos="50000"><a:schemeClr val="phClr"><a:lumMod val="103000"/><a:satMod val="130000"/><a:tint val="98000"/><a:shade val="90000"/></a:schemeClr></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:satMod val="120000"/><a:shade val="63000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme>';
function requireCtx(ctx, field) {
  if (!ctx) throw new Error(`buildThemeXml: ${field} requires a WriteContext`);
  return ctx;
}
function buildThemeXml(options, ctx) {
  const opts = options ?? {};
  const name = opts.name ?? "Office Theme";
  return `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${name}"><a:themeElements>${stringifyColorScheme(opts.colorScheme, name)}${stringifyFontScheme(opts.fontScheme, name)}${opts.formatScheme ? stringifyFormatScheme(opts.formatScheme, requireCtx(ctx, "formatScheme")) : DEFAULT_FORMAT_SCHEME_XML}</a:themeElements>${opts.objectDefaults ? stringifyObjectDefaults(opts.objectDefaults, requireCtx(ctx, "objectDefaults")) : "<a:objectDefaults/>"}${stringifyExtraColorSchemes(opts.extraColorSchemes, name)}${opts.customColors ? stringifyCustomColors(opts.customColors, requireCtx(ctx, "customColors")) : ""}</a:theme>`;
}
var DEFAULT_XML = buildThemeXml();
function createThemeXml(options, ctx) {
  if (!options) return DEFAULT_XML;
  return buildThemeXml(options, ctx);
}
var themeDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    return buildThemeXml(opts, ctx);
  },
  parse(el, ctx) {
    const result = {};
    const name = el.attributes?.["name"];
    if (name) result.name = String(name);
    const themeElements = findChild(el, "a:themeElements");
    if (themeElements) {
      const colorScheme = parseColorScheme(findChild(themeElements, "a:clrScheme"), ctx);
      if (colorScheme) result.colorScheme = colorScheme;
      const fontScheme = parseFontScheme(findChild(themeElements, "a:fontScheme"));
      if (fontScheme) result.fontScheme = fontScheme;
      const formatScheme = parseFormatScheme(findChild(themeElements, "a:fmtScheme"), ctx);
      if (formatScheme) result.formatScheme = formatScheme;
    }
    const objectDefaults = parseObjectDefaults(findChild(el, "a:objectDefaults"), ctx);
    if (objectDefaults) result.objectDefaults = objectDefaults;
    const extraColorSchemes = parseExtraColorSchemes(findChild(el, "a:extraClrSchemeLst"), ctx);
    if (extraColorSchemes) result.extraColorSchemes = extraColorSchemes;
    const customColors = parseCustomColors(findChild(el, "a:custClrLst"), ctx);
    if (customColors) result.customColors = customColors;
    return result;
  }
};

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/core/dist/index.mjs
var TargetModeType = { EXTERNAL: "External" };
var Relationships = class {
  entries = [];
  addRelationship(id, type, target, targetMode) {
    this.entries.push({
      id: `rId${id}`,
      type,
      target,
      targetMode
    });
  }
  /**
  * Register a relationship with an auto-allocated sequential id and return
  * the numeric id. Prefer this over the `relationshipCount + 1` +
  * `addRelationship` pair at every call site that wants the next id; reach
  * for `addRelationship` directly only when the id is externally determined
  * (a contiguous batch pre-computed from an offset, a fixed rId1, …).
  *
  * The id is max(existing) + 1, not count + 1 — externally-determined ids
  * (passthrough source ids) can leave gaps, and a gap-following count-based
  * id would collide with an existing entry (duplicate Relationship ids
  * corrupt the package for Office applications).
  */
  add(type, target, targetMode) {
    const id = this.nextRelationshipId;
    this.entries.push({
      id: `rId${id}`,
      type,
      target,
      targetMode
    });
    return id;
  }
  get relationshipCount() {
    return this.entries.length;
  }
  /** The next free numeric id (max existing + 1) — the safe offset base when
  * externally-determined ids (passthrough source ids) leave gaps below it. */
  get nextRelationshipId() {
    let max2 = 0;
    for (const e of this.entries) {
      const n = /^rId(\d+)$/.exec(e.id);
      if (n) max2 = Math.max(max2, Number(n[1]));
    }
    return max2 + 1;
  }
  /** Rename the first entry matching `type` to `newId` — used to promote a
  * structured rel (e.g. the slide layout) to its source id when the
  * source rId is free. No-op when the slot is taken or no match. */
  renameEntryByType(type, newId) {
    if (this.hasId(`rId${newId}`)) return;
    const entry = this.entries.find((e) => e.type === type);
    if (entry) entry.id = `rId${newId}`;
  }
  /** Numeric id of the first entry matching `kind` (last segment of the type
  * URI), or undefined when none is registered. */
  idByKind(kind) {
    const entry = this.entries.find((e) => e.type.split("/").pop() === kind);
    if (!entry) return void 0;
    const m = /^rId(\d+)$/.exec(entry.id);
    if (!m) return void 0;
    return Number(m[1]);
  }
  /**
  * Claim a captured source relationship (round-trip pre-claim). Verbatim
  * part content references the source rIds, so re-emit the rel at its exact
  * source id whenever that slot is still free — renumbering would dangle
  * those references. Skips rels already registered under the same
  * kind+target (the model absorbed them); falls back to an auto id for
  * non-numeric source ids.
  */
  claimSourceRel(rel) {
    if (this.hasRelationship(rel.relationshipType, rel.target)) return;
    const numeric = /^rId(\d+)$/.exec(rel.rId);
    if (numeric && !this.hasId(rel.rId)) this.addRelationship(Number(numeric[1]), rel.relationshipType, rel.target, rel.targetMode);
    else this.add(rel.relationshipType, rel.target, rel.targetMode);
  }
  /**
  * True when a relationship of the same kind and target is already
  * registered. The kind compares only the relationship type's last path
  * segment, so the transitional and strict URI forms of the same
  * relationship compare equal — passthrough re-emission uses this to skip
  * relationships the compiler already wired (a duplicate entry corrupts the
  * package for Office applications).
  */
  hasRelationship(type, target) {
    const kind = type.split("/").pop();
    return this.entries.some((e) => e.type.split("/").pop() === kind && e.target === target);
  }
  /**
  * True when any entry carries the relationship kind (last type segment).
  * Round-trip re-emission uses this as the ownership test: a rebuilt part
  * that already registered a rel of this kind absorbed the concept, so the
  * captured source rel (possibly a renamed target or the ISO-strict type
  * dual) must not be re-emitted alongside it.
  */
  hasRelationshipKind(kind) {
    return this.entries.some((e) => e.type.split("/").pop() === kind);
  }
  /** True when an entry already occupies this exact relationship id. */
  hasId(id) {
    return this.entries.some((e) => e.id === id);
  }
  /**
  * The id of the entry matching kind+target (same last-path-segment equality
  * as {@link hasRelationship}), or undefined when absent. Round-trip legs use
  * this to point a reference element at an already-registered relationship.
  */
  idOf(type, target) {
    const kind = type.split("/").pop();
    return this.entries.find((e) => e.type.split("/").pop() === kind && e.target === target)?.id;
  }
  /** Directly builds XML string — zero intermediate tree allocation. */
  serialize() {
    const p = ['<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'];
    for (const e of this.entries) {
      const tm = e.targetMode ? ` TargetMode="${escapeXml(e.targetMode)}"` : "";
      p.push(`<Relationship Id="${escapeXml(e.id)}" Type="${escapeXml(e.type)}" Target="${escapeXml(e.target)}"${tm}/>`);
    }
    p.push("</Relationships>");
    return p.join("");
  }
};
function buildRootRelationships(mainPartTarget, includeCustomProperties, passthroughRelationships) {
  const rels = new Relationships();
  rels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", mainPartTarget);
  rels.addRelationship(2, "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml");
  rels.addRelationship(3, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", "docProps/app.xml");
  if (includeCustomProperties) rels.addRelationship(4, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/custom-properties", "docProps/custom.xml");
  for (const rel of passthroughRelationships ?? []) {
    if (rel.source !== "") continue;
    if (rels.hasRelationship(rel.relationshipType, rel.target)) continue;
    rels.add(rel.relationshipType, rel.target, rel.targetMode);
  }
  return rels;
}
function partPathToRelsPath(partPath) {
  const idx = partPath.lastIndexOf("/");
  return `${partPath.substring(0, idx)}/_rels/${partPath.substring(idx + 1)}.rels`;
}
function resolveRelationshipTarget(partPath, target) {
  if (target.startsWith("/")) return target.slice(1);
  const dir = partPath.substring(0, partPath.lastIndexOf("/"));
  const dirParts = dir ? dir.split("/") : [];
  for (const part of target.split("/")) if (part === "..") dirParts.pop();
  else if (part !== "." && part !== "") dirParts.push(part);
  return dirParts.join("/");
}
var hashKeyCache = /* @__PURE__ */ new WeakMap();
var Media = class {
  map = /* @__PURE__ */ new Map();
  /** FNV-1a content key ("len:hash") -> canonical file name, for cross-object dedup. */
  byContent = /* @__PURE__ */ new Map();
  /** Memoized result per input buffer — the repeated-reference hot path. */
  verified = /* @__PURE__ */ new WeakMap();
  counter = 0;
  /**
  * Register media, reusing the existing entry when the bytes already exist.
  * Returns the canonical entry (shared across all identical references) —
  * callers read `entry.fileName` for placeholders/relationship targets or use
  * the whole entry (e.g. drawing XML). The `build` callback constructs the
  * package-specific entry from the allocated file name.
  *
  * Pass `fileName` to pin the name (round-trip scenarios preserving a source
  * file name); omit it to allocate the next sequential `imageN.ext`.
  */
  addMedia(data, type, build, fileName) {
    const verifiedName = this.verified.get(data);
    if (verifiedName !== void 0) {
      const existing = this.map.get(verifiedName);
      if (existing.type === type) return existing;
    }
    const key = `${type}:${this.contentKey(data)}`;
    const existingName = this.byContent.get(key);
    if (existingName !== void 0) {
      const existing = this.map.get(existingName);
      if (existing.type === type && this.byteEqual(existing.data, data)) {
        this.verified.set(data, existingName);
        return existing;
      }
    }
    const resolvedName = fileName ?? this.nextName(type);
    const finalName = this.map.has(resolvedName) ? this.nextName(type) : resolvedName;
    const entry = build(finalName);
    this.map.set(finalName, entry);
    this.byContent.set(key, finalName);
    this.verified.set(data, finalName);
    return entry;
  }
  /** Next sequential `imageN.${type}` that isn't already in use. */
  nextName(type) {
    let name = `image${++this.counter}.${type}`;
    while (this.map.has(name)) name = `image${++this.counter}.${type}`;
    return name;
  }
  /**
  * "length:hash" content key for `data`, memoized. Native CRC-32
  * (`zlib.crc32`) on Node/Bun — ~59× faster than JS hashing on 100 MB inputs;
  * FNV-1a fallback where no native zlib resolved. Both are 32-bit candidate
  * keys; the byte verification in `addMedia` rules out collisions, so the
  * weaker hash needs no collision handling of its own.
  */
  contentKey(data) {
    const cached = hashKeyCache.get(data);
    if (cached !== void 0) return cached;
    const native = nativeCrc32(data);
    let key;
    if (native !== void 0) key = `${data.length}:${(native >>> 0).toString(16)}`;
    else {
      let hash = 2166136261;
      for (const byte of data) {
        hash ^= byte;
        hash = Math.imul(hash, 16777619);
      }
      key = `${data.length}:${(hash >>> 0).toString(16)}`;
    }
    hashKeyCache.set(data, key);
    return key;
  }
  /** Structural equality with early exit on the first mismatch. */
  byteEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  /** All registered media entries. */
  get array() {
    return [...this.map.values()];
  }
};
var NUMERIC_VT_TAGS = /* @__PURE__ */ new Set([
  "vt:i1",
  "vt:i2",
  "vt:i4",
  "vt:i8",
  "vt:ui1",
  "vt:ui2",
  "vt:ui4",
  "vt:ui8",
  "vt:int",
  "vt:uint",
  "vt:r4",
  "vt:r8",
  "vt:decimal"
]);
var VT_TAGS = /* @__PURE__ */ new Set([
  ...NUMERIC_VT_TAGS,
  "vt:lpwstr",
  "vt:lpstr",
  "vt:bstr",
  "vt:bool",
  "vt:date",
  "vt:filetime"
]);
function defaultVariantTag(value) {
  if (typeof value === "string") return "vt:lpwstr";
  if (typeof value === "boolean") return "vt:bool";
  if (value instanceof Date) return "vt:filetime";
  return Number.isInteger(value) ? "vt:i4" : "vt:r8";
}
function stringifyVariantValue(value, sourceTag) {
  const tag = sourceTag !== void 0 && VT_TAGS.has(sourceTag) ? sourceTag : defaultVariantTag(value);
  let inner;
  if (tag === "vt:bool") inner = value ? "true" : "false";
  else if (tag === "vt:date" || tag === "vt:filetime") inner = value instanceof Date ? value.toISOString() : String(value);
  else if (typeof value === "string") inner = escapeXml(value);
  else inner = String(value);
  return `<${tag}>${inner}</${tag}>`;
}
function parseVariantValue(el) {
  const text = textOf(el);
  switch (el.name) {
    case "vt:lpwstr":
    case "vt:lpstr":
    case "vt:bstr":
      return text;
    case "vt:bool":
      return parseOnOff(text) ?? false;
    case "vt:date":
    case "vt:filetime":
      return text ? new Date(text) : void 0;
    default:
      if (NUMERIC_VT_TAGS.has(el.name ?? "")) return text === "" ? void 0 : Number(text);
      return text || void 0;
  }
}
function stringifyStringVector(values) {
  const items = values.map((v) => `<vt:lpstr>${escapeXml(v)}</vt:lpstr>`).join("");
  return `<vt:vector size="${values.length}" baseType="lpstr">${items}</vt:vector>`;
}
function stringifyVariantVector(values) {
  const items = values.map((v) => `<vt:variant>${stringifyVariantValue(v)}</vt:variant>`).join("");
  return `<vt:vector size="${values.length}" baseType="variant">${items}</vt:vector>`;
}
function parseVector(el) {
  if (!el || el.name !== "vt:vector") return [];
  const out = [];
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    const scalar = child.name === "vt:variant" ? child.elements?.find((e) => e.name?.startsWith("vt:")) : child;
    if (!scalar) continue;
    const value = parseVariantValue(scalar);
    if (value !== void 0) out.push(value);
  }
  return out;
}
var xsdBoolean = (value) => value ? "true" : "false";
var appPropertiesDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const t = (name) => opts.apPrefix ? `ap:${name}` : name;
    const p = opts.apPrefix ? ['<ap:Properties xmlns:ap="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'] : ['<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'];
    if (opts.template !== void 0) p.push(`<${t("Template")}>${escapeXml(opts.template)}</${t("Template")}>`);
    if (opts.manager !== void 0) p.push(`<${t("Manager")}>${escapeXml(opts.manager)}</${t("Manager")}>`);
    if (opts.company !== void 0) p.push(`<${t("Company")}>${escapeXml(opts.company)}</${t("Company")}>`);
    if (opts.pages !== void 0) p.push(`<${t("Pages")}>${opts.pages}</${t("Pages")}>`);
    if (opts.words !== void 0) p.push(`<${t("Words")}>${opts.words}</${t("Words")}>`);
    if (opts.characters !== void 0) p.push(`<${t("Characters")}>${opts.characters}</${t("Characters")}>`);
    if (opts.presentationFormat !== void 0) p.push(`<${t("PresentationFormat")}>${escapeXml(opts.presentationFormat)}</${t("PresentationFormat")}>`);
    if (opts.lines !== void 0) p.push(`<${t("Lines")}>${opts.lines}</${t("Lines")}>`);
    if (opts.paragraphs !== void 0) p.push(`<${t("Paragraphs")}>${opts.paragraphs}</${t("Paragraphs")}>`);
    if (opts.slides !== void 0) p.push(`<${t("Slides")}>${opts.slides}</${t("Slides")}>`);
    if (opts.notes !== void 0) p.push(`<${t("Notes")}>${opts.notes}</${t("Notes")}>`);
    if (opts.totalTime !== void 0) p.push(`<${t("TotalTime")}>${opts.totalTime}</${t("TotalTime")}>`);
    if (opts.hiddenSlides !== void 0) p.push(`<${t("HiddenSlides")}>${opts.hiddenSlides}</${t("HiddenSlides")}>`);
    if (opts.mmClips !== void 0) p.push(`<${t("MMClips")}>${opts.mmClips}</${t("MMClips")}>`);
    if (opts.scaleCrop !== void 0) p.push(`<${t("ScaleCrop")}>${xsdBoolean(opts.scaleCrop)}</${t("ScaleCrop")}>`);
    if (opts.headingPairs !== void 0 && opts.headingPairs.length > 0) {
      const items = opts.headingPairs.map((pair) => `<vt:variant><vt:lpstr>${escapeXml(pair.name)}</vt:lpstr></vt:variant><vt:variant><vt:i4>${pair.count}</vt:i4></vt:variant>`).join("");
      p.push(`<${t("HeadingPairs")}><vt:vector size="${opts.headingPairs.length * 2}" baseType="variant">${items}</vt:vector></${t("HeadingPairs")}>`);
    }
    if (opts.titlesOfParts !== void 0 && opts.titlesOfParts.length > 0) p.push(`<${t("TitlesOfParts")}>${stringifyStringVector(opts.titlesOfParts)}</${t("TitlesOfParts")}>`);
    if (opts.linksUpToDate !== void 0) p.push(`<${t("LinksUpToDate")}>${xsdBoolean(opts.linksUpToDate)}</${t("LinksUpToDate")}>`);
    if (opts.charactersWithSpaces !== void 0) p.push(`<${t("CharactersWithSpaces")}>${opts.charactersWithSpaces}</${t("CharactersWithSpaces")}>`);
    if (opts.sharedDoc !== void 0) p.push(`<${t("SharedDoc")}>${xsdBoolean(opts.sharedDoc)}</${t("SharedDoc")}>`);
    if (opts.hyperlinkBase !== void 0) p.push(`<${t("HyperlinkBase")}>${escapeXml(opts.hyperlinkBase)}</${t("HyperlinkBase")}>`);
    if (opts.hlinks !== void 0 && opts.hlinks.length > 0) p.push(`<${t("HLinks")}>${stringifyVariantVector(opts.hlinks)}</${t("HLinks")}>`);
    if (opts.hyperlinksChanged !== void 0) p.push(`<${t("HyperlinksChanged")}>${xsdBoolean(opts.hyperlinksChanged)}</${t("HyperlinksChanged")}>`);
    if (opts.application !== void 0) p.push(`<${t("Application")}>${escapeXml(opts.application)}</${t("Application")}>`);
    if (opts.appVersion !== void 0) p.push(`<${t("AppVersion")}>${escapeXml(opts.appVersion)}</${t("AppVersion")}>`);
    if (opts.docSecurity !== void 0) p.push(`<${t("DocSecurity")}>${opts.docSecurity}</${t("DocSecurity")}>`);
    p.push(opts.apPrefix ? "</ap:Properties>" : "</Properties>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    if (el.name === "ap:Properties") result.apPrefix = true;
    for (const child of el.elements ?? []) {
      if (typeof child.name !== "string") continue;
      const text = child.elements?.[0]?.text;
      const str = String(text ?? "");
      switch (child.name.includes(":") ? child.name.slice(child.name.indexOf(":") + 1) : child.name) {
        case "Template":
          result.template = str;
          break;
        case "Manager":
          result.manager = str;
          break;
        case "Company":
          result.company = str;
          break;
        case "Pages":
          if (typeof text === "string") result.pages = Number(text);
          break;
        case "Words":
          if (typeof text === "string") result.words = Number(text);
          break;
        case "Characters":
          if (typeof text === "string") result.characters = Number(text);
          break;
        case "PresentationFormat":
          result.presentationFormat = str;
          break;
        case "Lines":
          if (typeof text === "string") result.lines = Number(text);
          break;
        case "Paragraphs":
          if (typeof text === "string") result.paragraphs = Number(text);
          break;
        case "Slides":
          if (typeof text === "string") result.slides = Number(text);
          break;
        case "Notes":
          if (typeof text === "string") result.notes = Number(text);
          break;
        case "TotalTime":
          if (typeof text === "string") result.totalTime = Number(text);
          break;
        case "HiddenSlides":
          if (typeof text === "string") result.hiddenSlides = Number(text);
          break;
        case "MMClips":
          if (typeof text === "string") result.mmClips = Number(text);
          break;
        case "HeadingPairs": {
          const vector = child.elements?.find((e) => e.name === "vt:vector");
          const flat = parseVector(vector);
          const pairs = [];
          for (let i = 0; i + 1 < flat.length; i += 2) {
            const name = flat[i];
            const count = flat[i + 1];
            if (typeof name === "string" && typeof count === "number") pairs.push({
              name,
              count
            });
          }
          if (pairs.length > 0) result.headingPairs = pairs;
          break;
        }
        case "TitlesOfParts": {
          const vector = child.elements?.find((e) => e.name === "vt:vector");
          const titles = parseVector(vector).filter((v) => typeof v === "string");
          if (titles.length > 0) result.titlesOfParts = titles;
          break;
        }
        case "ScaleCrop":
          if (typeof text === "string") result.scaleCrop = parseOnOff(text) ?? false;
          break;
        case "LinksUpToDate":
          if (typeof text === "string") result.linksUpToDate = parseOnOff(text) ?? false;
          break;
        case "CharactersWithSpaces":
          if (typeof text === "string") result.charactersWithSpaces = Number(text);
          break;
        case "SharedDoc":
          if (typeof text === "string") result.sharedDoc = parseOnOff(text) ?? false;
          break;
        case "HyperlinkBase":
          result.hyperlinkBase = str;
          break;
        case "HLinks": {
          const vector = child.elements?.find((e) => e.name === "vt:vector");
          const values = parseVector(vector);
          if (values.length > 0) result.hlinks = values;
          break;
        }
        case "HyperlinksChanged":
          if (typeof text === "string") result.hyperlinksChanged = parseOnOff(text) ?? false;
          break;
        case "Application":
          result.application = str;
          break;
        case "AppVersion":
          result.appVersion = str;
          break;
        case "DocSecurity":
          if (typeof text === "string") result.docSecurity = Number(text);
      }
    }
    return result;
  }
};
var customPropertiesDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'];
    let pid = 2;
    for (const prop of opts.properties) {
      p.push(`<property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="${pid}" name="${escapeXml(prop.name)}">` + stringifyVariantValue(prop.value, prop.valueType) + `</property>`);
      pid++;
    }
    p.push("</Properties>");
    return p.join("");
  },
  parse(el, _ctx) {
    const properties = [];
    for (const child of el.elements ?? []) {
      if (child.name !== "property") continue;
      const name = attr(child, "name");
      if (!name) continue;
      const valueEl = child.elements?.find((e) => e.name?.startsWith("vt:"));
      if (valueEl) {
        const value = parseVariantValue(valueEl);
        if (value !== void 0) {
          const prop = {
            name,
            value
          };
          if (valueEl.name && valueEl.name !== defaultVariantTag(value)) prop.valueType = valueEl.name;
          properties.push(prop);
        }
      }
    }
    return { properties };
  }
};
var CFB_SIGNATURE = [
  208,
  207,
  17,
  224,
  161,
  177,
  26,
  225
];
function isEncryptedContainer(data) {
  return data.length >= CFB_SIGNATURE.length && CFB_SIGNATURE.every((b, i) => data[i] === b);
}
function encryptedContainerOutput(file, type, mimeType) {
  const { encrypted } = file;
  if (!encrypted) return void 0;
  return convertOutput(toUint8Array(encrypted.data), type, mimeType);
}
function assertEncryptedExclusive(file, hasContent) {
  if (file.encrypted && hasContent) throw new Error("Encrypted passthrough carries no editable content \u2014 clear the content fields or drop `encrypted`.");
}
var SCHEMAS_OPENXML = "http://schemas.openxmlformats.org";
var SCHEMAS_MS = "http://schemas.microsoft.com";
var OOXML_OBSOLETE_NAMESPACE_ALIASES = {
  [`${SCHEMAS_OPENXML}/wordprocessingml/2006/3/main`]: `${SCHEMAS_OPENXML}/wordprocessingml/2006/main`,
  [`${SCHEMAS_OPENXML}/wordprocessingml/2006/5/main`]: `${SCHEMAS_OPENXML}/wordprocessingml/2006/main`,
  [`${SCHEMAS_OPENXML}/wordprocessingml/2006/6/main`]: `${SCHEMAS_OPENXML}/wordprocessingml/2006/main`,
  [`${SCHEMAS_OPENXML}/spreadsheetml/2006/5/main`]: `${SCHEMAS_OPENXML}/spreadsheetml/2006/main`,
  [`${SCHEMAS_OPENXML}/spreadsheetml/2006/7/main`]: `${SCHEMAS_OPENXML}/spreadsheetml/2006/main`,
  [`${SCHEMAS_OPENXML}/presentationml/2006/3/main`]: `${SCHEMAS_OPENXML}/presentationml/2006/main`,
  [`${SCHEMAS_OPENXML}/drawingml/2006/3/main`]: `${SCHEMAS_OPENXML}/drawingml/2006/main`,
  [`${SCHEMAS_MS}/office/word/2010/11/wordml`]: `${SCHEMAS_MS}/office/word/2012/wordml`
};
function normalizeObsoleteNamespaceAliases(data) {
  let result = data;
  for (const pattern of OBSOLETE_PATTERNS) result = replaceAsciiBytes(result, pattern);
  return result;
}
function isNamespaceDeclarationValue(data, valueOffset, valueLength) {
  const quote = data[valueOffset - 1];
  if (quote !== 34 && quote !== 39 || data[valueOffset + valueLength] !== quote) return false;
  let i = valueOffset - 2;
  while (i >= 0 && (data[i] === 32 || data[i] === 9 || data[i] === 10 || data[i] === 13)) i--;
  if (data[i] !== 61) return false;
  i--;
  while (i >= 0 && (data[i] === 32 || data[i] === 9 || data[i] === 10 || data[i] === 13)) i--;
  const nameEnd = i + 1;
  while (i >= 0 && (data[i] >= 65 && data[i] <= 90 || data[i] >= 97 && data[i] <= 122 || data[i] >= 48 && data[i] <= 57 || data[i] === 58 || data[i] === 45 || data[i] === 95)) i--;
  const nameStart = i + 1;
  const nameLen = nameEnd - nameStart;
  if (nameLen < 5) return false;
  for (let k = 0; k < 5; k++) if (data[nameStart + k] !== XMLNS_BYTES[k]) return false;
  return nameLen === 5 || data[nameStart + 5] === 58;
}
var XMLNS_BYTES = Uint8Array.from([
  120,
  109,
  108,
  110,
  115
]);
function replaceAsciiBytes(data, pattern) {
  const { needle, value } = pattern;
  const positions = [];
  const first = needle[0];
  const lastStart = data.length - needle.length;
  let i = data.indexOf(first);
  while (i !== -1) {
    if (i <= lastStart) {
      let matches = true;
      for (let j = 1; j < needle.length; j++) if (data[i + j] !== needle[j]) {
        matches = false;
        break;
      }
      if (matches && isNamespaceDeclarationValue(data, i, needle.length)) {
        positions.push(i);
        i += needle.length - 1;
      }
    }
    i = data.indexOf(first, i + 1);
  }
  if (positions.length === 0) return data;
  const out = new Uint8Array(data.length + positions.length * (value.length - needle.length));
  let sourceOffset = 0;
  let targetOffset = 0;
  for (const position of positions) {
    const prefix = data.subarray(sourceOffset, position);
    out.set(prefix, targetOffset);
    targetOffset += prefix.length;
    out.set(value, targetOffset);
    targetOffset += value.length;
    sourceOffset = position + needle.length;
  }
  out.set(data.subarray(sourceOffset), targetOffset);
  return out;
}
var OBSOLETE_PATTERNS = Object.entries(OOXML_OBSOLETE_NAMESPACE_ALIASES).map(([obsolete, finalUri]) => ({
  needle: new TextEncoder().encode(obsolete),
  value: new TextEncoder().encode(finalUri)
}));
var OOXML_CANONICAL_PREFIXES = {
  ...Object.fromEntries(Object.entries(OOXML_OBSOLETE_NAMESPACE_ALIASES).map(([oldUri, finalUri]) => [oldUri, finalUri === `${SCHEMAS_OPENXML}/spreadsheetml/2006/main` ? "" : finalUri === `${SCHEMAS_OPENXML}/presentationml/2006/main` ? "p" : finalUri === `${SCHEMAS_OPENXML}/drawingml/2006/main` ? "a" : finalUri === `${SCHEMAS_OPENXML}/wordprocessingml/2006/main` ? "w" : "w15"])),
  [`${SCHEMAS_OPENXML}/wordprocessingml/2006/main`]: "w",
  [`${SCHEMAS_OPENXML}/presentationml/2006/main`]: "p",
  [`${SCHEMAS_OPENXML}/spreadsheetml/2006/main`]: "",
  [`${SCHEMAS_OPENXML}/drawingml/2006/main`]: "a",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/relationships`]: "r",
  [`${SCHEMAS_OPENXML}/markup-compatibility/2006`]: "mc",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/math`]: "m",
  [`${SCHEMAS_OPENXML}/drawingml/2006/wordprocessingDrawing`]: "wp",
  [`${SCHEMAS_OPENXML}/drawingml/2006/spreadsheetDrawing`]: "xdr",
  [`${SCHEMAS_OPENXML}/drawingml/2006/chart`]: "c",
  [`${SCHEMAS_OPENXML}/drawingml/2006/chartDrawing`]: "cdr",
  [`${SCHEMAS_OPENXML}/drawingml/2006/diagram`]: "dgm",
  [`${SCHEMAS_OPENXML}/drawingml/2006/lockedCanvas`]: "lc",
  [`${SCHEMAS_OPENXML}/drawingml/2006/picture`]: "pic",
  [`${SCHEMAS_OPENXML}/package/2006/relationships`]: "",
  [`${SCHEMAS_OPENXML}/package/2006/content-types`]: "",
  [`${SCHEMAS_OPENXML}/package/2006/metadata/core-properties`]: "",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/extended-properties`]: "",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/custom-properties`]: "",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/docPropsVTypes`]: "vt",
  [`${SCHEMAS_OPENXML}/officeDocument/2006/bibliography`]: "b",
  "urn:schemas-microsoft-com:vml": "v",
  "urn:schemas-microsoft-com:office:office": "o",
  "urn:schemas-microsoft-com:office:word": "w10",
  "urn:schemas-microsoft-com:office:excel": "x",
  "urn:schemas-microsoft-com:office:powerpoint": "pvml",
  [`${SCHEMAS_MS}/office/word/2006/wordml`]: "wne",
  [`${SCHEMAS_MS}/office/word/2010/wordml`]: "w14",
  [`${SCHEMAS_MS}/office/word/2010/11/wordml`]: "w15",
  [`${SCHEMAS_MS}/office/word/2012/wordml`]: "w15",
  [`${SCHEMAS_MS}/office/word/2016/wordml/cid`]: "w16cid",
  [`${SCHEMAS_MS}/office/word/2018/wordml`]: "w16",
  [`${SCHEMAS_MS}/office/word/2018/wordml/cex`]: "w16cex",
  [`${SCHEMAS_MS}/office/word/2020/wordml/sdtdatahash`]: "w16sdtdh",
  [`${SCHEMAS_MS}/office/word/2015/wordml/symex`]: "w16se",
  [`${SCHEMAS_MS}/office/word/2010/wordprocessingDrawing`]: "wp14",
  [`${SCHEMAS_MS}/office/word/2010/wordprocessingCanvas`]: "wpc",
  [`${SCHEMAS_MS}/office/word/2010/wordprocessingGroup`]: "wpg",
  [`${SCHEMAS_MS}/office/word/2010/wordprocessingInk`]: "wpi",
  [`${SCHEMAS_MS}/office/word/2010/wordprocessingShape`]: "wps",
  [`${SCHEMAS_MS}/office/drawing/2010/main`]: "a14",
  [`${SCHEMAS_MS}/office/drawing/2014/main`]: "a16",
  [`${SCHEMAS_MS}/office/drawing/2016/ink`]: "aink",
  [`${SCHEMAS_MS}/office/drawing/2017/model3d`]: "am3d",
  [`${SCHEMAS_MS}/office/drawing/2016/SVG/main`]: "asvg",
  [`${SCHEMAS_MS}/office/drawing/2007/8/2/chart`]: "c14",
  [`${SCHEMAS_MS}/office/drawing/2008/diagram`]: "dsp",
  [`${SCHEMAS_MS}/office/drawing/2014/chartex`]: "cx",
  [`${SCHEMAS_MS}/office/drawing/2015/9/8/chartex`]: "cx1",
  [`${SCHEMAS_MS}/office/drawing/2015/10/21/chartex`]: "cx2",
  [`${SCHEMAS_MS}/office/drawing/2016/5/9/chartex`]: "cx3",
  [`${SCHEMAS_MS}/office/drawing/2016/5/10/chartex`]: "cx4",
  [`${SCHEMAS_MS}/office/drawing/2016/5/11/chartex`]: "cx5",
  [`${SCHEMAS_MS}/office/drawing/2016/5/12/chartex`]: "cx6",
  [`${SCHEMAS_MS}/office/drawing/2016/5/13/chartex`]: "cx7",
  [`${SCHEMAS_MS}/office/drawing/2016/5/14/chartex`]: "cx8",
  [`${SCHEMAS_MS}/office/2019/extlst`]: "oel",
  [`${SCHEMAS_MS}/office/powerpoint/2010/main`]: "p14",
  [`${SCHEMAS_MS}/office/powerpoint/2015/main`]: "p15",
  [`${SCHEMAS_MS}/office/spreadsheetml/2009/9/main`]: "x14",
  [`${SCHEMAS_MS}/office/spreadsheetml/2009/9/ac`]: "x14ac",
  [`${SCHEMAS_MS}/office/spreadsheetml/2010/11/main`]: "x15",
  [`${SCHEMAS_MS}/office/spreadsheetml/2010/11/ac`]: "x15ac",
  [`${SCHEMAS_MS}/office/spreadsheetml/2014/revision`]: "xr",
  [`${SCHEMAS_MS}/office/spreadsheetml/2015/revision2`]: "xr2",
  [`${SCHEMAS_MS}/office/spreadsheetml/2016/revision3`]: "xr3",
  [`${SCHEMAS_MS}/office/spreadsheetml/2016/revision6`]: "xr6",
  [`${SCHEMAS_MS}/office/spreadsheetml/2016/revision10`]: "xr10"
};
var XML_PARSE_OPTIONS = {
  nativeTypeAttributes: true,
  captureSpacesBetweenElements: true,
  normalizeNamespaces: OOXML_CANONICAL_PREFIXES
};
var ParsedArchive = class {
  zip;
  modified = /* @__PURE__ */ new Map();
  wrapperCache = /* @__PURE__ */ new Map();
  constructor(data) {
    let unzipped;
    try {
      unzipped = hasNativeInflate() ? nativeUnzip(data) : unzipSync(data);
    } catch {
      unzipped = unzipSync(data);
    }
    this.zip = new Map(Object.entries(unzipped));
  }
  /**
  * Read an XML part as an Element tree. `parseOptions` extends the default
  * XML parse options for this part (e.g. `deferElements` to capture a hot
  * container's inner XML verbatim). Callers must use consistent options per
  * path — the wrapper cache is keyed by path only.
  */
  get(path, parseOptions) {
    const opts = parseOptions ? {
      ...XML_PARSE_OPTIONS,
      ...parseOptions
    } : XML_PARSE_OPTIONS;
    const modData = this.modified.get(path);
    if (modData) {
      const wrapper2 = parse(strFromU8(modData), opts);
      this.wrapperCache.set(path, wrapper2);
      return wrapper2.elements?.find((e) => e.type === "element");
    }
    const data = this.zip.get(path);
    if (data === void 0) return void 0;
    const cached = this.wrapperCache.get(path);
    if (cached) return cached.elements?.find((e) => e.type === "element");
    const wrapper = parse(strFromU8(data), opts);
    this.wrapperCache.set(path, wrapper);
    return wrapper.elements?.find((e) => e.type === "element");
  }
  /** Write an XML part (Element → XML string). */
  set(path, element2) {
    const wrapper = this.wrapperCache.get(path);
    const doc = wrapper ? {
      ...wrapper,
      elements: [{
        ...element2,
        type: "element"
      }]
    } : { elements: [{
      ...element2,
      type: "element"
    }] };
    const xml = stringify(doc);
    this.modified.set(path, strToU8(xml));
  }
  /** Read raw binary data (images, media, etc.). */
  getRaw(path) {
    return this.modified.get(path) ?? this.zip.get(path);
  }
  /** Write raw binary data. */
  setRaw(path, data) {
    this.modified.set(path, data);
    this.wrapperCache.delete(path);
  }
  /** Remove a part. Returns true if it existed. */
  remove(path) {
    this.wrapperCache.delete(path);
    return this.modified.delete(path) || this.zip.delete(path);
  }
  /** Check if a part exists. */
  has(path) {
    return this.modified.has(path) || this.zip.has(path);
  }
  /** List all paths matching an optional prefix. */
  keys(prefix) {
    const all = /* @__PURE__ */ new Set();
    for (const key of this.zip.keys()) if (!prefix || key.startsWith(prefix)) all.add(key);
    for (const key of this.modified.keys()) if (!prefix || key.startsWith(prefix)) all.add(key);
    return [...all];
  }
  /** Serialize back to a ZIP buffer, merging original zip + modifications. */
  save() {
    const files = {};
    for (const [path, data] of this.zip) if (!this.modified.has(path)) files[path] = [data, { level: levelForMediaName(path, 6) }];
    for (const [path, data] of this.modified) files[path] = [data, { level: levelForMediaName(path, 6) }];
    return zipSync(files);
  }
};
function parseArchive(data) {
  return new ParsedArchive(data);
}
var XLSX_PARTS = {
  format: "xlsx",
  orphanWhitelist: [
    "xl/media/",
    "xl/embeddings/",
    "_rels/",
    "xl/_rels/",
    "xl/worksheets/_rels/",
    "xl/chartsheets/_rels/",
    "xl/drawings/_rels/",
    "xl/pivotTables/_rels/",
    "xl/pivotCache/_rels/",
    "xl/externalLinks/_rels/",
    "docProps/",
    "[Content_Types].xml"
  ],
  parts: [
    {
      path: "[Content_Types].xml",
      presence: { kind: "always" }
    },
    {
      path: "_rels/.rels",
      presence: { kind: "always" }
    },
    {
      path: "xl/workbook.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
      presence: { kind: "always" }
    },
    {
      path: "docProps/core.xml",
      contentType: "application/vnd.openxmlformats-package.core-properties+xml",
      presence: {
        kind: "conditional",
        flag: "freshCompile"
      }
    },
    {
      path: "docProps/app.xml",
      contentType: "application/vnd.openxmlformats-officedocument.extended-properties+xml",
      presence: {
        kind: "conditional",
        flag: "freshCompile"
      }
    },
    {
      path: "docProps/custom.xml",
      contentType: "application/vnd.openxmlformats-officedocument.custom-properties+xml",
      presence: {
        kind: "conditional",
        flag: "has custom properties"
      }
    },
    {
      path: "xl/styles.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml",
      presence: {
        kind: "conditional",
        flag: "freshCompile"
      }
    },
    {
      path: "xl/theme/theme1.xml",
      contentType: "application/vnd.openxmlformats-officedocument.theme+xml",
      presence: {
        kind: "conditional",
        flag: "freshCompile"
      }
    },
    {
      path: "xl/sharedStrings.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml",
      presence: {
        kind: "conditional",
        flag: "sharedStrings.count > 0"
      }
    },
    {
      path: "xl/worksheets/sheet${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml",
      presence: {
        kind: "repeated",
        countFrom: "worksheets.length"
      }
    },
    {
      path: "xl/chartsheets/sheet${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml",
      presence: {
        kind: "repeated",
        countFrom: "chartsheets.length"
      }
    },
    {
      path: "xl/dialogSheets/sheet${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml",
      presence: {
        kind: "repeated",
        countFrom: "dialogsheets.length"
      }
    },
    {
      path: "xl/drawings/drawing${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.drawing+xml",
      presence: {
        kind: "conditional",
        flag: "worksheet has drawing"
      }
    },
    {
      path: "xl/comments${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml",
      presence: {
        kind: "conditional",
        flag: "worksheet.comments.length > 0"
      }
    },
    {
      path: "xl/drawings/vmlDrawing${i}.vml",
      presence: {
        kind: "conditional",
        flag: "worksheet.comments (legacy VML)"
      }
    },
    {
      path: "xl/charts/chart${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
      presence: {
        kind: "repeated",
        countFrom: "charts"
      }
    },
    {
      path: "xl/pivotTables/pivotTable${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml",
      presence: {
        kind: "repeated",
        countFrom: "pivotTables"
      }
    },
    {
      path: "xl/pivotCache/pivotCacheDefinition${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml",
      presence: {
        kind: "repeated",
        countFrom: "pivotCaches"
      }
    },
    {
      path: "xl/pivotCache/pivotCacheRecords${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml",
      presence: {
        kind: "repeated",
        countFrom: "pivotCaches"
      }
    },
    {
      path: "xl/tables/table${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml",
      presence: {
        kind: "repeated",
        countFrom: "tables"
      }
    },
    {
      path: "xl/externalLinks/externalLink${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.externalLink+xml",
      presence: {
        kind: "repeated",
        countFrom: "externalLinks.length"
      }
    },
    {
      path: "xl/connections.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml",
      presence: {
        kind: "conditional",
        flag: "connections"
      }
    },
    {
      path: "xl/queryTables/queryTable${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.queryTable+xml",
      presence: {
        kind: "repeated",
        countFrom: "queryTables"
      }
    },
    {
      path: "xl/metadata.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetMetadata+xml",
      presence: {
        kind: "conditional",
        flag: "metadata"
      }
    },
    {
      path: "xl/xmlMaps.xml",
      contentType: "application/xml",
      presence: {
        kind: "conditional",
        flag: "xmlMaps"
      }
    },
    {
      path: "xl/volTypes.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.volTypes+xml",
      presence: {
        kind: "conditional",
        flag: "volTypes"
      }
    },
    {
      path: "xl/tables/tableSingleCells${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.tableSingleCells+xml",
      presence: {
        kind: "repeated",
        countFrom: "singleXmlCells"
      }
    },
    {
      path: "xl/calcChain.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml",
      presence: {
        kind: "conditional",
        flag: "any formula cell"
      }
    },
    {
      path: "xl/revisionHeaders.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionHeaders+xml",
      presence: {
        kind: "conditional",
        flag: "revisionLog"
      }
    },
    {
      path: "xl/revisions/revision${i}.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionLog+xml",
      presence: {
        kind: "repeated",
        countFrom: "revisionLog.logs.length"
      }
    },
    {
      path: "xl/users.xml",
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.userNames+xml",
      presence: {
        kind: "conditional",
        flag: "revisionLog.users"
      }
    }
  ]
};
var contentTypesDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'];
    const seenDefault = /* @__PURE__ */ new Set();
    for (const d of opts.defaults) {
      const key = d.extension.toLowerCase();
      if (seenDefault.has(key)) continue;
      seenDefault.add(key);
      p.push(`<Default Extension="${d.extension}" ContentType="${d.contentType}"/>`);
    }
    const seenOverride = /* @__PURE__ */ new Set();
    for (const o of opts.overrides) {
      const key = o.partName.toLowerCase();
      if (seenOverride.has(key)) continue;
      seenOverride.add(key);
      p.push(`<Override PartName="${o.partName}" ContentType="${o.contentType}"/>`);
    }
    p.push("</Types>");
    return p.join("");
  },
  parse(el, _ctx) {
    const defaults = [];
    const overrides = [];
    for (const child of el.elements ?? []) if (child.name === "Default") {
      const ext = child.attributes?.["Extension"];
      const ct = child.attributes?.["ContentType"];
      if (ext && ct) defaults.push({
        extension: String(ext),
        contentType: String(ct)
      });
    } else if (child.name === "Override") {
      const pn = child.attributes?.["PartName"];
      const ct = child.attributes?.["ContentType"];
      if (pn && ct) overrides.push({
        partName: String(pn),
        contentType: String(ct)
      });
    }
    return {
      defaults,
      overrides
    };
  }
};
function patternToRegExp(path) {
  const escaped = path.split("${i}").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp("^" + escaped.join("\\d+") + "$");
}
function resolverFromRegistry(registry) {
  const patterns = [];
  for (const part of registry.parts) {
    if (!part.contentType) continue;
    patterns.push({
      re: patternToRegExp(part.path),
      contentType: part.contentType
    });
  }
  return (partPath) => patterns.find((p) => p.re.test(partPath))?.contentType;
}
var BASE_DEFAULTS = [{
  extension: "rels",
  contentType: "application/vnd.openxmlformats-package.relationships+xml"
}, {
  extension: "xml",
  contentType: "application/xml"
}];
function extensionOf$1(path) {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const dot = path.slice(slash + 1).lastIndexOf(".");
  return dot > 0 ? path.slice(slash + 1 + dot + 1) : void 0;
}
function withLeadingSlash(path) {
  return path.startsWith("/") ? path : `/${path}`;
}
function deriveContentTypes(filePaths, options) {
  const files = [...filePaths].filter((p) => p !== "[Content_Types].xml");
  const defaults = [...options.baseDefaults ?? BASE_DEFAULTS];
  const seenExt = new Set(defaults.map((d) => d.extension.toLowerCase()));
  const overrideMap = /* @__PURE__ */ new Map();
  const partTypes = [];
  for (const path of files) {
    const partType = options.resolve(path);
    if (partType) {
      const partName = withLeadingSlash(path);
      overrideMap.set(partName.toLowerCase(), {
        partName,
        contentType: partType
      });
      partTypes.push({
        partName,
        contentType: partType
      });
      continue;
    }
    const ext = extensionOf$1(path);
    if (!ext) continue;
    const key = ext.toLowerCase();
    const mime = options.mediaContentTypes[key];
    if (!seenExt.has(key) && mime) {
      defaults.push({
        extension: ext,
        contentType: mime
      });
      seenExt.add(key);
    }
    if (mime) partTypes.push({
      partName: withLeadingSlash(path),
      contentType: mime
    });
  }
  for (const extra of options.overrides ?? []) {
    const partName = withLeadingSlash(extra.path);
    overrideMap.set(partName.toLowerCase(), {
      partName,
      contentType: extra.contentType
    });
  }
  if (!options.source) return {
    defaults,
    overrides: [...overrideMap.values()]
  };
  return mergeSourceContentTypes(options.source, files, defaults, overrideMap, partTypes, { verbatim: options.verbatimPaths });
}
function mergeSourceContentTypes(source, files, derivedDefaults, derivedOverrides, partTypes, mergeOpts) {
  const filePaths = new Set(files.map((p) => withLeadingSlash(p).toLowerCase()));
  const verbatimLower = new Set([...mergeOpts.verbatim ?? []].map((p) => p.toLowerCase()));
  const isVerbatim = (partName) => verbatimLower.has(partName.slice(1).toLowerCase());
  const partExt = (partName) => {
    const dot = partName.lastIndexOf(".");
    return dot > partName.lastIndexOf("/") ? partName.slice(dot + 1) : "";
  };
  const defaultTypeByExt = /* @__PURE__ */ new Map();
  const derivedDefaultByExt = /* @__PURE__ */ new Map();
  for (const d of source.defaults) {
    const key = d.extension.toLowerCase();
    if (!defaultTypeByExt.has(key)) defaultTypeByExt.set(key, d.contentType);
  }
  for (const d of derivedDefaults) {
    const key = d.extension.toLowerCase();
    if (defaultTypeByExt.has(key)) continue;
    defaultTypeByExt.set(key, d.contentType);
    derivedDefaultByExt.set(key, d);
  }
  const overrides = [];
  const seenOverride = /* @__PURE__ */ new Set();
  const keptSourceTypeByPath = /* @__PURE__ */ new Map();
  for (const o of source.overrides) {
    const key = o.partName.toLowerCase();
    if (!filePaths.has(key)) continue;
    if (seenOverride.has(key)) continue;
    seenOverride.add(key);
    overrides.push(o);
    keptSourceTypeByPath.set(key, o.contentType);
  }
  for (const o of derivedOverrides.values()) {
    const key = o.partName.toLowerCase();
    if (isVerbatim(key)) continue;
    if (keptSourceTypeByPath.has(key)) continue;
    const ext = partExt(key);
    if ((ext ? defaultTypeByExt.get(ext) : void 0) === o.contentType) continue;
    seenOverride.add(key);
    overrides.push(o);
  }
  for (const { partName, contentType } of partTypes) {
    const key = partName.toLowerCase();
    if (derivedOverrides.has(key) || keptSourceTypeByPath.has(key)) continue;
    if (isVerbatim(key)) continue;
    const ext = partExt(key);
    const coveringDefault = ext ? defaultTypeByExt.get(ext) : void 0;
    if (coveringDefault === void 0 || coveringDefault === contentType) continue;
    if (seenOverride.has(key)) continue;
    seenOverride.add(key);
    overrides.push({
      partName,
      contentType
    });
  }
  const defaults = [];
  const seenDefault = /* @__PURE__ */ new Set();
  for (const d of source.defaults) {
    const key = d.extension.toLowerCase();
    if (seenDefault.has(key)) continue;
    seenDefault.add(key);
    defaults.push(d);
  }
  for (const [key, d] of derivedDefaultByExt) if (files.some((f) => extensionOf$1(f)?.toLowerCase() === key && !seenOverride.has(withLeadingSlash(f).toLowerCase()))) defaults.push(d);
  return {
    defaults,
    overrides
  };
}
var IMAGE_MEDIA_CONTENT_TYPES = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  bmp: "image/bmp",
  gif: "image/gif",
  tif: "image/tiff",
  tiff: "image/tiff",
  emf: "image/x-emf",
  wmf: "image/x-wmf",
  ico: "image/x-icon",
  svg: "image/svg+xml"
};
var ALWAYS_REBUILT = /* @__PURE__ */ new Set(["[Content_Types].xml", "_rels/.rels"]);
function extensionOf(path) {
  const slash = path.lastIndexOf("/");
  const dot = path.slice(slash + 1).lastIndexOf(".");
  return dot > 0 ? path.slice(slash + 1 + dot + 1) : void 0;
}
function collectPassthroughParts(archive, rebuiltPaths) {
  const rebuilt = new Set(ALWAYS_REBUILT);
  for (const p of rebuiltPaths) rebuilt.add(p);
  let defaults = [];
  let overrides = [];
  const ctEl = archive.get("[Content_Types].xml");
  if (ctEl) {
    const parsed = contentTypesDesc.parse(ctEl, void 0);
    defaults = parsed.defaults;
    overrides = parsed.overrides;
  }
  const overrideMap = new Map(overrides.map((o) => [o.partName.toLowerCase(), o.contentType]));
  const defaultMap = new Map(defaults.map((d) => [d.extension.toLowerCase(), d.contentType]));
  const contentTypeFor = (path) => {
    const override = overrideMap.get(`/${path}`.toLowerCase());
    if (override) return override;
    const ext = extensionOf(path);
    return ext ? defaultMap.get(ext.toLowerCase()) : void 0;
  };
  const parts = [];
  const kept = /* @__PURE__ */ new Set();
  for (const path of archive.keys()) {
    if (path.endsWith("/") || rebuilt.has(path)) continue;
    const sourceData = archive.getRaw(path);
    if (!sourceData) continue;
    const data = path.endsWith(".xml") || path.endsWith(".rels") ? normalizeObsoleteNamespaceAliases(sourceData) : sourceData;
    kept.add(path.toLowerCase());
    const contentType = contentTypeFor(path);
    parts.push(contentType === void 0 ? {
      path,
      data
    } : {
      path,
      data,
      contentType
    });
  }
  const relationships = [];
  const captureRels = (relsEl, source) => {
    if (!relsEl) return;
    for (const rel of relsEl.elements ?? []) {
      if (rel.name !== "Relationship") continue;
      const targetMode = attr(rel, "TargetMode");
      const relationshipType = attr(rel, "Type");
      const target = attr(rel, "Target");
      const rId = attr(rel, "Id");
      if (!relationshipType || !target || !rId) continue;
      if (targetMode === "External") {
        if (source === "") relationships.push({
          source,
          relationshipType,
          target,
          rId,
          targetMode
        });
        continue;
      }
      if (kept.has(resolveRelationshipTarget(source, target).toLowerCase()) || source !== "") relationships.push({
        source,
        relationshipType,
        target,
        rId
      });
    }
  };
  for (const source of rebuiltPaths) captureRels(archive.get(partPathToRelsPath(source)), source);
  captureRels(archive.get("_rels/.rels"), "");
  return {
    parts,
    relationships
  };
}
var RE_ESCAPE = /[.*+?^${}()|[\]\\]/g;
function dropDanglingPassthroughRels(files, passthroughRelationships) {
  if (!passthroughRelationships || passthroughRelationships.length === 0) return 0;
  const paths = new Set(Object.keys(files).map((p) => p.toLowerCase()));
  const decoder = new TextDecoder();
  const encoder3 = new TextEncoder();
  let dropped = 0;
  for (const rel of passthroughRelationships) {
    if (rel.targetMode === "External" || rel.target.startsWith("#")) continue;
    const relsPath = rel.source === "" ? "_rels/.rels" : partPathToRelsPath(rel.source);
    const entry = files[relsPath];
    const bytes = entry instanceof Uint8Array ? entry : Array.isArray(entry) && entry[0] instanceof Uint8Array ? entry[0] : void 0;
    if (!bytes) continue;
    const xml = decoder.decode(bytes);
    const escaped = escapeXml(rel.target).replace(RE_ESCAPE, "\\$&");
    if (!escaped) continue;
    const match = new RegExp(`(<Relationship\\b[^>]*\\bTarget="${escaped}"[^>]*/>)`).exec(xml);
    if (!match) continue;
    const resolved = resolveRelationshipTarget(rel.source, rel.target);
    if (paths.has(resolved.toLowerCase())) continue;
    const stripped = xml.slice(0, match.index) + xml.slice(match.index + match[1].length);
    const rewritten = encoder3.encode(stripped);
    files[relsPath] = Array.isArray(entry) ? [rewritten, entry[1]] : rewritten;
    dropped++;
  }
  return dropped;
}

// ../../../../../../Volumes/File/cortex/node_modules/@office-open/xlsx/dist/index.mjs
function parseFont(el) {
  const result = {};
  const boolProp = (prop) => parseOnOff(attr(prop, "val")) ?? true;
  for (const child of el.elements ?? []) switch (child.name) {
    case "b":
      result.bold = boolProp(child);
      break;
    case "i":
      result.italic = boolProp(child);
      break;
    case "u":
      result.underline = attr(child, "val") !== "none";
      break;
    case "strike":
      result.strike = boolProp(child);
      break;
    case "outline":
      result.outline = boolProp(child);
      break;
    case "shadow":
      result.shadow = boolProp(child);
      break;
    case "condense":
      result.condense = boolProp(child);
      break;
    case "extend":
      result.extend = boolProp(child);
      break;
    case "sz":
      result.size = attrNum(child, "val");
      break;
    case "color":
      result.color = parseColorHex(child);
      readThemeColor(child, result);
      const indexed = attrNum(child, "indexed");
      if (indexed !== void 0) result.colorIndexed = indexed;
      if (parseOnOff(attr(child, "auto"))) result.autoColor = true;
      break;
    case "name":
      result.font = attr(child, "val") ?? void 0;
      break;
    case "charset":
      result.charset = attrNum(child, "val");
      break;
    case "family":
      result.family = attrNum(child, "val");
      break;
    case "vertAlign":
      result.vertAlign = attr(child, "val") ?? void 0;
      break;
    case "scheme":
      result.scheme = attr(child, "val") ?? void 0;
  }
  return result;
}
function parseFill(el) {
  const patternFill = findChild(el, "patternFill");
  if (patternFill) {
    const result = {};
    const patternType = attr(patternFill, "patternType");
    if (patternType) result.patternType = patternType;
    const fg = findChild(patternFill, "fgColor");
    if (fg) {
      result.color = parseColorHex(fg);
      readThemeColor(fg, result);
      const indexed = attrNum(fg, "indexed");
      if (indexed !== void 0) result.colorIndexed = indexed;
      if (parseOnOff(attr(fg, "auto"))) result.fgAutoColor = true;
    }
    const bg = findChild(patternFill, "bgColor");
    if (bg) {
      result.bgColor = parseColorHex(bg);
      const bgTheme = attrNum(bg, "theme");
      if (bgTheme !== void 0) result.bgThemeColor = bgTheme;
      const bgTint = attrNum(bg, "tint");
      if (bgTint !== void 0) result.bgTint = bgTint;
      const bgIndexed = attrNum(bg, "indexed");
      if (bgIndexed !== void 0) result.bgColorIndexed = bgIndexed;
      if (parseOnOff(attr(bg, "auto"))) result.bgAutoColor = true;
    }
    return result;
  }
  const gradientFill = findChild(el, "gradientFill");
  if (gradientFill) {
    const result = { type: "gradient" };
    const gType = attr(gradientFill, "type");
    if (gType) result.gradientType = gType;
    const degree = attrNum(gradientFill, "degree");
    if (degree !== void 0) result.gradientDegree = degree;
    const left = attrNum(gradientFill, "left");
    if (left !== void 0) result.gradientLeft = left;
    const right = attrNum(gradientFill, "right");
    if (right !== void 0) result.gradientRight = right;
    const top = attrNum(gradientFill, "top");
    if (top !== void 0) result.gradientTop = top;
    const bottom = attrNum(gradientFill, "bottom");
    if (bottom !== void 0) result.gradientBottom = bottom;
    const stops = [];
    for (const s of gradientFill.elements ?? []) {
      if (s.name !== "stop") continue;
      const pos = attrNum(s, "position");
      const color = findChild(s, "color");
      if (pos !== void 0 && color) stops.push({
        position: pos,
        color: parseColorHex(color) ?? ""
      });
    }
    if (stops.length > 0) result.stops = stops;
    return result;
  }
  return {};
}
function parseBorder(el) {
  const result = {};
  if (parseOnOff(attr(el, "diagonalUp"))) result.diagonalUp = true;
  if (parseOnOff(attr(el, "diagonalDown"))) result.diagonalDown = true;
  for (const side of [
    "left",
    "right",
    "top",
    "bottom",
    "diagonal",
    "start",
    "end",
    "vertical",
    "horizontal"
  ]) {
    const sideEl = findChild(el, side);
    if (sideEl) {
      const opts = {};
      const style = attr(sideEl, "style");
      if (style) opts.style = style;
      const color = findChild(sideEl, "color");
      if (color) {
        opts.color = parseColorHex(color);
        readThemeColor(color, opts);
        if (parseOnOff(attr(color, "auto"))) opts.autoColor = true;
        const indexed = attrNum(color, "indexed");
        if (indexed !== void 0) opts.colorIndexed = indexed;
      }
      result[side] = opts;
    }
  }
  return result;
}
function parseAlignment(el) {
  const result = {};
  const h = attr(el, "horizontal");
  if (h) result.horizontal = h;
  const v = attr(el, "vertical");
  if (v) result.vertical = v;
  if (parseOnOff(attr(el, "wrapText"))) result.wrapText = true;
  const rotation = attrNum(el, "textRotation");
  if (rotation !== void 0) result.textRotation = rotation;
  const indent = attrNum(el, "indent");
  if (indent !== void 0) result.indent = indent;
  const relativeIndent = attrNum(el, "relativeIndent");
  if (relativeIndent !== void 0) result.relativeIndent = relativeIndent;
  if (parseOnOff(attr(el, "justifyLastLine"))) result.justifyLastLine = true;
  if (parseOnOff(attr(el, "shrinkToFit"))) result.shrinkToFit = true;
  const readingOrder = attrNum(el, "readingOrder");
  if (readingOrder !== void 0) result.readingOrder = readingOrder;
  return result;
}
function parseProtection(el) {
  const result = {};
  const locked = attr(el, "locked");
  if (locked !== void 0) result.locked = parseOnOff(locked) ?? true;
  const hidden = attr(el, "hidden");
  if (hidden !== void 0) result.hidden = parseOnOff(hidden) ?? true;
  return result;
}
function parseColorHex(el) {
  const rgb = attr(el, "rgb");
  if (rgb) return rgb.length === 8 ? rgb.slice(2) : rgb;
}
function readThemeColor(el, target) {
  const theme = attrNum(el, "theme");
  if (theme !== void 0) target.themeColor = theme;
  const tint = attrNum(el, "tint");
  if (tint !== void 0) target.tint = tint;
}
function tElement(text) {
  return `${/^\s|\s$/.test(text) ? '<t xml:space="preserve">' : "<t>"}${escapeXml(text)}</t>`;
}
function buildRPrXml(pr) {
  if (!pr) return "";
  const parts = [];
  if (pr.font) parts.push(`<rFont val="${escapeXml(pr.font)}"/>`);
  if (pr.charset !== void 0) parts.push(`<charset val="${pr.charset}"/>`);
  if (pr.family !== void 0) parts.push(`<family val="${pr.family}"/>`);
  if (pr.bold) parts.push("<b/>");
  if (pr.italic) parts.push("<i/>");
  if (pr.strike) parts.push("<strike/>");
  if (pr.outline) parts.push("<outline/>");
  if (pr.shadow) parts.push("<shadow/>");
  if (pr.condense) parts.push("<condense/>");
  if (pr.extend) parts.push("<extend/>");
  if (pr.color) {
    if (/^\d{1,3}$/.test(pr.color)) parts.push(`<color indexed="${Number(pr.color)}"/>`);
    else if (pr.color.startsWith("theme:")) parts.push(`<color theme="${escapeXml(pr.color.slice(6))}"/>`);
    else {
      const rgb = pr.color.length === 6 ? `FF${pr.color}` : pr.color;
      parts.push(`<color rgb="${escapeXml(rgb)}"/>`);
    }
  }
  if (pr.size !== void 0) parts.push(`<sz val="${pr.size}"/>`);
  if (pr.underline) parts.push(`<u val="${pr.underline}"/>`);
  if (pr.vertAlign) parts.push(`<vertAlign val="${pr.vertAlign}"/>`);
  if (pr.scheme) parts.push(`<scheme val="${pr.scheme}"/>`);
  return parts.length > 0 ? `<rPr>${parts.join("")}</rPr>` : "";
}
function buildRstXml(rst) {
  const parts = [];
  if (rst.runs && rst.runs.length > 0) for (const run of rst.runs) {
    const rPr = buildRPrXml(run.properties);
    parts.push(`<r>${rPr}${tElement(run.text)}</r>`);
  }
  else if (rst.text !== void 0) parts.push(tElement(rst.text));
  if (rst.phonetics) for (const ph of rst.phonetics) parts.push(`<rPh sb="${ph.startByte}" eb="${ph.endByte}">${tElement(ph.text)}</rPh>`);
  if (rst.phoneticProperties) {
    const pp = rst.phoneticProperties;
    const attrs2 = [`fontId="${pp.fontId}"`];
    if (pp.type) attrs2.push(`type="${pp.type}"`);
    if (pp.alignment) attrs2.push(`alignment="${pp.alignment}"`);
    parts.push(`<phoneticPr ${attrs2.join(" ")}/>`);
  }
  return parts.join("");
}
var SharedStrings = class {
  entries = [];
  /** Dedup map for plain strings only. */
  indexMap = /* @__PURE__ */ new Map();
  /**
  * Identity dedup map for rich text — round-tripped cells hold the same
  * entry object the loaded table already contains, so registering them must
  * resolve back to the original index instead of appending a duplicate si.
  */
  richIndexMap = /* @__PURE__ */ new Map();
  /**
  * Register a plain string and return its index.
  * Returns existing index if the string is already registered.
  */
  register(s) {
    const existing = this.indexMap.get(s);
    if (existing !== void 0) return existing;
    const idx = this.entries.length;
    this.entries.push(s);
    this.indexMap.set(s, idx);
    return idx;
  }
  /**
  * Register a rich text entry and return its index. The same object
  * (identity) resolves to its existing index; distinct objects are appended.
  */
  registerRich(rst) {
    const existing = this.richIndexMap.get(rst);
    if (existing !== void 0) return existing;
    const idx = this.entries.length;
    this.entries.push(rst);
    this.richIndexMap.set(rst, idx);
    return idx;
  }
  /**
  * Bulk-load parsed template entries, preserving their original indices so
  * existing cell references stay valid. Plain strings populate the dedup map
  * (first occurrence wins); rich-text entries populate the identity map.
  *
  * Used by patch and by generate() for a parsed workbook, so cells keep
  * pointing at the source table instead of re-registering flattened text.
  */
  loadEntries(entries) {
    for (const entry of entries) {
      const idx = this.entries.length;
      this.entries.push(entry);
      if (typeof entry === "string") {
        if (!this.indexMap.has(entry)) this.indexMap.set(entry, idx);
      } else if (!this.richIndexMap.has(entry)) this.richIndexMap.set(entry, idx);
    }
  }
  get count() {
    return this.entries.length;
  }
  /** Return a serializable snapshot for the descriptor. */
  toDescriptorOptions() {
    return { entries: this.entries };
  }
  /** Serialize to xl/sharedStrings.xml content (without XML declaration). */
  serialize() {
    return serializeSstEntries(this.entries);
  }
};
function serializeSstEntries(entries) {
  const p = ['<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', ` count="${entries.length}" uniqueCount="${entries.length}">`];
  for (const entry of entries) if (typeof entry === "string") p.push(`<si>${tElement(entry)}</si>`);
  else p.push(`<si>${buildRstXml(entry)}</si>`);
  p.push("</sst>");
  return p.join("");
}
var sharedStringsDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (opts.entries.length === 0) return void 0;
    return serializeSstEntries(opts.entries);
  },
  parse(el, _ctx) {
    const entries = [];
    for (const si of el.elements ?? []) {
      if (si.name !== "si") continue;
      const t = findChild(si, "t");
      const hasPhonetic = (si.elements ?? []).some((e) => e.name === "rPh" || e.name === "phoneticPr");
      if (t && !hasPhonetic) {
        entries.push(textOf(t) ?? "");
        continue;
      }
      const runs = [];
      for (const r of si.elements ?? []) {
        if (r.name !== "r") continue;
        const rt = findChild(r, "t");
        if (rt) {
          const rPrEl = findChild(r, "rPr");
          const run = { text: textOf(rt) ?? "" };
          if (rPrEl) run.properties = parseRPr(rPrEl);
          runs.push(run);
        }
      }
      const phonetics = [];
      let phoneticProperties;
      for (const rPh of si.elements ?? []) if (rPh.name === "rPh") {
        const sb = attrNum(rPh, "sb") ?? 0;
        const eb = attrNum(rPh, "eb") ?? 0;
        const rPhT = findChild(rPh, "t");
        phonetics.push({
          startByte: sb,
          endByte: eb,
          text: rPhT ? textOf(rPhT) ?? "" : ""
        });
      } else if (rPh.name === "phoneticPr") {
        const fontId = attrNum(rPh, "fontId");
        if (fontId !== void 0) {
          const pp = { fontId };
          const type = attr(rPh, "type");
          if (type) pp.type = type;
          const align = attr(rPh, "alignment");
          if (align) pp.alignment = align;
          phoneticProperties = pp;
        }
      }
      if (runs.length > 0) {
        const entry = { runs };
        if (phonetics.length > 0) entry.phonetics = phonetics;
        if (phoneticProperties) entry.phoneticProperties = phoneticProperties;
        entries.push(entry);
      } else if (t) {
        const entry = { text: textOf(t) ?? "" };
        if (phonetics.length > 0) entry.phonetics = phonetics;
        if (phoneticProperties) entry.phoneticProperties = phoneticProperties;
        entries.push(entry);
      }
    }
    return { entries };
  }
};
function parseRPr(el) {
  const result = {};
  for (const child of el.elements ?? []) switch (child.name) {
    case "rFont":
      result.font = attr(child, "val") ?? void 0;
      break;
    case "charset":
      result.charset = attrNum(child, "val");
      break;
    case "family":
      result.family = attrNum(child, "val");
      break;
    case "b":
      result.bold = parseOnOff(attr(child, "val")) ?? true;
      break;
    case "i":
      result.italic = parseOnOff(attr(child, "val")) ?? true;
      break;
    case "strike":
      result.strike = true;
      break;
    case "outline":
      result.outline = true;
      break;
    case "shadow":
      result.shadow = true;
      break;
    case "condense":
      result.condense = true;
      break;
    case "extend":
      result.extend = true;
      break;
    case "color": {
      const rgb = parseColorHex(child);
      if (rgb) result.color = rgb;
      else {
        const indexed = attrNum(child, "indexed");
        if (indexed !== void 0) result.color = String(indexed);
        else {
          const theme = attr(child, "theme");
          if (theme !== void 0) result.color = `theme:${theme}`;
        }
      }
      break;
    }
    case "sz":
      result.size = attrNum(child, "val");
      break;
    case "u":
      result.underline = attr(child, "val") ?? "single";
      break;
    case "vertAlign":
      result.vertAlign = attr(child, "val");
      break;
    case "scheme":
      result.scheme = attr(child, "val");
  }
  return result;
}
function fontKey(f) {
  return `b${f.bold ? 1 : 0}i${f.italic ? 1 : 0}u${f.underline ? 1 : 0}s${f.strike ? 1 : 0}z${f.size ?? 0}c${f.color ?? ""}tc${f.themeColor ?? ""}ti${f.tint ?? ""}ix${f.colorIndexed ?? ""}a${f.autoColor ? 1 : 0}n${f.font ?? ""}cs${f.charset ?? ""}fm${f.family ?? ""}co${f.condense ? 1 : 0}ex${f.extend ? 1 : 0}va${f.vertAlign ?? ""}sc${f.scheme ?? ""}sh${f.shadow ? 1 : 0}ol${f.outline ? 1 : 0}`;
}
function fillKey(f) {
  return `t${f.type ?? ""}c${f.color ?? ""}tc${f.themeColor ?? ""}ti${f.tint ?? ""}ix${f.colorIndexed ?? ""}fa${f.fgAutoColor ? 1 : 0}p${f.patternType ?? ""}bg${f.bgColor ?? ""}bgtc${f.bgThemeColor ?? ""}bgti${f.bgTint ?? ""}bgix${f.bgColorIndexed ?? ""}bga${f.bgAutoColor ? 1 : 0}g${f.stops?.map((s) => `${s.position}_${s.color}`).join("|") ?? ""}`;
}
function borderKey(b) {
  const sk = (o) => `${o ? 1 : 0}_${o?.style ?? ""}_${o?.color ?? ""}_${o?.themeColor ?? ""}_${o?.tint ?? ""}_${o?.colorIndexed ?? ""}_${o?.autoColor ? 1 : 0}`;
  return `t${sk(b.top)}b${sk(b.bottom)}l${sk(b.left)}r${sk(b.right)}d${sk(b.diagonal)}du${b.diagonalUp ? 1 : 0}dd${b.diagonalDown ? 1 : 0}st${sk(b.start)}en${sk(b.end)}v${sk(b.vertical)}h${sk(b.horizontal)}`;
}
var BUILTIN_NUMFMTS = {
  General: 0,
  "0": 1,
  "0.00": 2,
  "#,##0": 3,
  "#,##0.00": 4,
  "0%": 9,
  "0.00%": 10,
  "0.00E+00": 11,
  "mm-dd-yy": 14,
  "d-mmm-yy": 15,
  "d-mmm": 16,
  "mmm-yy": 17,
  "h:mm AM/PM": 18,
  "h:mm:ss AM/PM": 19,
  "h:mm": 20,
  "h:mm:ss": 21,
  "m/d/yy h:mm": 22,
  "#,##0 ;(#,##0)": 37,
  "#,##0 ;[Red](#,##0)": 38,
  "#,##0.00;(#,##0.00)": 39,
  "#,##0.00;[Red](#,##0.00)": 40,
  "mm:ss": 45,
  "[h]:mm:ss": 46,
  "mmss.0": 47,
  "##0.0E+0": 48,
  "@": 49
};
new Map(Object.entries(BUILTIN_NUMFMTS).map(([code, id]) => [id, code]));
var Styles = class {
  fonts = [{
    size: 11,
    font: "Calibri"
  }];
  fontKeys = /* @__PURE__ */ new Map();
  fills = [{ patternType: "none" }, { patternType: "gray125" }];
  fillKeys = /* @__PURE__ */ new Map();
  borders = [{}];
  borderKeys = /* @__PURE__ */ new Map();
  customNumFmts = /* @__PURE__ */ new Map();
  nextCustomNumFmtId = 164;
  cellXfs = [{
    fontId: 0,
    fillId: 0,
    borderId: 0,
    numFmtId: 0
  }];
  cellXfKeys = /* @__PURE__ */ new Map();
  /** Named cell-style templates (cellStyleXfs); index 0 is the Normal style. */
  cellStyleXfs = [{
    fontId: 0,
    fillId: 0,
    borderId: 0,
    numFmtId: 0
  }];
  dxfs = [];
  colors;
  tableStyles;
  /** Custom cell styles (CT_CellStyles) */
  customCellStyles;
  /** Style sheet extensions (CT_ExtensionList) */
  styleExtensions;
  /**
  * True once a parsed source table was adopted — switches optional
  * containers (dxfs, tableStyles) from the fresh-file convention (always
  * written, even empty) to emitting only what the source declared.
  */
  roundTrip = false;
  /** True once setDxfs() ran — an explicit empty `<dxfs/>` still serializes. */
  dxfsDeclared = false;
  /** True once an adopted table declared a (possibly empty) numFmts section. */
  numFmtsDeclared = false;
  constructor() {
    this.fontKeys.set(fontKey(this.fonts[0]), 0);
    this.fillKeys.set(fillKey(this.fills[0]), 0);
    this.fillKeys.set(fillKey(this.fills[1]), 1);
    this.borderKeys.set(borderKey(this.borders[0]), 0);
    this.cellXfKeys.set(this.cellXfKey(this.cellXfs[0]), 0);
  }
  /**
  * Register a style and return its index (for the cell `s` attribute).
  * Deduplicates across fonts, fills, borders, numFmts, and cellXfs.
  */
  register(opts) {
    const xf = {
      fontId: this.registerFont(opts.font),
      fillId: this.registerFill(opts.fill),
      borderId: this.registerBorder(opts.border),
      numFmtId: this.registerNumFmt(opts.numFmt),
      alignment: opts.alignment,
      quotePrefix: opts.quotePrefix,
      pivotButton: opts.pivotButton,
      applyProtection: opts.applyProtection,
      protection: opts.protection
    };
    const key = this.cellXfKey(xf);
    const existing = this.cellXfKeys.get(key);
    if (existing !== void 0) return existing;
    const idx = this.cellXfs.length;
    this.cellXfs.push(xf);
    this.cellXfKeys.set(key, idx);
    return idx;
  }
  /**
  * Register a differential format and return its index (dxfId).
  * Used by conditional formatting rules.
  */
  registerDxf(opts) {
    const idx = this.dxfs.length;
    this.dxfs.push(opts);
    return idx;
  }
  /**
  * Set the dxf list from parsed options. `[]` (the source declared an empty
  * `<dxfs/>` container) is distinct from never setting it (fresh document).
  */
  setDxfs(list) {
    this.dxfs = [...list];
    this.dxfsDeclared = true;
  }
  /**
  * Set color palette (indexed colors and MRU colors).
  */
  setColors(opts) {
    this.colors = opts;
  }
  setTableStyles(styles) {
    this.tableStyles = styles;
  }
  setExtensions(extensions) {
    this.styleExtensions = extensions;
  }
  setCustomCellStyles(styles) {
    this.customCellStyles = styles;
  }
  /**
  * Set named cell-style templates (cellStyleXfs). Each entry's font/fill/
  * border/numFmt definitions are re-registered (deduplicated) so indices track
  * the rebuilt tables. Entries keep source order, keeping cellStyle.xfId
  * references stable (oldIndex === newIndex). Alignment/protection and the
  * applyXxx flags are preserved verbatim for named-style fidelity.
  */
  setCellStyleXfs(entries) {
    this.cellStyleXfs = entries.map((entry) => ({
      fontId: this.registerFont(entry.font),
      fillId: this.registerFill(entry.fill),
      borderId: this.registerBorder(entry.border),
      numFmtId: this.registerNumFmt(entry.numFmt),
      alignment: entry.alignment,
      protection: entry.protection,
      quotePrefix: entry.quotePrefix,
      pivotButton: entry.pivotButton,
      applyNumberFormat: entry.applyNumberFormat,
      applyFont: entry.applyFont,
      applyFill: entry.applyFill,
      applyBorder: entry.applyBorder,
      applyAlignment: entry.applyAlignment,
      applyProtection: entry.applyProtection
    }));
  }
  /**
  * Expose internal state for descriptor-based XML generation.
  * The descriptor reads this snapshot to produce xl/styles.xml.
  */
  toDescriptorOptions() {
    return {
      customNumFmts: new Map(this.customNumFmts),
      fonts: [...this.fonts],
      fills: [...this.fills],
      borders: [...this.borders],
      cellXfs: [...this.cellXfs],
      dxfs: [...this.dxfs],
      colors: this.colors,
      tableStyles: this.tableStyles,
      customCellStyles: this.customCellStyles,
      styleExtensions: this.styleExtensions
    };
  }
  registerFont(opts) {
    if (!opts) return 0;
    const key = fontKey(opts);
    const existing = this.fontKeys.get(key);
    if (existing !== void 0) return existing;
    const idx = this.fonts.length;
    this.fonts.push(opts);
    this.fontKeys.set(key, idx);
    return idx;
  }
  registerFill(opts) {
    if (!opts) return 0;
    const key = fillKey(opts);
    const existing = this.fillKeys.get(key);
    if (existing !== void 0) return existing;
    const idx = this.fills.length;
    this.fills.push(opts);
    this.fillKeys.set(key, idx);
    return idx;
  }
  registerBorder(opts) {
    if (!opts) return 0;
    const key = borderKey(opts);
    const existing = this.borderKeys.get(key);
    if (existing !== void 0) return existing;
    const idx = this.borders.length;
    this.borders.push(opts);
    this.borderKeys.set(key, idx);
    return idx;
  }
  registerNumFmt(fmt) {
    if (!fmt) return 0;
    const builtin = BUILTIN_NUMFMTS[fmt];
    if (builtin !== void 0) return builtin;
    const existing = this.customNumFmts.get(fmt);
    if (existing !== void 0) return existing;
    const id = this.nextCustomNumFmtId++;
    this.customNumFmts.set(fmt, id);
    return id;
  }
  cellXfKey(xf) {
    const a = xf.alignment;
    const ak = a ? `h${a.horizontal ?? ""}v${a.vertical ?? ""}w${a.wrapText ? 1 : 0}r${a.textRotation ?? ""}i${a.indent ?? ""}ri${a.relativeIndent ?? ""}jl${a.justifyLastLine ? 1 : 0}st${a.shrinkToFit ? 1 : 0}ro${a.readingOrder ?? ""}` : "";
    const pr = xf.protection;
    const pk = pr ? `l${pr.locked ?? ""}h${pr.hidden ?? ""}` : "";
    return `${xf.fontId}|${xf.fillId}|${xf.borderId}|${xf.numFmtId}|x${xf.xfId ?? ""}|${ak}|qp${xf.quotePrefix ? 1 : 0}|pb${xf.pivotButton ? 1 : 0}|${pk}`;
  }
  /**
  * Adopt a parsed source style table wholesale, replacing the fresh-file
  * defaults (the SDK's Stylesheet model: the table is a unit, cells carry
  * its indices). Fonts/fills/borders/cellXfs keep their source order, so raw
  * cell indices resolve exactly as they did in the source file; styles
  * registered afterwards dedup against the adopted entries and extend the
  * index space at the end.
  */
  adopt(table) {
    this.roundTrip = true;
    this.fonts = table.fonts ? [...table.fonts] : [this.fonts[0]];
    this.fontKeys = new Map(this.fonts.map((f, i) => [fontKey(f), i]));
    this.fills = table.fills ? [...table.fills] : [{ patternType: "none" }, { patternType: "gray125" }];
    this.fillKeys = new Map(this.fills.map((f, i) => [fillKey(f), i]));
    this.borders = table.borders ? [...table.borders] : [{}];
    this.borderKeys = new Map(this.borders.map((b, i) => [borderKey(b), i]));
    this.cellXfs = (table.cellXfs ?? [{
      fontId: 0,
      fillId: 0,
      borderId: 0,
      numFmtId: 0
    }]).map((e) => ({
      fontId: e.fontId ?? 0,
      fillId: e.fillId ?? 0,
      borderId: e.borderId ?? 0,
      numFmtId: e.numFmtId ?? 0,
      xfId: e.xfId,
      alignment: e.alignment,
      quotePrefix: e.quotePrefix,
      pivotButton: e.pivotButton,
      applyProtection: e.applyProtection,
      protection: e.protection,
      applyFont: e.applyFont,
      applyFill: e.applyFill,
      applyBorder: e.applyBorder,
      applyNumberFormat: e.applyNumberFormat,
      applyAlignment: e.applyAlignment
    }));
    this.cellXfKeys = new Map(this.cellXfs.map((xf, i) => [this.cellXfKey(xf), i]));
    if (table.numFmts) {
      this.numFmtsDeclared = true;
      this.customNumFmts = new Map(table.numFmts.map((e) => [e.formatCode, e.numFmtId]));
      for (const id of this.customNumFmts.values()) if (id >= this.nextCustomNumFmtId) this.nextCustomNumFmtId = id + 1;
    }
  }
  /**
  * Zero-allocation fast path: directly concatenate XML string.
  * Bypasses the intermediate object tree entirely.
  */
  /** Serialize to xl/styles.xml content (without XML declaration). */
  serialize() {
    const p = ['<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    if (this.customNumFmts.size > 0) {
      p.push(`<numFmts count="${this.customNumFmts.size}">`);
      for (const [fmt, id] of this.customNumFmts) p.push(`<numFmt numFmtId="${id}" formatCode="${escapeXml(fmt)}"/>`);
      p.push("</numFmts>");
    } else if (this.numFmtsDeclared) p.push('<numFmts count="0"/>');
    if (this.fonts.length > 0) {
      p.push(`<fonts count="${this.fonts.length}">`);
      for (const f of this.fonts) p.push(`<font>${this.fontXmlStr(f)}</font>`);
      p.push("</fonts>");
    }
    if (this.fills.length > 0) {
      p.push(`<fills count="${this.fills.length}">`);
      for (const f of this.fills) if (f.type === "gradient" && f.stops && f.stops.length > 0) {
        const gfAttrs = {};
        if (f.gradientType && f.gradientType !== "linear") gfAttrs.type = f.gradientType;
        if (f.gradientDegree !== void 0) gfAttrs.degree = f.gradientDegree;
        if (f.gradientLeft !== void 0) gfAttrs.left = f.gradientLeft;
        if (f.gradientRight !== void 0) gfAttrs.right = f.gradientRight;
        if (f.gradientTop !== void 0) gfAttrs.top = f.gradientTop;
        if (f.gradientBottom !== void 0) gfAttrs.bottom = f.gradientBottom;
        const stopParts = f.stops.map((s) => `<stop position="${s.position}"><color rgb="FF${s.color}"/></stop>`).join("");
        p.push(`<fill><gradientFill${attrs(gfAttrs)}>${stopParts}</gradientFill></fill>`);
      } else {
        const patternAttrs = attrs({ patternType: f.patternType ?? "solid" });
        const fgChannel = f.themeColor !== void 0 ? `theme="${f.themeColor}"` : f.colorIndexed !== void 0 ? `indexed="${f.colorIndexed}"` : f.color ? `rgb="FF${f.color}"` : f.fgAutoColor ? 'auto="1"' : "";
        const fgTint = f.tint !== void 0 ? ` tint="${f.tint}"` : "";
        const fgColor = fgChannel ? `<fgColor ${fgChannel}${fgTint}/>` : "";
        const bgChannel = f.bgThemeColor !== void 0 ? `theme="${f.bgThemeColor}"` : f.bgColorIndexed !== void 0 ? `indexed="${f.bgColorIndexed}"` : f.bgColor ? `rgb="FF${f.bgColor}"` : f.bgAutoColor ? 'auto="1"' : "";
        const bgTint = f.bgTint !== void 0 ? ` tint="${f.bgTint}"` : "";
        const colorContent = fgColor + (bgChannel ? `<bgColor ${bgChannel}${bgTint}/>` : "");
        p.push(colorContent ? `<fill><patternFill${patternAttrs}>${colorContent}</patternFill></fill>` : `<fill><patternFill${patternAttrs}/></fill>`);
      }
      p.push("</fills>");
    }
    if (this.borders.length > 0) {
      p.push(`<borders count="${this.borders.length}">`);
      for (const b of this.borders) {
        const bAttrs = [];
        if (b.diagonalUp) bAttrs.push('diagonalUp="1"');
        if (b.diagonalDown) bAttrs.push('diagonalDown="1"');
        const bAttr = bAttrs.length ? ` ${bAttrs.join(" ")}` : "";
        p.push(`<border${bAttr}>${this.borderXmlStr(b)}</border>`);
      }
      p.push("</borders>");
    }
    if (this.cellStyleXfs.length > 0) {
      p.push(`<cellStyleXfs count="${this.cellStyleXfs.length}">`);
      for (const xf of this.cellStyleXfs) {
        const xAttrs = {
          numFmtId: xf.numFmtId,
          fontId: xf.fontId,
          fillId: xf.fillId,
          borderId: xf.borderId
        };
        if (xf.applyNumberFormat) xAttrs.applyNumberFormat = 1;
        if (xf.applyFont) xAttrs.applyFont = 1;
        if (xf.applyFill) xAttrs.applyFill = 1;
        if (xf.applyBorder) xAttrs.applyBorder = 1;
        if (xf.applyAlignment) xAttrs.applyAlignment = 1;
        if (xf.applyProtection) xAttrs.applyProtection = 1;
        if (xf.quotePrefix) xAttrs.quotePrefix = 1;
        if (xf.pivotButton) xAttrs.pivotButton = 1;
        const inner = (xf.alignment ? this.alignmentXmlStr(xf.alignment) : "") + (xf.protection ? this.protectionXmlStr(xf.protection) : "");
        p.push(inner ? `<xf${attrs(xAttrs)}>${inner}</xf>` : `<xf${attrs(xAttrs)}/>`);
      }
      p.push("</cellStyleXfs>");
    }
    if (this.cellXfs.length > 0) {
      p.push(`<cellXfs count="${this.cellXfs.length}">`);
      for (const xf of this.cellXfs) {
        const xAttrs = {
          numFmtId: xf.numFmtId,
          fontId: xf.fontId,
          fillId: xf.fillId,
          borderId: xf.borderId,
          xfId: xf.xfId ?? 0
        };
        const applyFont = xf.applyFont ?? (xf.fontId > 0 || void 0);
        const applyFill = xf.applyFill ?? (xf.fillId > 0 || void 0);
        const applyBorder = xf.applyBorder ?? (xf.borderId > 0 || void 0);
        const applyNumberFormat = xf.applyNumberFormat ?? (xf.numFmtId > 0 || void 0);
        const applyAlignment = xf.applyAlignment ?? (xf.alignment ? true : void 0);
        if (applyFont) xAttrs.applyFont = 1;
        if (applyFill) xAttrs.applyFill = 1;
        if (applyBorder) xAttrs.applyBorder = 1;
        if (applyNumberFormat) xAttrs.applyNumberFormat = 1;
        if (applyAlignment) xAttrs.applyAlignment = 1;
        if (xf.quotePrefix) xAttrs.quotePrefix = 1;
        if (xf.pivotButton) xAttrs.pivotButton = 1;
        if (xf.applyProtection) xAttrs.applyProtection = 1;
        if (xf.protection) xAttrs.applyProtection = xAttrs.applyProtection ?? 1;
        const inner = (xf.alignment ? this.alignmentXmlStr(xf.alignment) : "") + (xf.protection ? this.protectionXmlStr(xf.protection) : "");
        p.push(inner ? `<xf${attrs(xAttrs)}>${inner}</xf>` : `<xf${attrs(xAttrs)}/>`);
      }
      p.push("</cellXfs>");
    }
    if (this.customCellStyles !== void 0) {
      if (this.customCellStyles.length === 0) p.push('<cellStyles count="0"/>');
      else {
        const hasNormal = this.customCellStyles.some((cs) => cs.builtinId === 0 || cs.name === "Normal");
        const csParts = [`<cellStyles ${[`count="${this.customCellStyles.length + (hasNormal ? 0 : 1)}"`].join(" ")}>`];
        if (!hasNormal) csParts.push('<cellStyle name="Normal" xfId="0" builtinId="0"/>');
        for (const cs of this.customCellStyles) {
          const attrs2 = [`name="${escapeXml(cs.name)}"`, `xfId="${cs.xfId}"`];
          if (cs.builtinId !== void 0) attrs2.push(`builtinId="${cs.builtinId}"`);
          if (cs.customBuiltin) attrs2.push('customBuiltin="1"');
          if (cs.iLevel !== void 0) attrs2.push(`iLevel="${cs.iLevel}"`);
          if (cs.hidden) attrs2.push('hidden="1"');
          csParts.push(`<cellStyle ${attrs2.join(" ")}/>`);
        }
        csParts.push("</cellStyles>");
        p.push(csParts.join(""));
      }
    } else if (!this.roundTrip) p.push('<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>');
    if (this.dxfs.length > 0) {
      p.push(`<dxfs count="${this.dxfs.length}">`);
      for (const dxf of this.dxfs) {
        const dParts = [];
        if (dxf.font) dParts.push(`<font>${this.fontXmlStr(dxf.font)}</font>`);
        if (dxf.numFmt) {
          const nf = typeof dxf.numFmt === "string" ? { formatCode: dxf.numFmt } : dxf.numFmt;
          const numFmtId = nf.numFmtId ?? BUILTIN_NUMFMTS[nf.formatCode] ?? 164;
          dParts.push(`<numFmt numFmtId="${numFmtId}" formatCode="${escapeXml(nf.formatCode)}"/>`);
        }
        if (dxf.fill) {
          const f = dxf.fill;
          const patAttrs = f.patternType !== void 0 ? attrs({ patternType: f.patternType }) : "";
          const hasBg = f.bgColor !== void 0 || f.bgColorIndexed !== void 0 || f.bgThemeColor !== void 0 || f.bgAutoColor !== void 0;
          const fgChannel = f.themeColor !== void 0 ? `theme="${f.themeColor}"` : f.colorIndexed !== void 0 ? `indexed="${f.colorIndexed}"` : f.color && hasBg ? `rgb="FF${f.color}"` : f.fgAutoColor ? 'auto="1"' : "";
          const fgTint = f.tint !== void 0 ? ` tint="${f.tint}"` : "";
          const fgContent = fgChannel ? `<fgColor ${fgChannel}${fgTint}/>` : "";
          const bgChannel = f.bgThemeColor !== void 0 ? `theme="${f.bgThemeColor}"` : f.bgColorIndexed !== void 0 ? `indexed="${f.bgColorIndexed}"` : f.bgColor ? `rgb="FF${f.bgColor}"` : f.bgAutoColor ? 'auto="1"' : f.color && !hasBg ? `rgb="FF${f.color}"` : "";
          const bgTint = f.bgTint !== void 0 ? ` tint="${f.bgTint}"` : "";
          const fillContent = fgContent + (bgChannel ? `<bgColor ${bgChannel}${bgTint}/>` : "");
          dParts.push(fillContent ? `<fill><patternFill${patAttrs}>${fillContent}</patternFill></fill>` : `<fill><patternFill${patAttrs}/></fill>`);
        }
        if (dxf.alignment) dParts.push(this.alignmentXmlStr(dxf.alignment));
        if (dxf.border) dParts.push(`<border>${this.borderXmlStr(dxf.border, false)}</border>`);
        if (dxf.protection) dParts.push(this.protectionXmlStr(dxf.protection));
        if (dParts.length > 0) p.push(`<dxf>${dParts.join("")}</dxf>`);
        else p.push("<dxf/>");
      }
      p.push("</dxfs>");
    } else if (this.dxfsDeclared || !this.roundTrip) p.push('<dxfs count="0"/>');
    if (this.tableStyles && this.tableStyles.length > 0) {
      const tsParts = [`<tableStyles count="${this.tableStyles.length}" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16">`];
      for (const ts of this.tableStyles) {
        const tsAttrs = [`name="${escapeXml(ts.name)}"`];
        if (ts.pivot) tsAttrs.push('pivot="1"');
        if (ts.table === false) tsAttrs.push('table="0"');
        if (ts.elements && ts.elements.length > 0) {
          tsParts.push(`<tableStyle ${tsAttrs.join(" ")}>`);
          for (const el of ts.elements) {
            const elAttrs = [`type="${el.type}"`];
            if (el.dxfId !== void 0) elAttrs.push(`dxfId="${el.dxfId}"`);
            tsParts.push(`<tableStyleElement ${elAttrs.join(" ")}/>`);
          }
          tsParts.push("</tableStyle>");
        } else tsParts.push(`<tableStyle ${tsAttrs.join(" ")}/>`);
      }
      tsParts.push("</tableStyles>");
      p.push(tsParts.join(""));
    } else if (this.tableStyles !== void 0 || !this.roundTrip) p.push('<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>');
    if (this.colors) {
      const c = this.colors;
      const colorParts = ["<colors>"];
      if (c.indexedColors && c.indexedColors.length > 0) {
        colorParts.push("<indexedColors>");
        for (const ic of c.indexedColors) colorParts.push(`<rgbColor rgb="${ic.rgb}"/>`);
        colorParts.push("</indexedColors>");
      }
      if (c.mruColors && c.mruColors.length > 0) {
        colorParts.push("<mruColors>");
        for (const mc of c.mruColors) colorParts.push(`<color rgb="FF${mc}"/>`);
        colorParts.push("</mruColors>");
      }
      colorParts.push("</colors>");
      p.push(colorParts.join(""));
    }
    if (this.styleExtensions && this.styleExtensions.length > 0) {
      const extParts = ["<extLst>"];
      for (const ext of this.styleExtensions) {
        const ns = Object.entries(ext.namespaces ?? {}).map(([name, value]) => ` ${name}="${value}"`).join("");
        if (ext.content) extParts.push(`<ext uri="${ext.uri}"${ns}>${ext.content}</ext>`);
        else extParts.push(`<ext uri="${ext.uri}"${ns}/>`);
      }
      extParts.push("</extLst>");
      p.push(extParts.join(""));
    }
    p.push("</styleSheet>");
    return p.join("");
  }
  fontXmlStr(f) {
    const parts = [];
    const flag = (name, on) => {
      if (on === void 0) return;
      parts.push(on ? `<${name}/>` : `<${name} val="0"/>`);
    };
    flag("b", f.bold);
    flag("i", f.italic);
    flag("strike", f.strike);
    flag("condense", f.condense);
    flag("extend", f.extend);
    flag("outline", f.outline);
    flag("shadow", f.shadow);
    if (f.underline !== void 0) parts.push(f.underline ? "<u/>" : '<u val="none"/>');
    if (f.vertAlign) parts.push(`<vertAlign val="${f.vertAlign}"/>`);
    if (f.size) parts.push(`<sz val="${f.size}"/>`);
    if (f.autoColor) parts.push('<color auto="1"/>');
    else if (f.themeColor !== void 0) parts.push(`<color theme="${f.themeColor}"${f.tint !== void 0 ? ` tint="${f.tint}"` : ""}/>`);
    else if (f.colorIndexed !== void 0) parts.push(`<color indexed="${f.colorIndexed}"/>`);
    else if (f.color) parts.push(`<color rgb="FF${f.color}"/>`);
    if (f.font) parts.push(`<name val="${escapeXml(f.font)}"/>`);
    if (f.family !== void 0) parts.push(`<family val="${f.family}"/>`);
    if (f.charset !== void 0) parts.push(`<charset val="${f.charset}"/>`);
    if (f.scheme) parts.push(`<scheme val="${f.scheme}"/>`);
    return parts.join("");
  }
  /**
  * Serialize a border. `allSides` pads the five cell sides Excel always
  * writes (cellXfs context); dxf borders carry only the sides present.
  */
  borderXmlStr(b, allSides = true) {
    const parts = [];
    const sideColorXmlStr = (side) => {
      if (side.autoColor) return '<color auto="1"/>';
      if (side.themeColor !== void 0) return `<color theme="${side.themeColor}"${side.tint !== void 0 ? ` tint="${side.tint}"` : ""}/>`;
      if (side.colorIndexed !== void 0) return `<color indexed="${side.colorIndexed}"/>`;
      if (side.color) return `<color rgb="FF${side.color}"/>`;
      return "";
    };
    const renderSide = (name, opts, required) => {
      if (opts?.style && opts.style !== "none") parts.push(`<${name} style="${opts.style}">${sideColorXmlStr(opts)}</${name}>`);
      else if (opts || required) parts.push(`<${name}/>`);
    };
    for (const side of [
      "left",
      "right",
      "top",
      "bottom",
      "diagonal"
    ]) renderSide(side, b[side], allSides);
    renderSide("vertical", b.vertical, false);
    renderSide("horizontal", b.horizontal, false);
    renderSide("start", b.start, false);
    renderSide("end", b.end, false);
    return parts.join("");
  }
  alignmentXmlStr(a) {
    const aAttrs = {};
    if (a.horizontal) aAttrs.horizontal = a.horizontal;
    if (a.vertical) aAttrs.vertical = a.vertical;
    if (a.wrapText) aAttrs.wrapText = 1;
    if (a.textRotation !== void 0) aAttrs.textRotation = a.textRotation;
    if (a.indent !== void 0) aAttrs.indent = a.indent;
    if (a.relativeIndent !== void 0) aAttrs.relativeIndent = a.relativeIndent;
    if (a.justifyLastLine) aAttrs.justifyLastLine = 1;
    if (a.shrinkToFit) aAttrs.shrinkToFit = 1;
    if (a.readingOrder !== void 0) aAttrs.readingOrder = a.readingOrder;
    return `<alignment${attrs(aAttrs)}/>`;
  }
  protectionXmlStr(pr) {
    const prAttrs = {};
    if (pr.locked !== void 0) prAttrs.locked = pr.locked ? 1 : 0;
    if (pr.hidden !== void 0) prAttrs.hidden = pr.hidden ? 1 : 0;
    return `<protection${attrs(prAttrs)}/>`;
  }
};
var stylesDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return opts.styles.serialize();
  },
  parse(el, _ctx) {
    const result = {};
    const numFmtById = /* @__PURE__ */ new Map();
    const fonts = [];
    const fills = [];
    const borders = [];
    const numFmtsEl = findChild(el, "numFmts");
    if (numFmtsEl) {
      const entries = [];
      for (const nf of numFmtsEl.elements ?? []) {
        if (nf.name !== "numFmt") continue;
        const id = attrNum(nf, "numFmtId");
        const code = attr(nf, "formatCode");
        if (id !== void 0 && code) {
          numFmtById.set(id, code);
          entries.push({
            numFmtId: id,
            formatCode: code
          });
        }
      }
      result.numFmts = entries;
    }
    const fontsEl = findChild(el, "fonts");
    if (fontsEl) {
      for (const f of fontsEl.elements ?? []) {
        if (f.name !== "font") continue;
        fonts.push(parseFont(f));
      }
      result.fonts = fonts;
    }
    const fillsEl = findChild(el, "fills");
    if (fillsEl) {
      for (const f of fillsEl.elements ?? []) {
        if (f.name !== "fill") continue;
        fills.push(parseFill(f));
      }
      result.fills = fills;
    }
    const bordersEl = findChild(el, "borders");
    if (bordersEl) {
      for (const b of bordersEl.elements ?? []) {
        if (b.name !== "border") continue;
        borders.push(parseBorder(b));
      }
      result.borders = borders;
    }
    const cellStyleXfsEl = findChild(el, "cellStyleXfs");
    if (cellStyleXfsEl) {
      const xfs = [];
      for (const xf of cellStyleXfsEl.elements ?? []) {
        if (xf.name !== "xf") continue;
        const entry = {};
        const fontId = attrNum(xf, "fontId");
        const fillId = attrNum(xf, "fillId");
        const borderId = attrNum(xf, "borderId");
        const numFmtId = attrNum(xf, "numFmtId");
        if (fontId !== void 0 && fontId < fonts.length) entry.font = fonts[fontId];
        if (fillId !== void 0 && fillId < fills.length) entry.fill = fills[fillId];
        if (borderId !== void 0 && borderId < borders.length) entry.border = borders[borderId];
        if (numFmtId !== void 0) {
          const code = numFmtById.get(numFmtId);
          if (code !== void 0) entry.numFmt = code;
        }
        const alignmentEl = findChild(xf, "alignment");
        if (alignmentEl) entry.alignment = parseAlignment(alignmentEl);
        const protectionEl = findChild(xf, "protection");
        if (protectionEl) entry.protection = parseProtection(protectionEl);
        if (parseOnOff(attr(xf, "applyNumberFormat"))) entry.applyNumberFormat = true;
        if (parseOnOff(attr(xf, "applyFont"))) entry.applyFont = true;
        if (parseOnOff(attr(xf, "applyFill"))) entry.applyFill = true;
        if (parseOnOff(attr(xf, "applyBorder"))) entry.applyBorder = true;
        if (parseOnOff(attr(xf, "applyAlignment"))) entry.applyAlignment = true;
        if (parseOnOff(attr(xf, "applyProtection"))) entry.applyProtection = true;
        if (parseOnOff(attr(xf, "quotePrefix"))) entry.quotePrefix = true;
        if (parseOnOff(attr(xf, "pivotButton"))) entry.pivotButton = true;
        xfs.push(entry);
      }
      result.cellStyleXfs = xfs;
    }
    const cellXfsEl = findChild(el, "cellXfs");
    if (cellXfsEl) {
      const xfs = [];
      for (const xf of cellXfsEl.elements ?? []) {
        if (xf.name !== "xf") continue;
        const fontId = attrNum(xf, "fontId") ?? 0;
        const fillId = attrNum(xf, "fillId") ?? 0;
        const borderId = attrNum(xf, "borderId") ?? 0;
        const numFmtId = attrNum(xf, "numFmtId") ?? 0;
        const alignmentEl = findChild(xf, "alignment");
        const alignment = alignmentEl ? parseAlignment(alignmentEl) : void 0;
        const protectionEl = findChild(xf, "protection");
        const protection = protectionEl ? parseProtection(protectionEl) : void 0;
        const style = {};
        if (fontId > 0) style.fontId = fontId;
        if (fillId > 0) style.fillId = fillId;
        if (borderId > 0) style.borderId = borderId;
        if (numFmtId > 0) style.numFmtId = numFmtId;
        const xfId = attrNum(xf, "xfId");
        if (xfId !== void 0 && xfId > 0) style.xfId = xfId;
        if (alignment) style.alignment = alignment;
        if (protection) style.protection = protection;
        if (parseOnOff(attr(xf, "quotePrefix"))) style.quotePrefix = true;
        if (parseOnOff(attr(xf, "pivotButton"))) style.pivotButton = true;
        if (parseOnOff(attr(xf, "applyFont"))) style.applyFont = true;
        if (parseOnOff(attr(xf, "applyFill"))) style.applyFill = true;
        if (parseOnOff(attr(xf, "applyBorder"))) style.applyBorder = true;
        if (parseOnOff(attr(xf, "applyNumberFormat"))) style.applyNumberFormat = true;
        if (parseOnOff(attr(xf, "applyAlignment"))) style.applyAlignment = true;
        if (parseOnOff(attr(xf, "applyProtection"))) style.applyProtection = true;
        xfs.push(style);
      }
      result.cellXfs = xfs;
    }
    const cellStylesEl = findChild(el, "cellStyles");
    if (cellStylesEl) {
      const styles = [];
      for (const cs of cellStylesEl.elements ?? []) {
        if (cs.name !== "cellStyle") continue;
        const style = {};
        if (attr(cs, "name")) style.name = attr(cs, "name");
        const xfId = attrNum(cs, "xfId");
        if (xfId !== void 0) style.xfId = xfId;
        const builtinId = attrNum(cs, "builtinId");
        if (builtinId !== void 0) style.builtinId = builtinId;
        if (parseOnOff(attr(cs, "customBuiltin"))) style.customBuiltin = true;
        if (parseOnOff(attr(cs, "hidden"))) style.hidden = true;
        const iLevel = attrNum(cs, "iLevel");
        if (iLevel !== void 0) style.iLevel = iLevel;
        styles.push(style);
      }
      result.customCellStyles = styles;
    }
    const dxfsEl = findChild(el, "dxfs");
    if (dxfsEl) {
      const dxfs = [];
      for (const dxf of dxfsEl.elements ?? []) {
        if (dxf.name !== "dxf") continue;
        const d = {};
        const fontEl = findChild(dxf, "font");
        if (fontEl) d.font = parseFont(fontEl);
        const fillEl = findChild(dxf, "fill");
        if (fillEl) d.fill = parseFill(fillEl);
        const borderEl = findChild(dxf, "border");
        if (borderEl) d.border = parseBorder(borderEl);
        const numFmtEl = findChild(dxf, "numFmt");
        if (numFmtEl && attr(numFmtEl, "formatCode")) {
          const nf = { formatCode: attr(numFmtEl, "formatCode") };
          const numFmtId = attrNum(numFmtEl, "numFmtId");
          if (numFmtId !== void 0) nf.numFmtId = numFmtId;
          d.numFmt = nf;
        }
        const alignmentEl = findChild(dxf, "alignment");
        if (alignmentEl) d.alignment = parseAlignment(alignmentEl);
        const protectionEl = findChild(dxf, "protection");
        if (protectionEl) d.protection = parseProtection(protectionEl);
        dxfs.push(d);
      }
      result.dxfs = dxfs;
    }
    const tableStylesEl = findChild(el, "tableStyles");
    if (tableStylesEl?.attributes) {
      const ts = {};
      if (attr(tableStylesEl, "count") !== void 0) ts.count = attrNum(tableStylesEl, "count") ?? 0;
      if (attr(tableStylesEl, "defaultTableStyle")) ts.defaultTableStyle = attr(tableStylesEl, "defaultTableStyle");
      if (attr(tableStylesEl, "defaultPivotStyle")) ts.defaultPivotStyle = attr(tableStylesEl, "defaultPivotStyle");
      const customStyles = [];
      for (const tse of tableStylesEl.elements ?? []) {
        if (tse.name !== "tableStyle") continue;
        const style = {};
        if (attr(tse, "name")) style.name = attr(tse, "name");
        if (parseOnOff(attr(tse, "pivot"))) style.pivot = true;
        const elements = [];
        for (const tsee of tse.elements ?? []) {
          if (tsee.name !== "tableStyleElement") continue;
          const elOpts = {};
          if (attr(tsee, "type")) elOpts.type = attr(tsee, "type");
          const dxfId = attrNum(tsee, "dxfId");
          if (dxfId !== void 0) elOpts.dxfId = dxfId;
          elements.push(elOpts);
        }
        if (elements.length > 0) style.elements = elements;
        customStyles.push(style);
      }
      if (customStyles.length > 0) ts.tableStyles = customStyles;
      result.tableStylesInfo = ts;
    }
    const colorsEl = findChild(el, "colors");
    if (colorsEl) {
      const colors = {};
      const icEl = findChild(colorsEl, "indexedColors");
      if (icEl) {
        const indexed = [];
        for (const rgb of icEl.elements ?? []) if (rgb.name === "rgbColor" && attr(rgb, "rgb")) indexed.push({ rgb: attr(rgb, "rgb") });
        colors.indexedColors = indexed;
      }
      const mruEl = findChild(colorsEl, "mruColors");
      if (mruEl) {
        const mru = [];
        for (const c of mruEl.elements ?? []) if (c.name === "color") {
          const hex = parseColorHex(c);
          if (hex) mru.push(hex);
        }
        colors.mruColors = mru;
      }
      result.colors = colors;
    }
    const extLstEl = findChild(el, "extLst");
    if (extLstEl) {
      const exts = [];
      for (const ext of extLstEl.elements ?? []) {
        if (ext.name !== "ext") continue;
        const uri = attr(ext, "uri");
        if (uri) {
          const content = (ext.elements ?? []).map((e) => stringifyElement(e)).join("");
          const namespaces = {};
          for (const [name, value] of Object.entries(ext.attributes ?? {})) if (name.startsWith("xmlns:") && typeof value === "string") namespaces[name] = value;
          exts.push({
            uri,
            ...Object.keys(namespaces).length > 0 ? { namespaces } : {},
            ...content ? { content } : {}
          });
        }
      }
      result.styleExtensions = exts;
    }
    return result;
  }
};
var FormulaType = {
  NORMAL: "normal",
  ARRAY: "array",
  SHARED: "shared"
};
function stringifyFilterColumn(fc) {
  const fcAttrs = { colId: fc.colId };
  if (fc.hiddenButton) fcAttrs.hiddenButton = 1;
  if (fc.showButton === false) fcAttrs.showButton = 0;
  let inner;
  if (fc.top10) {
    const t10Attrs = { val: fc.top10.val };
    if (fc.top10.top === false) t10Attrs.top = 0;
    if (fc.top10.percent) t10Attrs.percent = 1;
    if (fc.top10.filterVal !== void 0) t10Attrs.filterVal = fc.top10.filterVal;
    inner = `<top10${attrs(t10Attrs)}/>`;
  } else if (fc.customFilters) {
    const cfAttrs = {};
    if (fc.customFilters.and) cfAttrs.and = 1;
    const entries = fc.customFilters.entries.map((e) => {
      const eAttrs = { val: e.val };
      if (e.operator) eAttrs.operator = e.operator;
      return selfCloseElement("customFilter", attrs(eAttrs));
    }).join("");
    inner = `<customFilters${attrs(cfAttrs)}>${entries}</customFilters>`;
  } else if (fc.filters) {
    const filtersAttrs = {};
    if (fc.filters.blank) filtersAttrs.blank = 1;
    if (fc.filters.calendarType) filtersAttrs.calendarType = fc.filters.calendarType;
    const valParts = (fc.filters.values ?? []).map((v) => `<filter val="${escapeXml(v)}"/>`);
    const dgParts = (fc.filters.dateGroupItems ?? []).map((dg) => {
      const dgAttrs = { dateTimeGrouping: dg.dateTimeGrouping };
      if (dg.year !== void 0) dgAttrs.year = dg.year;
      if (dg.month !== void 0) dgAttrs.month = dg.month;
      if (dg.day !== void 0) dgAttrs.day = dg.day;
      if (dg.hour !== void 0) dgAttrs.hour = dg.hour;
      if (dg.minute !== void 0) dgAttrs.minute = dg.minute;
      if (dg.second !== void 0) dgAttrs.second = dg.second;
      return `<dateGroupItem${attrs(dgAttrs)}/>`;
    });
    inner = `<filters${attrs(filtersAttrs)}>${valParts.join("")}${dgParts.join("")}</filters>`;
  } else if (fc.colorFilter) {
    const cfAttrs = {};
    if (fc.colorFilter.dxfId !== void 0) cfAttrs.dxfId = fc.colorFilter.dxfId;
    if (fc.colorFilter.cellColor === false) cfAttrs.cellColor = 0;
    inner = `<colorFilter${attrs(cfAttrs)}/>`;
  } else if (fc.iconFilter) {
    const ifAttrs = { iconSet: fc.iconFilter.iconSet };
    if (fc.iconFilter.iconId !== void 0) ifAttrs.iconId = fc.iconFilter.iconId;
    inner = `<iconFilter${attrs(ifAttrs)}/>`;
  } else if (fc.dynamicFilter) {
    const df = fc.dynamicFilter;
    const dfAttrs = { type: df.type };
    if (df.val !== void 0) dfAttrs.val = df.val;
    if (df.maxVal !== void 0) dfAttrs.maxVal = df.maxVal;
    if (df.valIso !== void 0) dfAttrs.valIso = df.valIso;
    if (df.maxValIso !== void 0) dfAttrs.maxValIso = df.maxValIso;
    inner = `<dynamicFilter${attrs(dfAttrs)}/>`;
  } else inner = "";
  if (inner) return `<filterColumn${attrs(fcAttrs)}>${inner}</filterColumn>`;
  return selfCloseElement("filterColumn", attrs(fcAttrs));
}
function stringifySortStateXml(ss) {
  const ssAttrs = { ref: ss.ref };
  if (ss.columnSort) ssAttrs.columnSort = 1;
  if (ss.caseSensitive) ssAttrs.caseSensitive = 1;
  if (ss.sortMethod && ss.sortMethod !== "none") ssAttrs.sortMethod = ss.sortMethod;
  const sortParts = ss.conditions.map((sc) => {
    const scAttrs = { ref: sc.ref };
    if (sc.descending) scAttrs.descending = 1;
    if (sc.sortBy && sc.sortBy !== "value") scAttrs.sortBy = sc.sortBy;
    if (sc.customList) scAttrs.customList = sc.customList;
    if (sc.dxfId !== void 0) scAttrs.dxfId = sc.dxfId;
    if (sc.iconSet && sc.iconSet !== "3Arrows") scAttrs.iconSet = sc.iconSet;
    if (sc.iconId !== void 0) scAttrs.iconId = sc.iconId;
    return selfCloseElement("sortCondition", attrs(scAttrs));
  });
  return `<sortState${attrs(ssAttrs)}>${sortParts.join("")}</sortState>`;
}
function parseSortStateEl(el) {
  const ss = {
    ref: attr(el, "ref") ?? "",
    conditions: []
  };
  if (parseOnOff(attr(el, "columnSort"))) ss.columnSort = true;
  if (parseOnOff(attr(el, "caseSensitive"))) ss.caseSensitive = true;
  const sm = attr(el, "sortMethod");
  if (sm) ss.sortMethod = sm;
  for (const sc of el.elements ?? []) {
    if (sc.name !== "sortCondition") continue;
    const cond = { ref: attr(sc, "ref") ?? "" };
    if (parseOnOff(attr(sc, "descending"))) cond.descending = true;
    const sb = attr(sc, "sortBy");
    if (sb) cond.sortBy = sb;
    const cl = attr(sc, "customList");
    if (cl) cond.customList = cl;
    const dxfId = attrNum(sc, "dxfId");
    if (dxfId !== void 0) cond.dxfId = dxfId;
    const is = attr(sc, "iconSet");
    if (is) cond.iconSet = is;
    const ii = attrNum(sc, "iconId");
    if (ii !== void 0) cond.iconId = ii;
    ss.conditions.push(cond);
  }
  return ss;
}
function stringifyAutoFilter(af) {
  if (af === void 0) return "";
  if (typeof af === "string") return selfCloseElement("autoFilter", attrs({ ref: af }));
  const inner = [];
  for (const fc of af.columns ?? []) inner.push(stringifyFilterColumn(fc));
  if (af.sortState) inner.push(stringifySortStateXml(af.sortState));
  if (inner.length > 0) return `<autoFilter ref="${escapeXml(af.ref)}">${inner.join("")}</autoFilter>`;
  return selfCloseElement("autoFilter", attrs({ ref: af.ref }));
}
function parseFiltersEl(fc) {
  const fi = {};
  if (parseOnOff(attr(fc, "blank"))) fi.blank = true;
  const cal = attr(fc, "calendarType");
  if (cal) fi.calendarType = cal;
  const values = [];
  const dateGroupItems = [];
  for (const f of fc.elements ?? []) if (f.name === "filter") {
    const v = attr(f, "val");
    if (v !== void 0) values.push(v);
  } else if (f.name === "dateGroupItem") {
    const dg = { dateTimeGrouping: attr(f, "dateTimeGrouping") };
    const y = attrNum(f, "year");
    if (y !== void 0) dg.year = y;
    const mo = attrNum(f, "month");
    if (mo !== void 0) dg.month = mo;
    const d = attrNum(f, "day");
    if (d !== void 0) dg.day = d;
    const h = attrNum(f, "hour");
    if (h !== void 0) dg.hour = h;
    const mi = attrNum(f, "minute");
    if (mi !== void 0) dg.minute = mi;
    const s = attrNum(f, "second");
    if (s !== void 0) dg.second = s;
    dateGroupItems.push(dg);
  }
  if (values.length > 0) fi.values = values;
  if (dateGroupItems.length > 0) fi.dateGroupItems = dateGroupItems;
  return fi;
}
function parseAutoFilter(afEl) {
  const af = { ref: attr(afEl, "ref") ?? "" };
  for (const child of afEl.elements ?? []) if (child.name === "filterColumn") {
    const fc = { colId: attrNum(child, "colId") ?? 0 };
    if (parseOnOff(attr(child, "hiddenButton"))) fc.hiddenButton = true;
    if (String(attr(child, "showButton")) === "0") fc.showButton = false;
    for (const el of child.elements ?? []) if (el.name === "top10") {
      const t = { val: attrNum(el, "val") ?? 0 };
      if (String(attr(el, "top")) === "0") t.top = false;
      if (parseOnOff(attr(el, "percent"))) t.percent = true;
      const fv = attrNum(el, "filterVal");
      if (fv !== void 0) t.filterVal = fv;
      fc.top10 = t;
    } else if (el.name === "customFilters") {
      const cf = { entries: [] };
      if (parseOnOff(attr(el, "and"))) cf.and = true;
      for (const entry of el.elements ?? []) {
        if (entry.name !== "customFilter") continue;
        const op = attr(entry, "operator");
        const v = attr(entry, "val");
        cf.entries.push({
          ...op ? { operator: op } : {},
          val: v ?? ""
        });
      }
      fc.customFilters = cf;
    } else if (el.name === "filters") fc.filters = parseFiltersEl(el);
    else if (el.name === "colorFilter") {
      const colorFilter = {};
      const dxfId = attrNum(el, "dxfId");
      if (dxfId !== void 0) colorFilter.dxfId = dxfId;
      if (String(attr(el, "cellColor")) === "0") colorFilter.cellColor = false;
      fc.colorFilter = colorFilter;
    } else if (el.name === "iconFilter") {
      const iconFilter = { iconSet: attr(el, "iconSet") ?? "3Arrows" };
      const iconId = attrNum(el, "iconId");
      if (iconId !== void 0) iconFilter.iconId = iconId;
      fc.iconFilter = iconFilter;
    } else if (el.name === "dynamicFilter") {
      const df = { type: attr(el, "type") };
      const v = attrNum(el, "val");
      if (v !== void 0) df.val = v;
      const mv = attrNum(el, "maxVal");
      if (mv !== void 0) df.maxVal = mv;
      const vi = attr(el, "valIso");
      if (vi) df.valIso = vi;
      const mvi = attr(el, "maxValIso");
      if (mvi) df.maxValIso = mvi;
      fc.dynamicFilter = df;
    }
    (af.columns ??= []).push(fc);
  } else if (child.name === "sortState") af.sortState = parseSortStateEl(child);
  return af.columns !== void 0 || af.sortState !== void 0 ? af : af.ref;
}
function parsePivotArea(el) {
  const result = {};
  const field = attrNum(el, "field");
  if (field !== void 0) result.field = field;
  const typeVal = attr(el, "type");
  if (typeVal) result.type = typeVal;
  if (String(attr(el, "dataOnly")) === "0") result.dataOnly = false;
  if (parseOnOff(attr(el, "labelOnly"))) result.labelOnly = true;
  if (parseOnOff(attr(el, "grandRow"))) result.grandRow = true;
  if (parseOnOff(attr(el, "grandCol"))) result.grandCol = true;
  if (parseOnOff(attr(el, "cacheIndex"))) result.cacheIndex = true;
  if (String(attr(el, "outline")) === "0") result.outline = false;
  if (attr(el, "offset")) result.offset = attr(el, "offset");
  if (parseOnOff(attr(el, "collapsedLevelsAreSubtotals"))) result.collapsedLevelsAreSubtotals = true;
  const axisVal = attr(el, "axis");
  if (axisVal) result.axis = axisVal;
  const fp = attrNum(el, "fieldPosition");
  if (fp !== void 0) result.fieldPosition = fp;
  const refsEl = findChild(el, "references");
  if (refsEl) {
    const refs = [];
    for (const rEl of refsEl.elements ?? []) {
      if (rEl.name !== "reference") continue;
      const ref = {};
      const rField = attrNum(rEl, "field");
      if (rField !== void 0) ref.field = rField;
      const rCount = attrNum(rEl, "count");
      if (rCount !== void 0) ref.count = rCount;
      if (String(attr(rEl, "selected")) === "0") ref.selected = false;
      if (parseOnOff(attr(rEl, "byPosition"))) ref.byPosition = true;
      if (parseOnOff(attr(rEl, "relative"))) ref.relative = true;
      if (parseOnOff(attr(rEl, "defaultSubtotal"))) ref.defaultSubtotal = true;
      if (parseOnOff(attr(rEl, "sumSubtotal"))) ref.sumSubtotal = true;
      if (parseOnOff(attr(rEl, "avgSubtotal"))) ref.avgSubtotal = true;
      if (parseOnOff(attr(rEl, "countASubtotal"))) ref.countASubtotal = true;
      if (parseOnOff(attr(rEl, "maxSubtotal"))) ref.maxSubtotal = true;
      if (parseOnOff(attr(rEl, "minSubtotal"))) ref.minSubtotal = true;
      const xArr = [];
      for (const xEl of rEl.elements ?? []) if (xEl.name === "x") {
        const v = attrNum(xEl, "v");
        if (v !== void 0) xArr.push(v);
      }
      if (xArr.length > 0) ref.x = xArr;
      refs.push(ref);
    }
    result.references = refs;
  }
  return result;
}
function parseCfColor(el) {
  const result = {};
  const rgb = attr(el, "rgb");
  if (rgb) result.rgb = rgb.length === 8 ? rgb.slice(2) : rgb;
  const theme = attrNum(el, "theme");
  if (theme !== void 0) {
    result.theme = theme;
    const tint = attrNum(el, "tint");
    if (tint !== void 0) result.tint = tint;
  }
  const indexed = attrNum(el, "indexed");
  if (indexed !== void 0) result.indexed = indexed;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parsePageBreaks(el) {
  const breaks = [];
  for (const brkEl of el.elements ?? []) {
    if (brkEl.name !== "brk") continue;
    const id = attrNum(brkEl, "id");
    if (id === void 0) continue;
    const b = { id };
    const min = attrNum(brkEl, "min");
    if (min !== void 0) b.min = min;
    const max2 = attrNum(brkEl, "max");
    if (max2 !== void 0) b.max = max2;
    if (parseOnOff(attr(brkEl, "man"))) b.manual = true;
    if (parseOnOff(attr(brkEl, "pt"))) b.pivot = true;
    breaks.push(b);
  }
  return breaks;
}
function parseCfvo(el) {
  const result = { type: attr(el, "type") ?? "num" };
  const val = attr(el, "val");
  if (val !== void 0) result.val = isNaN(Number(val)) ? val : Number(val);
  if (String(attr(el, "gte")) === "0") result.gte = false;
  return result;
}
function indexOfTag(src, name, from2, limit) {
  const open = `<${name}`;
  const nameLen = name.length;
  let p = from2;
  for (; ; ) {
    const idx = src.indexOf(open, p);
    if (idx === -1 || idx >= limit) return -1;
    const after = src.charCodeAt(idx + 1 + nameLen);
    if (after === 32 || after === 9 || after === 10 || after === 13 || after === 47 || after === 62) return idx;
    p = idx + 1 + nameLen;
  }
}
function findTagEnd(src, from2) {
  let i = from2;
  const len = src.length;
  while (i < len) {
    const c = src.charCodeAt(i);
    if (c === 34) {
      const close = src.indexOf('"', i + 1);
      if (close === -1) return -1;
      i = close + 1;
      continue;
    }
    if (c === 62) return i;
    i++;
  }
  return -1;
}
function scanAttrs(src, from2, to, visit) {
  let i = from2;
  while (i < to) {
    while (i < to) {
      const c = src.charCodeAt(i);
      if (c !== 32 && c !== 9 && c !== 10 && c !== 13) break;
      i++;
    }
    if (i >= to) return;
    const nameStart = i;
    while (i < to && src.charCodeAt(i) !== 61) i++;
    if (i >= to) return;
    const name = src.slice(nameStart, i);
    i++;
    while (i < to) {
      const c = src.charCodeAt(i);
      if (c !== 32 && c !== 9 && c !== 10 && c !== 13) break;
      i++;
    }
    const quote = src.charCodeAt(i);
    if (quote !== 34 && quote !== 39) return;
    i++;
    const valueStart = i;
    while (i < to && src.charCodeAt(i) !== quote) i++;
    visit(name, unescapeXml(src.slice(valueStart, i)));
    i++;
  }
}
function isOn(value) {
  const lower = value.length <= 5 ? value.toLowerCase() : value;
  return lower === "1" || lower === "true" || lower === "on";
}
function textContent(src, from2, to) {
  if (to <= from2) return "";
  let text = src.slice(from2, to);
  if (text.indexOf("<![CDATA[") !== -1) text = text.replace(/<!\[CDATA\[.*?\]\]>/gs, "");
  return unescapeXml(text);
}
function inlineStringText(src, from2, to) {
  let q = from2;
  while (q < to) {
    const lt = src.indexOf("<", q);
    if (lt === -1 || lt >= to) break;
    const tEnd = findTagEnd(src, lt + 1);
    if (tEnd === -1 || tEnd >= to) break;
    const afterLt = lt + 1;
    let nameEnd = afterLt;
    while (nameEnd < tEnd) {
      const c = src.charCodeAt(nameEnd);
      if (c === 32 || c === 9 || c === 10 || c === 13 || c === 47) break;
      nameEnd++;
    }
    const name = src.slice(afterLt, nameEnd);
    if (name === "t") {
      if (src.charCodeAt(tEnd - 1) === 47) return "";
      const close = src.indexOf("</t>", tEnd + 1);
      return close === -1 ? "" : textContent(src, tEnd + 1, close);
    }
    if (name === "r") {
      const close = src.indexOf("</r>", tEnd + 1);
      if (close === -1) break;
      q = close + 4;
      continue;
    }
    q = tEnd + 1;
  }
}
function parseSheetDataRows(raw, strings) {
  const rows = [];
  const len = raw.length;
  let pos = 0;
  for (; ; ) {
    const rowOpen = indexOfTag(raw, "row", pos, len);
    if (rowOpen === -1) break;
    const tagEnd = findTagEnd(raw, rowOpen + 4);
    if (tagEnd === -1) break;
    const selfClosing = raw.charCodeAt(tagEnd - 1) === 47;
    const attrEnd = selfClosing ? tagEnd - 1 : tagEnd;
    const row = {};
    let rowClose = tagEnd;
    let rowStyleIdx;
    scanAttrs(raw, rowOpen + 4, attrEnd, (name, value) => {
      switch (name) {
        case "r": {
          const n = Number(value);
          if (!isNaN(n)) row.rowNumber = n;
          break;
        }
        case "ht": {
          const n = Number(value);
          if (!isNaN(n)) row.height = n;
          break;
        }
        case "hidden":
          if (isOn(value)) row.hidden = true;
          break;
        case "spans":
          row.spans = value;
          break;
        case "customFormat":
          if (isOn(value)) row.customFormat = true;
          break;
        case "thickTop":
          if (isOn(value)) row.thickTop = true;
          break;
        case "thickBot":
          if (isOn(value)) row.thickBot = true;
          break;
        case "ph":
          if (isOn(value)) row.phonetic = true;
          break;
        case "outlineLevel": {
          const n = Number(value);
          if (!isNaN(n)) row.outlineLevel = n;
          break;
        }
        case "collapsed":
          if (isOn(value)) row.collapsed = true;
          break;
        case "s": {
          const n = Number(value);
          if (!isNaN(n)) rowStyleIdx = n;
          break;
        }
      }
    });
    if (rowStyleIdx !== void 0) row.style = rowStyleIdx;
    const cells = [];
    if (!selfClosing) {
      rowClose = raw.indexOf("</row>", tagEnd + 1);
      if (rowClose === -1) break;
      let cp = tagEnd + 1;
      for (; ; ) {
        const cellOpen = indexOfTag(raw, "c", cp, rowClose);
        if (cellOpen === -1) break;
        const cellTagEnd = findTagEnd(raw, cellOpen + 2);
        if (cellTagEnd === -1) break;
        const cellSelfClosing = raw.charCodeAt(cellTagEnd - 1) === 47;
        const cell = {};
        let type;
        let styleIdx;
        let ap = cellOpen + 2;
        const attrLimit = cellSelfClosing ? cellTagEnd - 1 : cellTagEnd;
        while (ap < attrLimit) {
          while (ap < attrLimit) {
            const c = raw.charCodeAt(ap);
            if (c !== 32 && c !== 9 && c !== 10 && c !== 13) break;
            ap++;
          }
          if (ap >= attrLimit) break;
          const aNameStart = ap;
          while (ap < attrLimit && raw.charCodeAt(ap) !== 61) ap++;
          if (ap >= attrLimit) break;
          const aNameLen = ap - aNameStart;
          ap++;
          while (ap < attrLimit) {
            const c = raw.charCodeAt(ap);
            if (c !== 32 && c !== 9 && c !== 10 && c !== 13) break;
            ap++;
          }
          const aQuote = raw.charCodeAt(ap);
          if (aQuote !== 34 && aQuote !== 39) break;
          ap++;
          const aValueStart = ap;
          while (ap < attrLimit && raw.charCodeAt(ap) !== aQuote) ap++;
          const aFirst = raw.charCodeAt(aNameStart);
          if (aNameLen === 1) {
            if (aFirst === 114) cell.reference = unescapeXml(raw.slice(aValueStart, ap));
            else if (aFirst === 116) type = unescapeXml(raw.slice(aValueStart, ap));
            else if (aFirst === 115) {
              const n = Number(unescapeXml(raw.slice(aValueStart, ap)));
              if (!isNaN(n)) styleIdx = n;
            }
          } else if (aNameLen === 2 && aFirst === 99) {
            const n = Number(unescapeXml(raw.slice(aValueStart, ap)));
            if (!isNaN(n)) cell.cellMetadataId = n;
          } else if (aNameLen === 2 && aFirst === 118) {
            const n = Number(unescapeXml(raw.slice(aValueStart, ap)));
            if (!isNaN(n)) cell.valueMetadataId = n;
          }
          ap++;
        }
        if (styleIdx !== void 0) cell.style = styleIdx;
        let cellEnd = cellTagEnd + 1;
        if (!cellSelfClosing) {
          const cellClose = raw.indexOf("</c>", cellTagEnd + 1);
          if (cellClose === -1) break;
          cellEnd = cellClose + 4;
          let vText;
          let vNum;
          let inlineText;
          let hasInline = false;
          let formula;
          let p = cellTagEnd + 1;
          while (p < cellClose) {
            const lt = raw.indexOf("<", p);
            if (lt === -1 || lt >= cellClose) break;
            const tEnd = findTagEnd(raw, lt + 1);
            if (tEnd === -1) break;
            let nameEnd = lt + 2;
            while (nameEnd < tEnd) {
              const c = raw.charCodeAt(nameEnd);
              if (c === 32 || c === 9 || c === 10 || c === 13 || c === 47) break;
              nameEnd++;
            }
            const nameLen = nameEnd - (lt + 1);
            const first = raw.charCodeAt(lt + 1);
            if (nameLen === 1 && first === 118) {
              if (raw.charCodeAt(tEnd - 1) === 47) {
                if (vText === void 0) vText = "";
              } else {
                const close = raw.indexOf("</v>", tEnd + 1);
                if (close === -1) break;
                if (vText === void 0 && vNum === void 0) {
                  const vStart = tEnd + 1;
                  const vLen = close - vStart;
                  let n = 0;
                  let allDigits = vLen > 0 && vLen <= 15;
                  if (allDigits) for (let q = vStart; q < close; q++) {
                    const d = raw.charCodeAt(q) - 48;
                    if (d < 0 || d > 9) {
                      allDigits = false;
                      break;
                    }
                    n = n * 10 + d;
                  }
                  if (allDigits) vNum = n;
                  else vText = textContent(raw, vStart, close);
                }
                p = close + 4;
                continue;
              }
            } else if (nameLen === 2 && first === 105) {
              hasInline = true;
              const close = raw.indexOf("</is>", tEnd + 1);
              const isEnd = close === -1 ? cellClose : close;
              if (inlineText === void 0) inlineText = inlineStringText(raw, tEnd + 1, isEnd);
              if (close === -1) break;
              p = close + 5;
              continue;
            } else if (nameLen === 1 && first === 102) {
              const fSelfClosing = raw.charCodeAt(tEnd - 1) === 47;
              const f = { formula: "" };
              scanAttrs(raw, nameEnd, fSelfClosing ? tEnd - 1 : tEnd, (n3, v3) => {
                switch (n3) {
                  case "t":
                    if (v3 !== "normal") f.type = v3;
                    break;
                  case "ref":
                    f.reference = v3;
                    break;
                  case "si": {
                    const n = Number(v3);
                    if (!isNaN(n)) f.sharedIndex = n;
                    break;
                  }
                  case "aca":
                    if (isOn(v3)) f.aca = true;
                    break;
                  case "ca":
                    if (isOn(v3)) f.calculateCell = true;
                    break;
                  case "bx":
                    if (isOn(v3)) f.arrayContext = true;
                }
              });
              if (fSelfClosing) p = tEnd + 1;
              else {
                const close = raw.indexOf("</f>", tEnd + 1);
                if (close === -1) break;
                f.formula = textContent(raw, tEnd + 1, close);
                p = close + 4;
              }
              if (formula === void 0) formula = f;
              continue;
            }
            p = tEnd + 1;
          }
          if (type === "s" && (vText !== void 0 || vNum !== void 0)) cell.value = strings[vNum !== void 0 ? vNum : parseInt(vText, 10)] ?? "";
          else if (type === "b" && (vText !== void 0 || vNum !== void 0)) cell.value = vNum !== void 0 ? vNum === 1 : vText === "1";
          else if (type === "e" && (vText !== void 0 || vNum !== void 0)) cell.error = vNum !== void 0 ? String(vNum) : vText;
          else if (type === "inlineStr" && hasInline) cell.value = inlineText ?? "";
          else if (vNum !== void 0) cell.value = vNum;
          else if (vText !== void 0) {
            const num = Number(vText);
            cell.value = isNaN(num) ? vText : num;
          }
          if (formula !== void 0) cell.formula = formula;
        }
        cells.push(cell);
        cp = cellEnd;
      }
    }
    row.cells = cells;
    rows.push(row);
    pos = selfClosing ? tagEnd + 1 : rowClose + 6;
  }
  return rows;
}
var DRAWING_HF_OFFSET_KEYS = [
  "lho",
  "lhe",
  "lhf",
  "cho",
  "che",
  "chf",
  "rho",
  "rhe",
  "rhf",
  "lfo",
  "lfe",
  "lff",
  "cfo",
  "cfe",
  "cff",
  "rfo",
  "rfe",
  "rff"
];
var worksheetDesc = {
  kind: "custom",
  /**
  * NOT intended for direct use by the compiler.
  * The compiler calls `stringifyWorksheet(opts, ctx)` instead, which has
  * access to the SharedStrings and Styles accumulators.
  * This method exists to satisfy the CustomDescriptor interface for the read path.
  */
  stringify(_opts, _ctx) {
    throw new Error("Use stringifyWorksheet(opts, ctx) for the write path. worksheetDesc.stringify() is not supported.");
  },
  parse(el, ctx) {
    const result = {};
    let pageSetUpPrCache;
    const strings = ctx && "sharedStrings" in ctx ? ctx.sharedStrings : [];
    const sheetPrEl = findChild(el, "sheetPr");
    if (sheetPrEl) {
      const sp = {};
      if (attr(sheetPrEl, "codeName")) sp.codeName = attr(sheetPrEl, "codeName");
      if (parseOnOff(attr(sheetPrEl, "syncHorizontal"))) sp.syncHorizontal = true;
      if (parseOnOff(attr(sheetPrEl, "syncVertical"))) sp.syncVertical = true;
      if (attr(sheetPrEl, "syncRef")) sp.syncRef = attr(sheetPrEl, "syncRef");
      if (parseOnOff(attr(sheetPrEl, "transitionEvaluation"))) sp.transitionEvaluation = true;
      if (parseOnOff(attr(sheetPrEl, "transitionEntry"))) sp.transitionEntry = true;
      if (String(attr(sheetPrEl, "published")) === "0") sp.published = false;
      if (parseOnOff(attr(sheetPrEl, "filterMode"))) sp.filterMode = true;
      if (String(attr(sheetPrEl, "enableFormatConditionsCalculation")) === "0") sp.enableFormatConditionsCalculation = false;
      const outlinePr = findChild(sheetPrEl, "outlinePr");
      if (outlinePr) {
        if (parseOnOff(attr(outlinePr, "applyStyles"))) sp.outlineApplyStyles = true;
        if (String(attr(outlinePr, "showOutlineSymbols")) === "0") sp.outlineShowSymbols = false;
        if (String(attr(outlinePr, "summaryBelow")) === "0") sp.outlineSummaryBelow = false;
        if (String(attr(outlinePr, "summaryRight")) === "0") sp.outlineSummaryRight = false;
      }
      const pageSetUpPr = findChild(sheetPrEl, "pageSetUpPr");
      if (pageSetUpPr) {
        const psup = {};
        if (attr(pageSetUpPr, "fitToPage") !== void 0) psup.fitToPage = parseOnOff(attr(pageSetUpPr, "fitToPage")) ?? false;
        if (attr(pageSetUpPr, "autoPageBreaks") !== void 0) psup.autoPageBreaks = parseOnOff(attr(pageSetUpPr, "autoPageBreaks")) ?? true;
        if (Object.keys(psup).length > 0) pageSetUpPrCache = psup;
      }
      if (Object.keys(sp).length > 0) result.sheetPr = sp;
      const tabColorEl = findChild(sheetPrEl, "tabColor");
      if (tabColorEl) {
        const tc = {};
        if (attr(tabColorEl, "rgb")) tc.rgb = attr(tabColorEl, "rgb");
        if (attrNum(tabColorEl, "theme") !== void 0) tc.theme = attrNum(tabColorEl, "theme");
        if (attrNum(tabColorEl, "tint") !== void 0) tc.tint = attrNum(tabColorEl, "tint");
        if (attrNum(tabColorEl, "indexed") !== void 0) tc.indexed = attrNum(tabColorEl, "indexed");
        result.tabColor = tc;
      }
    }
    const sheetViewsEl = findChild(el, "sheetViews");
    if (sheetViewsEl) {
      const svEl = findChild(sheetViewsEl, "sheetView");
      if (svEl) {
        const sv = {};
        if (String(attr(svEl, "showGridLines")) === "0") sv.showGridLines = false;
        if (String(attr(svEl, "showRowColHeaders")) === "0") sv.showRowColHeaders = false;
        if (String(attr(svEl, "showZeros")) === "0") sv.showZeros = false;
        const zs = attrNum(svEl, "zoomScale");
        if (zs !== void 0) sv.zoomScale = zs;
        if (attr(svEl, "tabSelected") !== void 0) sv.tabSelected = parseOnOff(attr(svEl, "tabSelected")) ?? true;
        if (parseOnOff(attr(svEl, "rightToLeft"))) sv.rightToLeft = true;
        if (parseOnOff(attr(svEl, "windowProtection"))) sv.windowProtection = true;
        if (parseOnOff(attr(svEl, "showFormulas"))) sv.showFormulas = true;
        if (String(attr(svEl, "showRuler")) === "0") sv.showRuler = false;
        if (String(attr(svEl, "showOutlineSymbols")) === "0") sv.showOutlineSymbols = false;
        if (String(attr(svEl, "defaultGridColor")) === "0") sv.defaultGridColor = false;
        if (String(attr(svEl, "showWhiteSpace")) === "0") sv.showWhiteSpace = false;
        const viewVal = attr(svEl, "view");
        if (viewVal) sv.view = viewVal;
        const topLeftCell = attr(svEl, "topLeftCell");
        if (topLeftCell) sv.topLeftCell = topLeftCell;
        const colorId = attrNum(svEl, "colorId");
        if (colorId !== void 0) sv.colorId = colorId;
        const zsn = attrNum(svEl, "zoomScaleNormal");
        if (zsn !== void 0) sv.zoomScaleNormal = zsn;
        const zssl = attrNum(svEl, "zoomScaleSheetLayoutView");
        if (zssl !== void 0) sv.zoomScaleSheetLayoutView = zssl;
        const zspl = attrNum(svEl, "zoomScalePageLayoutView");
        if (zspl !== void 0) sv.zoomScalePageLayoutView = zspl;
        result.sheetView = sv;
        const paneEl = findChild(svEl, "pane");
        if (paneEl) {
          const fp = {};
          const ys = attrNum(paneEl, "ySplit");
          if (ys && ys > 0) fp.row = ys;
          const xs = attrNum(paneEl, "xSplit");
          if (xs && xs > 0) fp.col = xs;
          if (attr(paneEl, "state") === "split") fp.split = true;
          const paneTopLeft = attr(paneEl, "topLeftCell");
          if (paneTopLeft) fp.topLeftCell = paneTopLeft;
          const activePane = attr(paneEl, "activePane");
          if (activePane) fp.activePane = activePane;
          if (Object.keys(fp).length > 0) result.freezePanes = fp;
        }
        const selections = [];
        for (const selEl of svEl.elements ?? []) {
          if (selEl.name !== "selection") continue;
          const sel = {};
          const pane = attr(selEl, "pane");
          if (pane) sel.pane = pane;
          const activeCell = attr(selEl, "activeCell");
          if (activeCell) sel.activeCell = activeCell;
          const acId = attrNum(selEl, "activeCellId");
          if (acId !== void 0) sel.activeCellId = acId;
          const sqref = attr(selEl, "sqref");
          if (sqref) sel.sqref = sqref;
          selections.push(sel);
        }
        if (selections.length > 0) result.selection = selections;
        const psEl2 = findChild(svEl, "pivotSelection");
        if (psEl2) {
          const ps = {};
          const pane = attr(psEl2, "pane");
          if (pane) ps.pane = pane;
          if (parseOnOff(attr(psEl2, "showHeader"))) ps.showHeader = true;
          if (parseOnOff(attr(psEl2, "label"))) ps.label = true;
          if (parseOnOff(attr(psEl2, "data"))) ps.data = true;
          if (parseOnOff(attr(psEl2, "extendable"))) ps.extendable = true;
          const count = attrNum(psEl2, "count");
          if (count !== void 0) ps.count = count;
          const axis = attr(psEl2, "axis");
          if (axis) ps.axis = axis;
          for (const key of [
            "dimension",
            "start",
            "min",
            "max",
            "activeRow",
            "activeCol",
            "previousRow",
            "previousCol",
            "click"
          ]) {
            const v = attrNum(psEl2, key);
            if (v !== void 0) ps[key] = v;
          }
          const rId = attr(psEl2, "r:id");
          if (rId) ps.rId = rId;
          const paEl = findChild(psEl2, "pivotArea");
          if (paEl) ps.pivotArea = parsePivotArea(paEl);
          result.pivotSelection = ps;
        }
      }
    }
    const sfpEl = findChild(el, "sheetFormatPr");
    if (sfpEl) {
      const sfp = {};
      const bcw = attrNum(sfpEl, "baseColWidth");
      if (bcw !== void 0) sfp.baseColWidth = bcw;
      const dcw = attrNum(sfpEl, "defaultColWidth");
      if (dcw !== void 0) sfp.defaultColWidth = dcw;
      const drh = attrNum(sfpEl, "defaultRowHeight");
      if (drh !== void 0) sfp.defaultRowHeight = drh;
      if (parseOnOff(attr(sfpEl, "zeroHeight"))) sfp.zeroHeight = true;
      if (parseOnOff(attr(sfpEl, "thickTop"))) sfp.thickTop = true;
      if (parseOnOff(attr(sfpEl, "thickBottom"))) sfp.thickBottom = true;
      const olr = attrNum(sfpEl, "outlineLevelRow");
      if (olr !== void 0) sfp.outlineLevelRow = olr;
      const olc = attrNum(sfpEl, "outlineLevelCol");
      if (olc !== void 0) sfp.outlineLevelCol = olc;
      result.sheetFormatPr = sfp;
    }
    const dimensionEl = findChild(el, "dimension");
    if (dimensionEl) {
      const ref = attr(dimensionEl, "ref");
      if (ref) result.dimension = ref;
    }
    const pageMarginsEl = findChild(el, "pageMargins");
    if (pageMarginsEl) {
      const pm = {};
      const pmL = attrNum(pageMarginsEl, "left");
      if (pmL !== void 0) pm.left = pmL;
      const pmR = attrNum(pageMarginsEl, "right");
      if (pmR !== void 0) pm.right = pmR;
      const pmT = attrNum(pageMarginsEl, "top");
      if (pmT !== void 0) pm.top = pmT;
      const pmB = attrNum(pageMarginsEl, "bottom");
      if (pmB !== void 0) pm.bottom = pmB;
      const pmH = attrNum(pageMarginsEl, "header");
      if (pmH !== void 0) pm.header = pmH;
      const pmF = attrNum(pageMarginsEl, "footer");
      if (pmF !== void 0) pm.footer = pmF;
      result.pageMargins = pm;
    }
    const colsEl = findChild(el, "cols");
    if (colsEl) {
      const columns = [];
      for (const colEl of colsEl.elements ?? []) {
        if (colEl.name !== "col") continue;
        const col = {
          min: attrNum(colEl, "min") ?? 0,
          max: attrNum(colEl, "max") ?? 0
        };
        const w = attrNum(colEl, "width");
        if (w !== void 0) col.width = w;
        if (parseOnOff(attr(colEl, "hidden"))) col.hidden = true;
        if (parseOnOff(attr(colEl, "customWidth"))) col.customWidth = true;
        const ol = attrNum(colEl, "outlineLevel");
        if (ol !== void 0) col.outlineLevel = ol;
        if (parseOnOff(attr(colEl, "collapsed"))) col.collapsed = true;
        if (parseOnOff(attr(colEl, "bestFit"))) col.bestFit = true;
        if (parseOnOff(attr(colEl, "phonetic"))) col.phonetic = true;
        columns.push(col);
      }
      if (columns.length > 0) result.columns = columns;
    }
    const protEl = findChild(el, "sheetProtection");
    if (protEl?.attributes) result.protection = parseSheetProtectionEl(protEl);
    const prEl = findChild(el, "protectedRanges");
    if (prEl) {
      const ranges = [];
      for (const rEl of prEl.elements ?? []) {
        if (rEl.name !== "protectedRange") continue;
        const r = {
          sqref: attr(rEl, "sqref") ?? "",
          name: attr(rEl, "name") ?? ""
        };
        if (attr(rEl, "algorithmName")) r.algorithmName = attr(rEl, "algorithmName");
        if (attr(rEl, "hashValue")) r.hashValue = attr(rEl, "hashValue");
        if (attr(rEl, "saltValue")) r.saltValue = attr(rEl, "saltValue");
        const spinCount = attrNum(rEl, "spinCount");
        if (spinCount !== void 0) r.spinCount = spinCount;
        const sdAttr = attr(rEl, "securityDescriptor");
        if (sdAttr !== void 0) r.securityDescriptor = sdAttr;
        const sdEl = findChild(rEl, "securityDescriptor");
        if (sdEl) r.securityDescriptor = textOf(sdEl) ?? void 0;
        ranges.push(r);
      }
      if (ranges.length > 0) result.protectedRanges = ranges;
    }
    const afEl = findChild(el, "autoFilter");
    if (afEl) result.autoFilter = parseAutoFilter(afEl);
    const ssEl = findChild(el, "sortState");
    if (ssEl) result.sortState = parseSortStateEl(ssEl);
    const mcEl = findChild(el, "mergeCells");
    if (mcEl) {
      const merges = [];
      for (const mEl of mcEl.elements ?? []) {
        if (mEl.name !== "mergeCell") continue;
        const ref = attr(mEl, "ref") ?? "";
        if (ref) merges.push({ ref });
      }
      if (merges.length > 0) result.mergeCells = merges;
    }
    const cfEls = el.elements?.filter((e) => e.name === "conditionalFormatting") ?? [];
    if (cfEls.length > 0) {
      const cfs = [];
      for (const cfEl of cfEls) {
        const sqref = attr(cfEl, "sqref") ?? "";
        const pivot = parseOnOff(attr(cfEl, "pivot")) ?? false;
        const rules = [];
        for (const ruleEl of cfEl.elements ?? []) {
          if (ruleEl.name !== "cfRule") continue;
          const rule = {
            type: attr(ruleEl, "type"),
            priority: attrNum(ruleEl, "priority") ?? 1
          };
          const opVal = attr(ruleEl, "operator");
          if (opVal) rule.operator = opVal;
          const dxfId = attrNum(ruleEl, "dxfId");
          if (dxfId !== void 0) rule.dxfId = dxfId;
          if (parseOnOff(attr(ruleEl, "stopIfTrue"))) rule.stopIfTrue = true;
          const tpVal = attr(ruleEl, "timePeriod");
          if (tpVal) rule.timePeriod = tpVal;
          const rank = attrNum(ruleEl, "rank");
          if (rank !== void 0) rule.rank = rank;
          if (parseOnOff(attr(ruleEl, "bottom"))) rule.bottom = true;
          if (parseOnOff(attr(ruleEl, "percent"))) rule.percent = true;
          const textVal = attr(ruleEl, "text");
          if (textVal) rule.text = textVal;
          if (parseOnOff(attr(ruleEl, "equalAverage"))) rule.equalAverage = true;
          if (String(attr(ruleEl, "aboveAverage")) === "0") rule.aboveAverage = false;
          const stdDev = attrNum(ruleEl, "stdDev");
          if (stdDev !== void 0) rule.stdDev = stdDev;
          const csEl = findChild(ruleEl, "colorScale");
          if (csEl) {
            const cfvo = [];
            const colors = [];
            for (const child of csEl.elements ?? []) {
              if (child.name === "cfvo") cfvo.push(parseCfvo(child));
              if (child.name === "color") {
                const c = parseCfColor(child);
                if (c) colors.push(c);
              }
            }
            rule.colorScale = {
              cfvo,
              colors
            };
          }
          const dbEl = findChild(ruleEl, "dataBar");
          if (dbEl) {
            const cfvo = [];
            let color;
            for (const child of dbEl.elements ?? []) {
              if (child.name === "cfvo") cfvo.push(parseCfvo(child));
              if (child.name === "color") color = parseCfColor(child) ?? { indexed: 0 };
            }
            rule.dataBar = {
              cfvo,
              color: color ?? { indexed: 0 }
            };
          }
          const isEl = findChild(ruleEl, "iconSet");
          if (isEl) {
            const cfvo = [];
            for (const child of isEl.elements ?? []) if (child.name === "cfvo") cfvo.push(parseCfvo(child));
            const iconSet = { cfvo };
            const isVal = attr(isEl, "iconSet");
            if (isVal) iconSet.iconSet = isVal;
            if (String(attr(isEl, "showValue")) === "0") iconSet.showValue = false;
            if (String(attr(isEl, "percent")) === "0") iconSet.percent = false;
            if (parseOnOff(attr(isEl, "reverse"))) iconSet.reverse = true;
            rule.iconSet = iconSet;
          }
          const formulas = [];
          for (const child of ruleEl.elements ?? []) if (child.name === "formula") formulas.push(textOf(child) ?? "");
          if (formulas.length > 0) rule.formulas = formulas;
          rules.push(rule);
        }
        cfs.push(pivot ? {
          sqref,
          pivot,
          rules
        } : {
          sqref,
          rules
        });
      }
      result.conditionalFormats = cfs;
    }
    const dvEl = findChild(el, "dataValidations");
    if (dvEl) {
      const dvs = [];
      for (const dEl of dvEl.elements ?? []) {
        if (dEl.name !== "dataValidation") continue;
        const dv = { sqref: attr(dEl, "sqref") ?? "" };
        const typeVal = attr(dEl, "type");
        if (typeVal) dv.type = typeVal;
        const opVal = attr(dEl, "operator");
        if (opVal) dv.operator = opVal;
        if (parseOnOff(attr(dEl, "allowBlank"))) dv.allowBlank = true;
        if (parseOnOff(attr(dEl, "showErrorMessage"))) dv.showErrorMessage = true;
        if (parseOnOff(attr(dEl, "showInputMessage"))) dv.showInputMessage = true;
        if (attr(dEl, "errorTitle")) dv.errorTitle = attr(dEl, "errorTitle");
        if (attr(dEl, "error")) dv.error = attr(dEl, "error");
        if (attr(dEl, "promptTitle")) dv.promptTitle = attr(dEl, "promptTitle");
        if (attr(dEl, "prompt")) dv.prompt = attr(dEl, "prompt");
        const esVal = attr(dEl, "errorStyle");
        if (esVal) dv.errorStyle = esVal;
        const imVal = attr(dEl, "imeMode");
        if (imVal) dv.imeMode = imVal;
        if (parseOnOff(attr(dEl, "showDropDown"))) dv.showDropDown = true;
        const f1El = findChild(dEl, "formula1");
        if (f1El) dv.formula1 = textOf(f1El);
        const f2El = findChild(dEl, "formula2");
        if (f2El) dv.formula2 = textOf(f2El);
        dvs.push(dv);
      }
      result.dataValidations = dvs;
    }
    const hlEl = findChild(el, "hyperlinks");
    if (hlEl) {
      const hyperlinks = [];
      for (const hEl of hlEl.elements ?? []) {
        if (hEl.name !== "hyperlink") continue;
        const rId = hEl.attributes?.["r:id"];
        const hl = { cell: attr(hEl, "ref") ?? "" };
        if (rId) hl.url = rId;
        const location = attr(hEl, "location");
        if (location) hl.location = location;
        if (attr(hEl, "tooltip")) hl.tooltip = attr(hEl, "tooltip");
        if (attr(hEl, "display")) hl.display = attr(hEl, "display");
        hyperlinks.push(hl);
      }
      result.hyperlinks = hyperlinks;
    }
    const poEl = findChild(el, "printOptions");
    if (poEl) {
      const po = {};
      if (parseOnOff(attr(poEl, "horizontalCentered"))) po.horizontalCentered = true;
      if (parseOnOff(attr(poEl, "verticalCentered"))) po.verticalCentered = true;
      if (parseOnOff(attr(poEl, "headings"))) po.headings = true;
      if (parseOnOff(attr(poEl, "gridLines"))) po.gridLines = true;
      if (String(attr(poEl, "gridLinesSet")) === "0") po.gridLinesSet = false;
      result.printOptions = po;
    }
    const psEl = findChild(el, "pageSetup");
    if (psEl) result.pageSetup = parsePageSetupEl(psEl, pageSetUpPrCache);
    else if (pageSetUpPrCache) result.pageSetup = pageSetUpPrCache;
    const hfEl = findChild(el, "headerFooter");
    if (hfEl) result.headerFooter = parseHeaderFooterEl(hfEl);
    const ieEl = findChild(el, "ignoredErrors");
    if (ieEl) {
      const errors = [];
      for (const eEl of ieEl.elements ?? []) {
        if (eEl.name !== "ignoredError") continue;
        const ie = { sqref: attr(eEl, "sqref") ?? "" };
        if (parseOnOff(attr(eEl, "evalError"))) ie.evalError = true;
        if (parseOnOff(attr(eEl, "twoDigitTextYear"))) ie.twoDigitTextYear = true;
        if (parseOnOff(attr(eEl, "numberStoredAsText"))) ie.numberStoredAsText = true;
        if (parseOnOff(attr(eEl, "formula"))) ie.formula = true;
        if (parseOnOff(attr(eEl, "formulaRange"))) ie.formulaRange = true;
        if (parseOnOff(attr(eEl, "unlockedFormula"))) ie.unlockedFormula = true;
        if (parseOnOff(attr(eEl, "emptyCellReference"))) ie.emptyCellReference = true;
        if (parseOnOff(attr(eEl, "listDataValidation"))) ie.listDataValidation = true;
        if (parseOnOff(attr(eEl, "calculatedColumn"))) ie.calculatedColumn = true;
        errors.push(ie);
      }
      result.ignoredErrors = errors;
    }
    const smartTagsEl = findChild(el, "smartTags");
    if (smartTagsEl) {
      const entries = [];
      for (const cstEl of smartTagsEl.elements ?? []) {
        if (cstEl.name !== "cellSmartTags") continue;
        const cst = {
          reference: attr(cstEl, "r") ?? "",
          smartTags: []
        };
        for (const stEl of cstEl.elements ?? []) {
          if (stEl.name !== "cellSmartTag") continue;
          const st = { type: attrNum(stEl, "type") ?? 0 };
          if (parseOnOff(attr(stEl, "deleted"))) st.deleted = true;
          if (parseOnOff(attr(stEl, "xmlBased"))) st.xmlBased = true;
          const prEls = stEl.elements?.filter((e) => e.name === "cellSmartTagPr") ?? [];
          if (prEls.length > 0) st.properties = prEls.map((prEl2) => ({
            key: attr(prEl2, "key") ?? "",
            val: attr(prEl2, "val") ?? ""
          }));
          cst.smartTags.push(st);
        }
        entries.push(cst);
      }
      if (entries.length > 0) result.smartTags = entries;
    }
    const ppEl = findChild(el, "phoneticPr");
    if (ppEl) {
      const pp = { fontId: attrNum(ppEl, "fontId") ?? 0 };
      const ppType = attr(ppEl, "type");
      if (ppType) pp.type = ppType;
      const ppAlign = attr(ppEl, "alignment");
      if (ppAlign) pp.alignment = ppAlign;
      result.phoneticPr = pp;
    }
    const scEl = findChild(el, "sheetCalcPr");
    if (scEl) {
      const sc = {};
      if (parseOnOff(attr(scEl, "fullCalcOnLoad"))) sc.fullCalcOnLoad = true;
      result.sheetCalcPr = sc;
    }
    const sheetDataEl = findChild(el, "sheetData");
    if (sheetDataEl) {
      const rows = parseSheetDataRows(sheetDataEl.raw ?? stringify(sheetDataEl), strings);
      if (rows.length > 0) result.rows = rows;
    }
    const rowBreaksEl = findChild(el, "rowBreaks");
    if (rowBreaksEl) {
      const breaks = parsePageBreaks(rowBreaksEl);
      if (breaks.length > 0) result.rowBreaks = breaks;
    }
    const colBreaksEl = findChild(el, "colBreaks");
    if (colBreaksEl) {
      const breaks = parsePageBreaks(colBreaksEl);
      if (breaks.length > 0) result.colBreaks = breaks;
    }
    const customPropsEl = findChild(el, "customProperties");
    if (customPropsEl) {
      const props = [];
      for (const cpEl of customPropsEl.elements ?? []) {
        if (cpEl.name !== "customPr") continue;
        const name = attr(cpEl, "name");
        const rId = cpEl.attributes?.["r:id"];
        if (name !== void 0 && rId !== void 0) props.push({
          name,
          rId
        });
      }
      if (props.length > 0) result.customProperties = props;
    }
    const cellWatchesEl = findChild(el, "cellWatches");
    if (cellWatchesEl) {
      const watches = [];
      for (const cwEl of cellWatchesEl.elements ?? []) {
        if (cwEl.name !== "cellWatch") continue;
        const r = attr(cwEl, "r");
        if (r) watches.push({ reference: r });
      }
      if (watches.length > 0) result.cellWatches = watches;
    }
    const legacyHFEl = findChild(el, "legacyDrawingHF");
    if (legacyHFEl) {
      const rId = legacyHFEl.attributes?.["r:id"];
      if (rId) result.legacyDrawingHF = rId;
    }
    const drawingRefEl = findChild(el, "drawing");
    if (drawingRefEl) {
      const rId = drawingRefEl.attributes?.["r:id"];
      if (rId) result.drawingRid = rId;
    }
    const legacyRefEl = findChild(el, "legacyDrawing");
    if (legacyRefEl) {
      const rId = legacyRefEl.attributes?.["r:id"];
      if (rId) result.legacyDrawingRid = rId;
    }
    const dcEl = findChild(el, "dataConsolidate");
    if (dcEl) {
      const dc = {};
      const fn = attr(dcEl, "function");
      if (fn) dc.function = xsdConsolidateFunction.from(fn);
      if (parseOnOff(attr(dcEl, "topLabels"))) dc.topLabels = true;
      if (parseOnOff(attr(dcEl, "leftLabels"))) dc.leftLabels = true;
      if (parseOnOff(attr(dcEl, "startLabels"))) dc.startLabels = true;
      if (parseOnOff(attr(dcEl, "link"))) dc.link = true;
      const refsEl = findChild(dcEl, "dataRefs");
      if (refsEl) {
        const refs = [];
        for (const refEl of refsEl.elements ?? []) {
          if (refEl.name !== "dataRef") continue;
          const r = attr(refEl, "ref");
          if (r) refs.push(r);
        }
        if (refs.length > 0) dc.refs = refs;
      }
      if (Object.keys(dc).length > 0) result.dataConsolidate = dc;
    }
    const scenariosEl = findChild(el, "scenarios");
    if (scenariosEl) {
      const scenarios = [];
      for (const scEl2 of scenariosEl.elements ?? []) {
        if (scEl2.name !== "scenario") continue;
        const name = attr(scEl2, "name");
        if (name === void 0) continue;
        const scenario = {
          name,
          inputCells: []
        };
        const count = attrNum(scEl2, "count");
        if (count !== void 0) scenario.count = count;
        const user = attr(scEl2, "user");
        if (user !== void 0) scenario.user = user;
        const comment = attr(scEl2, "comment");
        if (comment !== void 0) scenario.comment = comment;
        if (parseOnOff(attr(scEl2, "hidden"))) scenario.hidden = true;
        if (parseOnOff(attr(scEl2, "locked"))) scenario.locked = true;
        for (const icEl of scEl2.elements ?? []) {
          if (icEl.name !== "inputCells") continue;
          const r = attr(icEl, "r");
          const valRaw = attr(icEl, "val");
          if (r === void 0 || valRaw === void 0) continue;
          const num = Number(valRaw);
          const cell = {
            reference: r,
            val: String(num) === valRaw ? num : valRaw
          };
          if (parseOnOff(attr(icEl, "deleted"))) cell.deleted = true;
          if (parseOnOff(attr(icEl, "undone"))) cell.undone = true;
          scenario.inputCells.push(cell);
        }
        scenarios.push(scenario);
      }
      if (scenarios.length > 0) {
        const so = { scenarios };
        const current = attrNum(scenariosEl, "current");
        if (current !== void 0) so.current = current;
        const show = attrNum(scenariosEl, "show");
        if (show !== void 0) so.show = show;
        result.scenarios = so;
      }
    }
    const csvListEl = findChild(el, "customSheetViews");
    if (csvListEl) {
      const views = [];
      for (const vEl of csvListEl.elements ?? []) {
        if (vEl.name !== "customSheetView") continue;
        const guid = attr(vEl, "guid");
        if (guid === void 0) continue;
        const view = { guid };
        const scale = attrNum(vEl, "scale");
        if (scale !== void 0) view.scale = scale;
        if (parseOnOff(attr(vEl, "showPageBreaks"))) view.showPageBreaks = true;
        if (parseOnOff(attr(vEl, "showFormulas"))) view.showFormulas = true;
        if (String(attr(vEl, "showGridLines")) === "0") view.showGridLines = false;
        if (String(attr(vEl, "showRowCol")) === "0") view.showRowColHeaders = false;
        if (String(attr(vEl, "outlineSymbols")) === "0") view.outlineSymbols = false;
        if (String(attr(vEl, "zeroValues")) === "0") view.zeroValues = false;
        if (parseOnOff(attr(vEl, "fitToPage"))) view.fitToPage = true;
        if (parseOnOff(attr(vEl, "printArea"))) view.printArea = true;
        if (parseOnOff(attr(vEl, "filter"))) view.filter = true;
        if (parseOnOff(attr(vEl, "showAutoFilter"))) view.showAutoFilter = true;
        if (parseOnOff(attr(vEl, "hiddenRows"))) view.hiddenRows = true;
        if (parseOnOff(attr(vEl, "hiddenColumns"))) view.hiddenColumns = true;
        const state = attr(vEl, "state");
        if (state !== void 0) view.state = state;
        if (parseOnOff(attr(vEl, "filterUnique"))) view.filterUnique = true;
        const viewType = attr(vEl, "view");
        if (viewType !== void 0) view.view = viewType;
        views.push(view);
      }
      if (views.length > 0) result.customSheetViews = views;
    }
    function unwrapAlternateContent(el2, innerTag) {
      if (el2.name !== "mc:AlternateContent") return {
        element: el2.name === innerTag ? el2 : void 0,
        wrapped: false
      };
      const inner = ((el2.elements ?? []).find((c) => c.name === "mc:Choice")?.elements ?? []).find((c) => c.name === innerTag);
      return {
        element: inner,
        wrapped: inner !== void 0
      };
    }
    function readEmbeddedAnchor(anchorEl) {
      const fromEl = findChild(anchorEl, "from");
      const toEl = findChild(anchorEl, "to");
      if (!fromEl || !toEl) return void 0;
      const markerNum = (m, tag) => {
        const child = findChild(m, tag);
        const n = child === void 0 ? void 0 : Number(textOf(child));
        return n === void 0 || Number.isNaN(n) ? void 0 : n;
      };
      const marker = (m) => {
        const col = markerNum(m, "xdr:col");
        const row = markerNum(m, "xdr:row");
        if (col === void 0 || row === void 0) return void 0;
        return {
          col,
          row,
          ...markerNum(m, "xdr:colOff") !== void 0 ? { colOff: markerNum(m, "xdr:colOff") } : {},
          ...markerNum(m, "xdr:rowOff") !== void 0 ? { rowOff: markerNum(m, "xdr:rowOff") } : {}
        };
      };
      const from2 = marker(fromEl);
      const to = marker(toEl);
      if (!from2 || !to) return void 0;
      return {
        from: from2,
        to,
        ...parseOnOff(attr(anchorEl, "moveWithCells")) ? { moveWithCells: true } : {},
        ...parseOnOff(attr(anchorEl, "sizeWithCells")) ? { sizeWithCells: true } : {}
      };
    }
    const oleObjsEl = findChild(el, "oleObjects");
    if (oleObjsEl) {
      const oleObjects = [];
      for (const rawEl of oleObjsEl.elements ?? []) {
        const unwrapped = unwrapAlternateContent(rawEl, "oleObject");
        const ooEl = unwrapped.element;
        if (!ooEl) continue;
        const shapeId = attrNum(ooEl, "shapeId");
        if (shapeId === void 0) continue;
        const oo = { shapeId };
        if (unwrapped.wrapped) oo.alternateContent = true;
        const progId = attr(ooEl, "progId");
        if (progId !== void 0) oo.progId = progId;
        const dvAspect = attr(ooEl, "dvAspect");
        if (dvAspect !== void 0) oo.dvAspect = dvAspect;
        const link = attr(ooEl, "link");
        if (link !== void 0) oo.link = link;
        const oleUpdate = attr(ooEl, "oleUpdate");
        if (oleUpdate !== void 0) oo.oleUpdate = oleUpdate;
        if (parseOnOff(attr(ooEl, "autoLoad"))) oo.autoLoad = true;
        const ooRid = attr(ooEl, "r:id");
        if (ooRid !== void 0) oo.rId = ooRid;
        const oprEl = findChild(ooEl, "objectPr");
        if (oprEl) {
          const opr = {};
          if (String(attr(oprEl, "locked")) === "0") opr.locked = false;
          if (String(attr(oprEl, "defaultSize")) === "0") opr.defaultSize = false;
          if (String(attr(oprEl, "print")) === "0") opr.print = false;
          if (parseOnOff(attr(oprEl, "disabled"))) opr.disabled = true;
          if (parseOnOff(attr(oprEl, "uiObject"))) opr.uiObject = true;
          if (String(attr(oprEl, "autoFill")) === "0") opr.autoFill = false;
          if (String(attr(oprEl, "autoLine")) === "0") opr.autoLine = false;
          if (String(attr(oprEl, "autoPict")) === "0") opr.autoPict = false;
          const macro = attr(oprEl, "macro");
          if (macro !== void 0) opr.macro = macro;
          const altText = attr(oprEl, "altText");
          if (altText !== void 0) opr.altText = altText;
          if (parseOnOff(attr(oprEl, "dde"))) opr.dde = true;
          const oprRid = attr(oprEl, "r:id");
          if (oprRid !== void 0) opr.iconRid = oprRid;
          const anchorEl = findChild(oprEl, "anchor");
          if (anchorEl) {
            const anchor = readEmbeddedAnchor(anchorEl);
            if (anchor) opr.anchor = anchor;
          }
          if (Object.keys(opr).length > 0) oo.objectPr = opr;
        }
        oleObjects.push(oo);
      }
      if (oleObjects.length > 0) result.oleObjects = oleObjects;
    }
    const controlsEl = findChild(el, "controls");
    if (controlsEl) {
      const controls = [];
      for (const rawEl of controlsEl.elements ?? []) {
        const unwrapped = unwrapAlternateContent(rawEl, "control");
        const cEl = unwrapped.element;
        if (!cEl) continue;
        const shapeId = attrNum(cEl, "shapeId");
        const cRid = attr(cEl, "r:id");
        if (shapeId === void 0 || cRid === void 0) continue;
        const c = {
          shapeId,
          rId: cRid
        };
        if (unwrapped.wrapped) c.alternateContent = true;
        const name = attr(cEl, "name");
        if (name !== void 0) c.name = name;
        const prEl2 = findChild(cEl, "controlPr");
        if (prEl2) {
          if (String(attr(prEl2, "locked")) === "0") c.locked = false;
          if (parseOnOff(attr(prEl2, "uiObject"))) c.uiObject = true;
          if (parseOnOff(attr(prEl2, "recalcAlways"))) c.recalcAlways = true;
          const linkedCell = attr(prEl2, "linkedCell");
          if (linkedCell !== void 0) c.linkedCell = linkedCell;
          const listFillRange = attr(prEl2, "listFillRange");
          if (listFillRange !== void 0) c.listFillRange = listFillRange;
          const cf = attr(prEl2, "cf");
          if (cf !== void 0) c.formula = cf;
          if (String(attr(prEl2, "defaultSize")) === "0") c.defaultSize = false;
          if (String(attr(prEl2, "autoLine")) === "0") c.autoLine = false;
          if (String(attr(prEl2, "autoPict")) === "0") c.autoPict = false;
          const prRid = attr(prEl2, "r:id");
          if (prRid !== void 0) c.iconRid = prRid;
          const anchorEl = findChild(prEl2, "anchor");
          if (anchorEl) {
            const anchor = readEmbeddedAnchor(anchorEl);
            if (anchor) c.anchor = anchor;
          }
        }
        controls.push(c);
      }
      if (controls.length > 0) result.controls = controls;
    }
    const wpEl = findChild(el, "webPublishItems");
    if (wpEl) {
      const items = [];
      for (const wpiEl of wpEl.elements ?? []) {
        if (wpiEl.name !== "webPublishItem") continue;
        const id = attrNum(wpiEl, "id");
        const divId = attr(wpiEl, "divId");
        const sourceType = attr(wpiEl, "sourceType");
        const destinationFile = attr(wpiEl, "destinationFile");
        if (id === void 0 || divId === void 0 || sourceType === void 0 || destinationFile === void 0) continue;
        const wpi = {
          id,
          divId,
          sourceType,
          destinationFile
        };
        const sourceRef = attr(wpiEl, "sourceRef");
        if (sourceRef !== void 0) wpi.sourceRef = sourceRef;
        const sourceObject = attr(wpiEl, "sourceObject");
        if (sourceObject !== void 0) wpi.sourceObject = sourceObject;
        const title = attr(wpiEl, "title");
        if (title !== void 0) wpi.title = title;
        if (parseOnOff(attr(wpiEl, "autoRepublish"))) wpi.autoRepublish = true;
        items.push(wpi);
      }
      if (items.length > 0) result.webPublishItems = items;
    }
    const drawingHfEl = findChild(el, "drawingHF");
    if (drawingHfEl) {
      const rId = attr(drawingHfEl, "r:id");
      if (rId !== void 0) {
        const dhf = { rId };
        for (const key of DRAWING_HF_OFFSET_KEYS) {
          const v = attrNum(drawingHfEl, key);
          if (v !== void 0) dhf[key] = v;
        }
        result.drawingHF = dhf;
      }
    }
    const extLstEl = findChild(el, "extLst");
    if (extLstEl) {
      const inner = stringify(extLstEl);
      if (inner) result.ext = inner;
    }
    return result;
  }
};
function parsePageSetupEl(el, pageSetUpPrCache) {
  const ps = {};
  const pz = attrNum(el, "paperSize");
  if (pz !== void 0) ps.paperSize = pz;
  const ph = attrMeasure(el, "paperHeight");
  if (ph !== void 0) ps.paperHeight = ph;
  const pw = attrMeasure(el, "paperWidth");
  if (pw !== void 0) ps.paperWidth = pw;
  const orientVal = attr(el, "orientation");
  if (orientVal) ps.orientation = orientVal;
  const sc = attrNum(el, "scale");
  if (sc !== void 0) ps.scale = sc;
  const ftw = attrNum(el, "fitToWidth");
  if (ftw !== void 0) ps.fitToWidth = ftw;
  const fth = attrNum(el, "fitToHeight");
  if (fth !== void 0) ps.fitToHeight = fth;
  const pageOrderVal = attr(el, "pageOrder");
  if (pageOrderVal) ps.pageOrder = pageOrderVal;
  if (parseOnOff(attr(el, "useFirstPageNumber"))) ps.useFirstPageNumber = true;
  const fpn = attrNum(el, "firstPageNumber");
  if (fpn !== void 0) ps.firstPageNumber = fpn;
  if (String(attr(el, "usePrinterDefaults")) === "0") ps.usePrinterDefaults = false;
  if (parseOnOff(attr(el, "blackAndWhite"))) ps.blackAndWhite = true;
  if (parseOnOff(attr(el, "draft"))) ps.draft = true;
  const cc = attr(el, "cellComments");
  if (cc) ps.cellComments = cc;
  const err2 = attr(el, "errors");
  if (err2) ps.errors = err2;
  const hdpi = attrNum(el, "horizontalDpi");
  if (hdpi !== void 0) ps.horizontalDpi = hdpi;
  const vdpi = attrNum(el, "verticalDpi");
  if (vdpi !== void 0) ps.verticalDpi = vdpi;
  const copies = attrNum(el, "copies");
  if (copies !== void 0) ps.copies = copies;
  const psRid = attr(el, "r:id");
  if (psRid) ps.printerSettingsRId = psRid;
  if (pageSetUpPrCache) Object.assign(ps, pageSetUpPrCache);
  return ps;
}
function parseHeaderFooterEl(el) {
  const hf = {};
  if (parseOnOff(attr(el, "differentOddEven"))) hf.differentOddEven = true;
  if (parseOnOff(attr(el, "differentFirst"))) hf.differentFirst = true;
  if (String(attr(el, "scaleWithDoc")) === "0") hf.scaleWithDoc = false;
  if (String(attr(el, "alignWithMargins")) === "0") hf.alignWithMargins = false;
  const oh = findChild(el, "oddHeader");
  if (oh) hf.oddHeader = textOf(oh);
  const of2 = findChild(el, "oddFooter");
  if (of2) hf.oddFooter = textOf(of2);
  const eh = findChild(el, "evenHeader");
  if (eh) hf.evenHeader = textOf(eh);
  const ef = findChild(el, "evenFooter");
  if (ef) hf.evenFooter = textOf(ef);
  const fh = findChild(el, "firstHeader");
  if (fh) hf.firstHeader = textOf(fh);
  const ff = findChild(el, "firstFooter");
  if (ff) hf.firstFooter = textOf(ff);
  return hf;
}
function parseSheetProtectionEl(el) {
  const prot = {};
  if (attr(el, "algorithmName")) prot.algorithmName = attr(el, "algorithmName");
  if (attr(el, "hashValue")) prot.hashValue = attr(el, "hashValue");
  if (attr(el, "saltValue")) prot.saltValue = attr(el, "saltValue");
  const spin = attrNum(el, "spinCount");
  if (spin !== void 0) prot.spinCount = spin;
  if (parseOnOff(attr(el, "sheet"))) prot.sheet = true;
  if (parseOnOff(attr(el, "objects"))) prot.objects = true;
  if (parseOnOff(attr(el, "scenarios"))) prot.scenarios = true;
  if (String(attr(el, "formatCells")) === "0") prot.formatCells = false;
  if (String(attr(el, "formatColumns")) === "0") prot.formatColumns = false;
  if (String(attr(el, "formatRows")) === "0") prot.formatRows = false;
  if (String(attr(el, "insertColumns")) === "0") prot.insertColumns = false;
  if (String(attr(el, "insertRows")) === "0") prot.insertRows = false;
  if (String(attr(el, "insertHyperlinks")) === "0") prot.insertHyperlinks = false;
  if (String(attr(el, "deleteColumns")) === "0") prot.deleteColumns = false;
  if (String(attr(el, "deleteRows")) === "0") prot.deleteRows = false;
  if (parseOnOff(attr(el, "selectLockedCells"))) prot.selectLockedCells = true;
  if (String(attr(el, "sort")) === "0") prot.sort = false;
  if (String(attr(el, "autoFilter")) === "0") prot.autoFilter = false;
  if (String(attr(el, "pivotTables")) === "0") prot.pivotTables = false;
  if (parseOnOff(attr(el, "selectUnlockedCells"))) prot.selectUnlockedCells = true;
  return prot;
}
var COLUMN_LETTERS = [];
function columnToLetter(col) {
  const cached = COLUMN_LETTERS[col];
  if (cached !== void 0) return cached;
  let result = "";
  let n = col;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  COLUMN_LETTERS[col] = result;
  return result;
}
function letterToColumn(letters) {
  let col = 0;
  for (let i = 0; i < letters.length; i++) col = col * 26 + (letters.charCodeAt(i) - 64);
  return col;
}
function dateToSerialNumber(date) {
  const epochMs = Date.UTC(1899, 11, 30);
  return (date.getTime() - epochMs) / 864e5;
}
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    hash = (hash >> 14 & 1) + (hash << 1 & 32767);
    hash ^= c;
    hash = hash & 16384 ? hash ^ 1 : hash;
  }
  hash = (hash >> 14 & 1) + (hash << 1 & 32767);
  hash = (hash >> 14 & 1) + (hash << 1 & 32767);
  hash ^= password.length;
  return hash.toString(16).toUpperCase().padStart(4, "0");
}
function stringifyOlapPr(ol) {
  const attrs2 = [];
  if (ol.local !== void 0) attrs2.push(` local="${ol.local ? 1 : 0}"`);
  if (ol.localConnection) attrs2.push(` localConnection="${escapeXml(ol.localConnection)}"`);
  if (ol.sendLocale) attrs2.push(' sendLocale="1"');
  if (ol.rowDrillCount !== void 0) attrs2.push(` rowDrillCount="${ol.rowDrillCount}"`);
  if (ol.localRefresh) attrs2.push(' localRefresh="1"');
  if (ol.serverFill === false) attrs2.push(' serverFill="0"');
  if (ol.serverNumberFormat === false) attrs2.push(' serverNumberFormat="0"');
  if (ol.serverFont === false) attrs2.push(' serverFont="0"');
  if (ol.serverFontColor === false) attrs2.push(' serverFontColor="0"');
  return attrs2.length > 0 ? `<olapPr${attrs2.join("")}/>` : "";
}
function parseOlapPr(el) {
  if (!el) return void 0;
  const ol = {};
  if (attr(el, "local") !== void 0) ol.local = parseOnOff(attr(el, "local")) ?? false;
  if (attr(el, "localConnection")) ol.localConnection = attr(el, "localConnection");
  if (parseOnOff(attr(el, "sendLocale"))) ol.sendLocale = true;
  const rdc = attrNum(el, "rowDrillCount");
  if (rdc !== void 0) ol.rowDrillCount = rdc;
  if (parseOnOff(attr(el, "localRefresh"))) ol.localRefresh = true;
  if (String(attr(el, "serverFill")) === "0") ol.serverFill = false;
  if (String(attr(el, "serverNumberFormat")) === "0") ol.serverNumberFormat = false;
  if (String(attr(el, "serverFont")) === "0") ol.serverFont = false;
  if (String(attr(el, "serverFontColor")) === "0") ol.serverFontColor = false;
  return Object.keys(ol).length > 0 ? ol : void 0;
}
function collectUniqueValues(records, fieldIdx) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const row of records) {
    const val = row[fieldIdx];
    const key = val instanceof Date ? val.toISOString() : String(val);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(val ?? null);
    }
  }
  return result;
}
function isNumericField(records, fieldIdx) {
  for (const row of records) {
    const val = row[fieldIdx];
    if (typeof val === "string" && val !== "") return false;
  }
  return true;
}
function aggregate(values, func) {
  if (values.length === 0) return 0;
  switch (func) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "count":
    case "countNumbers":
      return values.length;
    case "average":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "max":
      return values.reduce((a, b) => Math.max(a, b));
    case "min":
      return values.reduce((a, b) => Math.min(a, b));
    case "product":
      return values.reduce((a, b) => a * b, 1);
    case "variance":
      return sampleVariance(values);
    case "variancePopulation":
      return populationVariance(values);
    case "standardDeviation":
      return Math.sqrt(sampleVariance(values));
    case "standardDeviationPopulation":
      return Math.sqrt(populationVariance(values));
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}
function populationVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
}
function sampleVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
}
function stringifyPivotTable(o, sd, cacheId) {
  const fields = sd.fieldNames;
  const rowFieldNames = o.rows;
  const colFieldNames = o.columns ?? [];
  const dataFields = o.data;
  const style = o.style ?? "PivotStyleLight16";
  const location = o.location ?? "A3";
  const name = o.name ?? "PivotTable1";
  const rowFieldIndices = rowFieldNames.map((n) => fields.indexOf(n));
  const colFieldIndices = colFieldNames.map((n) => fields.indexOf(n));
  const dataFieldIndices = dataFields.map((df) => fields.indexOf(df.field));
  const pageFieldIndices = (o.pages ?? []).map((p2) => fields.indexOf(p2.field));
  const pivotFieldsXml = buildPivotFields(o, sd, rowFieldIndices, colFieldIndices, dataFieldIndices, pageFieldIndices);
  const pageFieldsXml = buildPageFields(o, pageFieldIndices);
  const rowFieldsXml = buildRowFields(rowFieldIndices);
  const rowItemsXml = buildRowItems(sd, rowFieldIndices);
  const colFieldsXml = buildColFields(colFieldIndices);
  const colItemsXml = buildColItems(sd, colFieldIndices, dataFields);
  const dataFieldsXml = buildDataFields(dataFields, dataFieldIndices);
  const locationRef = computeLocationRef(sd, location, rowFieldIndices, colFieldIndices, dataFields);
  const p = [];
  const defAttrs = [
    `name="${escapeXml(name)}"`,
    `cacheId="${cacheId}"`,
    'dataCaption="Values"',
    'updatedVersion="6"',
    'minRefreshableVersion="3"',
    'createdVersion="6"',
    'applyNumberFormats="0"',
    'applyBorderFormats="0"',
    'applyFontFormats="0"',
    'applyPatternFormats="0"',
    'applyAlignmentFormats="0"',
    'applyWidthHeightFormats="1"',
    'autoFormatId="0"',
    'useAutoFormatting="1"',
    'itemPrintTitles="1"',
    'indent="0"',
    'outline="1"',
    'outlineData="1"',
    'compact="1"',
    'compactData="1"',
    'rowGrandTotals="1"',
    'colGrandTotals="1"'
  ];
  if (o.dataOnRows) defAttrs.push('dataOnRows="1"');
  if (o.grandTotalCaption) defAttrs.push(`grandTotalCaption="${escapeXml(o.grandTotalCaption)}"`);
  if (o.errorCaption) defAttrs.push(`errorCaption="${escapeXml(o.errorCaption)}"`);
  if (o.showError) defAttrs.push('showError="1"');
  if (o.missingCaption) defAttrs.push(`missingCaption="${escapeXml(o.missingCaption)}"`);
  if (o.showMissing === false) defAttrs.push('showMissing="0"');
  if (o.pageStyle) defAttrs.push(`pageStyle="${escapeXml(o.pageStyle)}"`);
  if (o.pivotTableStyle) defAttrs.push(`pivotTableStyle="${escapeXml(o.pivotTableStyle)}"`);
  if (o.tag) defAttrs.push(`tag="${escapeXml(o.tag)}"`);
  if (o.showItems === false) defAttrs.push('showItems="0"');
  if (o.editData) defAttrs.push('editData="1"');
  if (o.disableFieldList) defAttrs.push('disableFieldList="1"');
  if (o.showCalcMbrs === false) defAttrs.push('showCalcMbrs="0"');
  if (o.visualTotals) defAttrs.push('visualTotals="1"');
  if (o.showMultipleLabel === false) defAttrs.push('showMultipleLabel="0"');
  if (o.showDataDropDown === false) defAttrs.push('showDataDropDown="0"');
  if (o.showDrill === false) defAttrs.push('showDrill="0"');
  if (o.printDrill) defAttrs.push('printDrill="1"');
  if (o.showMemberPropertyTips) defAttrs.push('showMemberPropertyTips="1"');
  if (o.showDataTips === false) defAttrs.push('showDataTips="0"');
  if (o.enableWizard === false) defAttrs.push('enableWizard="0"');
  if (o.enableDrill === false) defAttrs.push('enableDrill="0"');
  if (o.enableFieldProperties === false) defAttrs.push('enableFieldProperties="0"');
  if (o.pageWrap !== void 0) defAttrs.push(`pageWrap="${o.pageWrap}"`);
  if (o.pageOverThenDown) defAttrs.push('pageOverThenDown="1"');
  if (o.subtotalHiddenItems) defAttrs.push('subtotalHiddenItems="1"');
  if (o.fieldPrintTitles) defAttrs.push('fieldPrintTitles="1"');
  if (o.mergeItem) defAttrs.push('mergeItem="1"');
  if (o.showDropZones === false) defAttrs.push('showDropZones="0"');
  if (o.showEmptyRow) defAttrs.push('showEmptyRow="1"');
  if (o.showEmptyCol) defAttrs.push('showEmptyCol="1"');
  if (o.showHeaders === false) defAttrs.push('showHeaders="0"');
  if (o.published) defAttrs.push('published="1"');
  if (o.gridDropZones === false) defAttrs.push('gridDropZones="0"');
  if (o.multipleFieldFilters === false) defAttrs.push('multipleFieldFilters="0"');
  if (o.rowHeaderCaption) defAttrs.push(`rowHeaderCaption="${escapeXml(o.rowHeaderCaption)}"`);
  if (o.colHeaderCaption) defAttrs.push(`colHeaderCaption="${escapeXml(o.colHeaderCaption)}"`);
  if (o.fieldListSortAscending) defAttrs.push('fieldListSortAscending="1"');
  if (o.mdxSubqueries) defAttrs.push('mdxSubqueries="1"');
  if (o.customListSort === false) defAttrs.push('customListSort="0"');
  if (o.asteriskTotals) defAttrs.push('asteriskTotals="1"');
  if (o.dataPosition !== void 0) defAttrs.push(`dataPosition="${o.dataPosition}"`);
  if (o.immersive) defAttrs.push('immersive="1"');
  if (o.vacatedStyle) defAttrs.push(`vacatedStyle="${escapeXml(o.vacatedStyle)}"`);
  if (o.chartFormat) defAttrs.push('chartFormat="1"');
  if (o.preserveFormatting === false) defAttrs.push('preserveFormatting="0"');
  p.push(`<pivotTableDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ${defAttrs.join(" ")}>`);
  const locAttrs = [
    `ref="${escapeXml(locationRef)}"`,
    `firstHeaderRow="1"`,
    `firstDataRow="${colFieldIndices.length + 1}"`,
    `firstDataCol="${rowFieldIndices.length}"`
  ];
  if (o.locationColPageCount !== void 0) locAttrs.push(`colPageCount="${o.locationColPageCount}"`);
  if (o.locationRowPageCount !== void 0) locAttrs.push(`rowPageCount="${o.locationRowPageCount}"`);
  p.push(`<location ${locAttrs.join(" ")}/>`);
  p.push(pivotFieldsXml);
  p.push(rowFieldsXml);
  p.push(rowItemsXml);
  if (colFieldIndices.length > 0) p.push(colFieldsXml);
  p.push(colItemsXml);
  if (pageFieldIndices.length > 0) p.push(pageFieldsXml);
  if (dataFields.length > 0) p.push(dataFieldsXml);
  if (o.formats && o.formats.length > 0) {
    const fmtParts = [`<formats count="${o.formats.length}">`];
    for (const fmt of o.formats) {
      const fmtAttrs = [];
      if (fmt.action && fmt.action !== "formatting") fmtAttrs.push(`action="${fmt.action}"`);
      if (fmt.dxfId !== void 0) fmtAttrs.push(`dxfId="${fmt.dxfId}"`);
      fmtParts.push(`<format${fmtAttrs.length ? " " + fmtAttrs.join(" ") : ""}>${buildPivotAreaXml(fmt.pivotArea)}</format>`);
    }
    fmtParts.push("</formats>");
    p.push(fmtParts.join(""));
  }
  if (o.pivotConditionalFormats && o.pivotConditionalFormats.length > 0) {
    const pcParts = [`<conditionalFormats count="${o.pivotConditionalFormats.length}">`];
    for (const cf of o.pivotConditionalFormats) {
      const cfAttrs = [`priority="${cf.priority}"`];
      if (cf.scope && cf.scope !== "selection") cfAttrs.push(`scope="${cf.scope}"`);
      if (cf.type && cf.type !== "none") cfAttrs.push(`type="${cf.type}"`);
      const areasXml = cf.pivotAreas?.length ? `<pivotAreas count="${cf.pivotAreas.length}">${cf.pivotAreas.map((a) => buildPivotAreaXml(a)).join("")}</pivotAreas>` : '<pivotAreas count="0"/>';
      pcParts.push(`<conditionalFormat ${cfAttrs.join(" ")}>${areasXml}</conditionalFormat>`);
    }
    pcParts.push("</conditionalFormats>");
    p.push(pcParts.join(""));
  }
  if (o.chartFormats && o.chartFormats.length > 0) {
    const cfParts = [`<chartFormats count="${o.chartFormats.length}">`];
    for (const cf of o.chartFormats) {
      const cfAttrs = [`chart="${cf.chart}"`, `format="${cf.format}"`];
      if (cf.series) cfAttrs.push('series="1"');
      const areaXml = cf.pivotArea ? buildPivotAreaXml(cf.pivotArea) : "";
      cfParts.push(`<chartFormat ${cfAttrs.join(" ")}>${areaXml}</chartFormat>`);
    }
    cfParts.push("</chartFormats>");
    p.push(cfParts.join(""));
  }
  if (o.pivotHierarchies && o.pivotHierarchies.length > 0) p.push(buildPivotHierarchies(o.pivotHierarchies));
  p.push(`<pivotTableStyleInfo name="${escapeXml(style)}" showRowHeaders="1" showColHeaders="1" showRowStripes="0" showColStripes="0" showLastColumn="1"/>`);
  if (o.filters && o.filters.length > 0) {
    const fParts = [`<filters count="${o.filters.length}">`];
    let filterIdx = -1;
    for (const f of o.filters) {
      filterIdx++;
      const fAttrs = {
        fld: f.fld,
        type: f.type,
        id: f.id ?? filterIdx
      };
      if (f.mpFld !== void 0) fAttrs.mpFld = f.mpFld;
      if (f.evalOrder !== void 0) fAttrs.evalOrder = f.evalOrder;
      if (f.iMeasureHier !== void 0) fAttrs.iMeasureHier = f.iMeasureHier;
      if (f.iMeasureFld !== void 0) fAttrs.iMeasureFld = f.iMeasureFld;
      if (f.name) fAttrs.name = f.name;
      if (f.description) fAttrs.description = f.description;
      if (f.stringValue1) fAttrs.stringValue1 = f.stringValue1;
      if (f.stringValue2) fAttrs.stringValue2 = f.stringValue2;
      fParts.push(`<filter${attrs(fAttrs)}><autoFilter></autoFilter></filter>`);
    }
    fParts.push("</filters>");
    p.push(fParts.join(""));
  }
  if (o.rowHierarchiesUsage && o.rowHierarchiesUsage.length > 0) {
    const rhu = o.rowHierarchiesUsage;
    p.push(`<rowHierarchiesUsage count="${rhu.length}">${rhu.map((h) => `<rowHierarchyUsage hierarchyUsage="${h.hierarchyUsage}"/>`).join("")}</rowHierarchiesUsage>`);
  }
  if (o.colHierarchiesUsage && o.colHierarchiesUsage.length > 0) {
    const chu = o.colHierarchiesUsage;
    p.push(`<colHierarchiesUsage count="${chu.length}">${chu.map((h) => `<colHierarchyUsage hierarchyUsage="${h.hierarchyUsage}"/>`).join("")}</colHierarchiesUsage>`);
  }
  p.push("</pivotTableDefinition>");
  return p.join("");
}
function buildFieldOverrideAttrs(fo) {
  const a = [];
  if (fo.allDrilled) a.push('allDrilled="1"');
  if (fo.autoShow) a.push('autoShow="1"');
  if (fo.countSubtotal) a.push('countSubtotal="1"');
  if (fo.avgSubtotal) a.push('avgSubtotal="1"');
  if (fo.countASubtotal) a.push('countASubtotal="1"');
  if (fo.maxSubtotal) a.push('maxSubtotal="1"');
  if (fo.minSubtotal) a.push('minSubtotal="1"');
  if (fo.sumSubtotal) a.push('sumSubtotal="1"');
  if (fo.dataSourceSort) a.push('dataSourceSort="1"');
  if (fo.defaultAttributeDrillState) a.push('defaultAttributeDrillState="1"');
  if (fo.hiddenLevel) a.push('hiddenLevel="1"');
  if (fo.hideNewItems) a.push('hideNewItems="1"');
  if (fo.insertBlankRow) a.push('insertBlankRow="1"');
  if (fo.insertPageBreak) a.push('insertPageBreak="1"');
  if (fo.itemPageCount) a.push('itemPageCount="1"');
  if (fo.measureFilter) a.push('measureFilter="1"');
  if (fo.nonAutoSortDefault) a.push('nonAutoSortDefault="1"');
  if (fo.productSubtotal) a.push('productSubtotal="1"');
  if (fo.rankBy !== void 0) a.push(`rankBy="${fo.rankBy}"`);
  if (fo.serverField) a.push('serverField="1"');
  if (fo.showDropDowns) a.push('showDropDowns="1"');
  if (fo.showPropAsCaption) a.push('showPropAsCaption="1"');
  if (fo.showPropCell) a.push('showPropCell="1"');
  if (fo.showPropTip) a.push('showPropTip="1"');
  if (fo.stdDevPSubtotal) a.push('stdDevPSubtotal="1"');
  if (fo.stdDevSubtotal) a.push('stdDevSubtotal="1"');
  if (fo.subtotalCaption) a.push(`subtotalCaption="${escapeXml(fo.subtotalCaption)}"`);
  if (fo.topAutoShow) a.push('topAutoShow="1"');
  if (fo.uniqueMemberProperty) a.push('uniqueMemberProperty="1"');
  if (fo.varPSubtotal) a.push('varPSubtotal="1"');
  if (fo.varSubtotal) a.push('varSubtotal="1"');
  return a.join(" ");
}
function buildPivotFields(o, sd, rowIndices, colIndices, dataIndices, pageIndices) {
  const fieldNames = sd.fieldNames;
  const parts = [`<pivotFields count="${fieldNames.length}">`];
  for (let i = 0; i < fieldNames.length; i++) {
    const isRow = rowIndices.includes(i);
    const isCol = colIndices.includes(i);
    const isData = dataIndices.includes(i);
    const isPage = pageIndices.includes(i);
    const override = o.fieldOverrides?.find((fo) => fo.field === fieldNames[i]);
    const extraAttrs = override ? buildFieldOverrideAttrs(override) : "";
    if (isData) {
      const dataFieldIdx = dataIndices.indexOf(i);
      const df = o.data[dataFieldIdx];
      const dfAttrs = ['dataField="1"', 'showAll="0"'];
      if (extraAttrs) dfAttrs.push(extraAttrs);
      if (df?.showDataAs) dfAttrs.push(`showDataAs="${df.showDataAs}"`);
      if (df?.baseField !== void 0) dfAttrs.push(`baseField="${df.baseField}"`);
      if (df?.baseItem !== void 0) dfAttrs.push(`baseItem="${df.baseItem}"`);
      if (o.autoSortScope) parts.push(`<pivotField ${dfAttrs.join(" ")}><autoSortScope>${buildPivotAreaXml(o.autoSortScope)}</autoSortScope></pivotField>`);
      else parts.push(`<pivotField ${dfAttrs.join(" ")}/>`);
    } else if (isRow) {
      const uniqueVals = collectUniqueValues(sd.records, i);
      const rAttrs = extraAttrs ? ` axis="axisRow" showAll="0" ${extraAttrs}` : ' axis="axisRow" showAll="0"';
      parts.push(`<pivotField${rAttrs}>`);
      parts.push(`<items count="${uniqueVals.length + 1}">`);
      for (let j = 0; j < uniqueVals.length; j++) parts.push(`<item x="${j}"/>`);
      parts.push(`<item t="default"${override?.defaultItemSd === false ? ' sd="0"' : ""}/>`);
      parts.push("</items></pivotField>");
    } else if (isCol) {
      const uniqueVals = collectUniqueValues(sd.records, i);
      const cAttrs = extraAttrs ? ` axis="axisCol" showAll="0" ${extraAttrs}` : ' axis="axisCol" showAll="0"';
      parts.push(`<pivotField${cAttrs}>`);
      parts.push(`<items count="${uniqueVals.length + 1}">`);
      for (let j = 0; j < uniqueVals.length; j++) parts.push(`<item x="${j}"/>`);
      parts.push(`<item t="default"${override?.defaultItemSd === false ? ' sd="0"' : ""}/>`);
      parts.push("</items></pivotField>");
    } else if (isPage) {
      const uniqueVals = collectUniqueValues(sd.records, i);
      const pAttrs = extraAttrs ? ` axis="axisPage" showAll="0" ${extraAttrs}` : ' axis="axisPage" showAll="0"';
      parts.push(`<pivotField${pAttrs}>`);
      parts.push(`<items count="${uniqueVals.length + 1}">`);
      for (let j = 0; j < uniqueVals.length; j++) parts.push(`<item x="${j}"/>`);
      parts.push(`<item t="default"${override?.defaultItemSd === false ? ' sd="0"' : ""}/>`);
      parts.push("</items></pivotField>");
    } else {
      const nAttrs = extraAttrs ? ` showAll="0" ${extraAttrs}` : ' showAll="0"';
      parts.push(`<pivotField${nAttrs}/>`);
    }
  }
  parts.push("</pivotFields>");
  return parts.join("");
}
function buildPageFields(o, pageIndices) {
  if (pageIndices.length === 0) return "";
  const parts = [`<pageFields count="${pageIndices.length}">`];
  const pageFields = o.pages ?? [];
  for (let i = 0; i < pageIndices.length; i++) {
    const cap = pageFields[i]?.caption;
    const capAttr = cap ? ` cap="${escapeXml(cap)}"` : "";
    const item = pageFields[i]?.item;
    const itemAttr = item !== void 0 ? ` item="${item}"` : "";
    parts.push(`<pageField fld="${pageIndices[i]}" hier="${i}"${capAttr}${itemAttr}/>`);
  }
  parts.push("</pageFields>");
  return parts.join("");
}
function buildRowFields(rowIndices) {
  if (rowIndices.length === 0) return '<rowFields count="0"/>';
  const parts = [`<rowFields count="${rowIndices.length}">`];
  for (const idx of rowIndices) parts.push(`<field x="${idx}"/>`);
  parts.push("</rowFields>");
  return parts.join("");
}
function buildRowItems(sd, rowIndices) {
  if (rowIndices.length === 0) return '<rowItems count="1"><i/></rowItems>';
  const allUniqueCounts = [];
  for (const idx of rowIndices) allUniqueCounts.push(collectUniqueValues(sd.records, idx).length);
  if (rowIndices.length === 1) {
    const count = allUniqueCounts[0] ?? 0;
    const parts = [`<rowItems count="${count + 1}">`];
    for (let i = 0; i < count; i++) parts.push(`<i><x v="${i}"/></i>`);
    parts.push(`<i t="grand"><x/></i>`);
    parts.push("</rowItems>");
    return parts.join("");
  }
  const combos = cartesianOfCounts(allUniqueCounts);
  const rowItems = [];
  for (const combo of combos) rowItems.push(`<i>${combo.map((v) => `<x v="${v}"/>`).join("")}</i>`);
  rowItems.push(`<i t="grand">${rowIndices.map(() => "<x/>").join("")}</i>`);
  return `<rowItems count="${rowItems.length}">${rowItems.join("")}</rowItems>`;
}
function buildColFields(colIndices) {
  if (colIndices.length === 0) return '<colFields count="0"/>';
  const parts = [`<colFields count="${colIndices.length}">`];
  for (const idx of colIndices) parts.push(`<field x="${idx}"/>`);
  parts.push("</colFields>");
  return parts.join("");
}
function buildColItems(sd, colIndices, dataFields) {
  if (colIndices.length > 0) {
    const allUniqueCounts = [];
    for (const idx of colIndices) allUniqueCounts.push(collectUniqueValues(sd.records, idx).length);
    const combos = cartesianOfCounts(allUniqueCounts);
    const items = [];
    for (const combo of combos) items.push(`<i>${combo.map((v) => `<x v="${v}"/>`).join("")}</i>`);
    items.push(`<i t="grand">${colIndices.map(() => "<x/>").join("")}</i>`);
    return `<colItems count="${items.length}">${items.join("")}</colItems>`;
  }
  if (dataFields.length > 1) {
    const items = dataFields.map((_, i) => `<i><x v="${i}"/></i>`);
    return `<colItems count="${items.length}">${items.join("")}</colItems>`;
  }
  return '<colItems count="1"><i/></colItems>';
}
function buildDataFields(dataFields, dataFieldIndices) {
  if (dataFields.length === 0) return '<dataFields count="0"/>';
  const parts = [`<dataFields count="${dataFields.length}">`];
  for (const [i, df] of dataFields.entries()) {
    const subtotal = df.summarize ?? "sum";
    const name = df.name ?? `${subtotal === "sum" ? "Sum" : subtotal} of ${df.field}`;
    const dfAttrs = [
      `name="${escapeXml(name)}"`,
      `fld="${dataFieldIndices[i] ?? 0}"`,
      `subtotal="${xsdConsolidateFunction.to(subtotal)}"`
    ];
    if (df.showDataAs) dfAttrs.push(`showDataAs="${df.showDataAs}"`);
    if (df.baseField !== void 0) dfAttrs.push(`baseField="${df.baseField}"`);
    if (df.baseItem !== void 0) dfAttrs.push(`baseItem="${df.baseItem}"`);
    parts.push(`<dataField ${dfAttrs.join(" ")}/>`);
  }
  parts.push("</dataFields>");
  return parts.join("");
}
function computeLocationRef(sd, location, rowFieldIndices, colFieldIndices, dataFields) {
  const match = (location.split(":")[0] ?? location).match(/^([A-Z]+)(\d+)$/);
  if (!match) return location;
  const startCol = match[1] ?? "";
  const startRow = parseInt(match[2] ?? "0", 10);
  let rowCount = 1;
  const rowFieldIndex0 = rowFieldIndices[0];
  if (rowFieldIndex0 !== void 0) rowCount += collectUniqueValues(sd.records, rowFieldIndex0).length;
  rowCount += 1;
  let colCount = Math.max(rowFieldIndices.length, 1);
  const colFieldIndex0 = colFieldIndices[0];
  if (colFieldIndex0 !== void 0) colCount += collectUniqueValues(sd.records, colFieldIndex0).length;
  else if (dataFields.length > 1) colCount += dataFields.length - 1;
  colCount += 1;
  return `${startCol}${startRow}:${columnToLetter(letterToColumn(startCol) + colCount - 1)}${startRow + rowCount - 1}`;
}
function buildPivotHierarchies(hierarchies) {
  const parts = [`<pivotHierarchies count="${hierarchies.length}">`];
  for (const h of hierarchies) {
    const hAttrs = [];
    if (h.outline) hAttrs.push('outline="1"');
    if (h.multipleItemSelectionAllowed) hAttrs.push('multipleItemSelectionAllowed="1"');
    if (h.subtotalTop) hAttrs.push('subtotalTop="1"');
    if (h.showInFieldList === false) hAttrs.push('showInFieldList="0"');
    if (h.dragToRow === false) hAttrs.push('dragToRow="0"');
    if (h.dragToCol === false) hAttrs.push('dragToCol="0"');
    if (h.dragToPage === false) hAttrs.push('dragToPage="0"');
    if (h.dragToData) hAttrs.push('dragToData="1"');
    if (h.dragOff === false) hAttrs.push('dragOff="0"');
    if (h.includeNewItemsInFilter) hAttrs.push('includeNewItemsInFilter="1"');
    if (h.caption) hAttrs.push(`caption="${escapeXml(h.caption)}"`);
    const inner = (h.memberProperties ? `<mps count="${h.memberProperties.length}">${h.memberProperties.map((mp) => {
      const mpAttrs = [`field="${mp.field}"`];
      if (mp.name !== void 0) mpAttrs.push(`name="${escapeXml(mp.name)}"`);
      if (mp.showCell) mpAttrs.push('showCell="1"');
      if (mp.showTip) mpAttrs.push('showTip="1"');
      if (mp.showAsCaption) mpAttrs.push('showAsCaption="1"');
      if (mp.nameLen !== void 0) mpAttrs.push(`nameLen="${mp.nameLen}"`);
      if (mp.pPos !== void 0) mpAttrs.push(`pPos="${mp.pPos}"`);
      if (mp.pLen !== void 0) mpAttrs.push(`pLen="${mp.pLen}"`);
      return `<mp ${mpAttrs.join(" ")}/>`;
    }).join("")}</mps>` : "") + (h.members ? `<members count="${h.members.length}">${h.members.map((m) => `<member name="${escapeXml(m.name)}"${m.level !== void 0 ? ` level="${m.level}"` : ""}/>`).join("")}</members>` : "");
    if (inner) parts.push(`<pivotHierarchy ${hAttrs.join(" ")}>${inner}</pivotHierarchy>`);
    else parts.push(`<pivotHierarchy ${hAttrs.join(" ")}/>`);
  }
  parts.push("</pivotHierarchies>");
  return parts.join("");
}
function buildPivotAreaXml(area) {
  const aAttrs = [];
  if (area.field !== void 0) aAttrs.push(`field="${area.field}"`);
  if (area.type) aAttrs.push(`type="${area.type}"`);
  if (area.dataOnly === false) aAttrs.push('dataOnly="0"');
  if (area.labelOnly) aAttrs.push('labelOnly="1"');
  if (area.grandRow) aAttrs.push('grandRow="1"');
  if (area.grandCol) aAttrs.push('grandCol="1"');
  if (area.cacheIndex) aAttrs.push('cacheIndex="1"');
  if (area.outline === false) aAttrs.push('outline="0"');
  if (area.offset) aAttrs.push(`offset="${escapeXml(area.offset)}"`);
  if (area.collapsedLevelsAreSubtotals) aAttrs.push('collapsedLevelsAreSubtotals="1"');
  if (area.axis) aAttrs.push(`axis="${area.axis}"`);
  if (area.fieldPosition !== void 0) aAttrs.push(`fieldPosition="${area.fieldPosition}"`);
  const refsXml = area.references ? buildPivotAreaReferences(area.references) : "";
  if (refsXml) return `<pivotArea ${aAttrs.join(" ")}>${refsXml}</pivotArea>`;
  return `<pivotArea ${aAttrs.join(" ")}/>`;
}
function buildPivotAreaReferences(refs) {
  const parts = [`<references count="${refs.length}">`];
  for (const ref of refs) {
    const rAttrs = [];
    if (ref.field !== void 0) rAttrs.push(`field="${ref.field}"`);
    if (ref.count !== void 0) rAttrs.push(`count="${ref.count}"`);
    if (ref.selected === false) rAttrs.push('selected="0"');
    if (ref.byPosition) rAttrs.push('byPosition="1"');
    if (ref.relative) rAttrs.push('relative="1"');
    if (ref.defaultSubtotal) rAttrs.push('defaultSubtotal="1"');
    if (ref.sumSubtotal) rAttrs.push('sumSubtotal="1"');
    if (ref.avgSubtotal) rAttrs.push('avgSubtotal="1"');
    if (ref.countASubtotal) rAttrs.push('countASubtotal="1"');
    if (ref.maxSubtotal) rAttrs.push('maxSubtotal="1"');
    if (ref.minSubtotal) rAttrs.push('minSubtotal="1"');
    const xXml = ref.x ? ref.x.map((v) => `<x v="${v}"/>`).join("") : "";
    if (xXml) parts.push(`<reference ${rAttrs.join(" ")}>${xXml}</reference>`);
    else parts.push(`<reference ${rAttrs.join(" ")}/>`);
  }
  parts.push("</references>");
  return parts.join("");
}
function cartesianOfCounts(counts) {
  if (counts.length === 0) return [[]];
  let result = [[]];
  for (const count of counts) {
    const next = [];
    for (const prefix of result) for (let i = 0; i < count; i++) next.push([...prefix, i]);
    result = next;
  }
  return result;
}
function stringifyWorksheet(opts, ctx) {
  const sharedStrings = ctx.sharedStrings;
  const styles = ctx.styles;
  const rows = opts.rows ?? [];
  const columns = opts.columns ?? [];
  const mergeCells = opts.mergeCells ?? [];
  const protectedRanges = opts.protectedRanges ?? [];
  const ignoredErrors = opts.ignoredErrors ?? [];
  const rowBreaks = opts.rowBreaks ?? [];
  const colBreaks = opts.colBreaks ?? [];
  const customSheetViews = opts.customSheetViews ?? [];
  const cellWatches = opts.cellWatches ?? [];
  const controls = opts.controls ?? [];
  const customProperties = opts.customProperties ?? [];
  const oleObjects = opts.oleObjects ?? [];
  const webPublishItems = opts.webPublishItems ?? [];
  const p = ['<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac xr xr2 xr3" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision" xmlns:xr2="http://schemas.microsoft.com/office/spreadsheetml/2015/revision2" xmlns:xr3="http://schemas.microsoft.com/office/spreadsheetml/2016/revision3">'];
  const hasTabColor = !!opts.tabColor;
  const hasOutline = columns.some((c) => c.outlineLevel !== void 0);
  const sp = opts.sheetPr;
  const hasSheetPrAttrs = sp && (sp.codeName || sp.syncHorizontal || sp.syncVertical || sp.syncRef || sp.transitionEvaluation || sp.transitionEntry || sp.published !== void 0 || sp.filterMode || sp.enableFormatConditionsCalculation !== void 0);
  const hasPageSetUpPr = !!opts.pageSetup?.fitToWidth || !!opts.pageSetup?.fitToHeight || opts.pageSetup?.fitToPage !== void 0 || opts.pageSetup?.autoPageBreaks !== void 0;
  if (hasTabColor || hasOutline || hasSheetPrAttrs || hasPageSetUpPr) {
    const prParts = [];
    const prAttrs = {};
    if (sp?.codeName) prAttrs.codeName = sp.codeName;
    if (sp?.syncHorizontal) prAttrs.syncHorizontal = 1;
    if (sp?.syncVertical) prAttrs.syncVertical = 1;
    if (sp?.syncRef) prAttrs.syncRef = sp.syncRef;
    if (sp?.transitionEvaluation) prAttrs.transitionEvaluation = 1;
    if (sp?.transitionEntry) prAttrs.transitionEntry = 1;
    if (sp?.published === false) prAttrs.published = 0;
    if (sp?.filterMode) prAttrs.filterMode = 1;
    if (sp?.enableFormatConditionsCalculation === false) prAttrs.enableFormatConditionsCalculation = 0;
    if (opts.tabColor) {
      const tc = opts.tabColor;
      const tcAttrs = {};
      if (tc.rgb) tcAttrs.rgb = tc.rgb;
      if (tc.theme !== void 0) tcAttrs.theme = tc.theme;
      if (tc.tint !== void 0) tcAttrs.tint = tc.tint;
      if (tc.indexed !== void 0) tcAttrs.indexed = tc.indexed;
      prParts.push(`<tabColor${attrs(tcAttrs)}/>`);
    }
    if (hasOutline) {
      const outAttrs = {
        summaryBelow: 1,
        summaryRight: 1
      };
      if (sp?.outlineSummaryBelow === false) outAttrs.summaryBelow = 0;
      if (sp?.outlineSummaryRight === false) outAttrs.summaryRight = 0;
      if (sp?.outlineApplyStyles) outAttrs.applyStyles = 1;
      if (sp?.outlineShowSymbols === false) outAttrs.showOutlineSymbols = 0;
      prParts.push(`<outlinePr${attrs(outAttrs)}/>`);
    }
    if (hasPageSetUpPr) {
      const psupAttrs = {};
      if (opts.pageSetup?.fitToWidth || opts.pageSetup?.fitToHeight || opts.pageSetup?.fitToPage) psupAttrs.fitToPage = 1;
      if (opts.pageSetup?.autoPageBreaks !== void 0) psupAttrs.autoPageBreaks = opts.pageSetup.autoPageBreaks ? 1 : 0;
      prParts.push(`<pageSetUpPr${attrs(psupAttrs)}/>`);
    }
    const prAttrStr = Object.keys(prAttrs).length > 0 ? attrs(prAttrs) : "";
    p.push(`<sheetPr${prAttrStr}>${prParts.join("")}</sheetPr>`);
  }
  const maxRow = rows.length;
  let maxCol = 0;
  for (const row of rows) if (row.cells && row.cells.length > maxCol) maxCol = row.cells.length;
  if (opts.dimension) p.push(`<dimension ref="${opts.dimension}"/>`);
  else if (maxRow > 0 && maxCol > 0) {
    const dimRef = `A1:${defaultCellRef(maxRow, maxCol)}`;
    p.push(`<dimension ref="${dimRef}"/>`);
  }
  if (opts.freezePanes) {
    const fp = opts.freezePanes;
    const ySplit = fp.row ? fp.row : 0;
    const xSplit = fp.col ? fp.col : 0;
    const topRow = fp.row ? fp.row + 1 : 1;
    const leftCol = fp.col ? fp.col + 1 : 1;
    const topLeftCell = fp.topLeftCell ?? defaultCellRef(topRow, leftCol);
    const activePane = fp.activePane ?? (ySplit > 0 && xSplit > 0 ? "bottomRight" : ySplit > 0 ? "bottomLeft" : "topRight");
    const state = fp.split ? "split" : "frozen";
    const svAttrs = buildSheetViewAttrs(opts.sheetView);
    const selections = (opts.selection ?? []).map(buildSelectionXml).join("");
    p.push(`<sheetViews><sheetView${svAttrs}>`, `<pane ySplit="${ySplit}" xSplit="${xSplit}" topLeftCell="${topLeftCell}" activePane="${activePane}" state="${state}"/>`, selections, opts.pivotSelection ? buildPivotSelectionXml(opts.pivotSelection) : "", "</sheetView></sheetViews>");
  } else {
    const svAttrs = buildSheetViewAttrs(opts.sheetView);
    const innerXml = (opts.selection ?? []).map(buildSelectionXml).join("") + (opts.pivotSelection ? buildPivotSelectionXml(opts.pivotSelection) : "");
    if (innerXml) p.push(`<sheetViews><sheetView${svAttrs}>${innerXml}</sheetView></sheetViews>`);
    else p.push(`<sheetViews><sheetView${svAttrs}/></sheetViews>`);
  }
  if (opts.sheetFormatPr) {
    const sfp = opts.sheetFormatPr;
    const sfpAttrs = {};
    if (sfp.baseColWidth !== void 0) sfpAttrs.baseColWidth = sfp.baseColWidth;
    if (sfp.defaultColWidth !== void 0) sfpAttrs.defaultColWidth = sfp.defaultColWidth;
    sfpAttrs.defaultRowHeight = sfp.defaultRowHeight ?? 15;
    if (sfp.zeroHeight) sfpAttrs.zeroHeight = 1;
    if (sfp.thickTop) sfpAttrs.thickTop = 1;
    if (sfp.thickBottom) sfpAttrs.thickBottom = 1;
    if (sfp.outlineLevelRow !== void 0) sfpAttrs.outlineLevelRow = sfp.outlineLevelRow;
    if (sfp.outlineLevelCol !== void 0) sfpAttrs.outlineLevelCol = sfp.outlineLevelCol;
    p.push(`<sheetFormatPr${attrs(sfpAttrs)}/>`);
  } else p.push('<sheetFormatPr baseColWidth="10" defaultRowHeight="15"/>');
  if (columns.length > 0) {
    p.push("<cols>");
    for (const col of columns) {
      const colAttrs = {
        min: col.min,
        max: col.max
      };
      if (col.width !== void 0) {
        colAttrs.width = col.width;
        colAttrs.customWidth = 1;
      }
      if (col.customWidth) colAttrs.customWidth = 1;
      if (col.hidden) colAttrs.hidden = 1;
      if (col.outlineLevel !== void 0) colAttrs.outlineLevel = col.outlineLevel;
      if (col.collapsed) colAttrs.collapsed = 1;
      if (col.bestFit) colAttrs.bestFit = 1;
      if (col.phonetic) colAttrs.phonetic = 1;
      p.push(selfCloseElement("col", attrs(colAttrs)));
    }
    p.push("</cols>");
  }
  p.push("<sheetData>");
  appendSheetDataRows(rows, p, sharedStrings, styles);
  p.push("</sheetData>");
  if (opts.sheetCalcPr) {
    const scAttrs = [];
    if (opts.sheetCalcPr.fullCalcOnLoad) scAttrs.push('fullCalcOnLoad="1"');
    p.push(`<sheetCalcPr${scAttrs.length ? " " + scAttrs.join(" ") : ""}/>`);
  }
  if (opts.protection) p.push(stringifySheetProtectionXml(opts.protection));
  if (protectedRanges.length > 0) {
    const prParts = ["<protectedRanges>"];
    for (const pr of protectedRanges) {
      const prAttrs = {
        name: pr.name,
        sqref: pr.sqref
      };
      if (pr.password) prAttrs.password = hashPassword(pr.password);
      let prDerived;
      if (pr.password !== void 0 && pr.hashValue === void 0) prDerived = derivePasswordHash(pr.password);
      prAttrs.algorithmName = pr.algorithmName ?? prDerived?.algorithmName;
      prAttrs.hashValue = pr.hashValue ?? prDerived?.hashValue;
      prAttrs.saltValue = pr.saltValue ?? prDerived?.saltValue;
      if (pr.spinCount !== void 0) prAttrs.spinCount = pr.spinCount;
      else if (prDerived) prAttrs.spinCount = prDerived.spinCount;
      if (pr.securityDescriptor) prAttrs.securityDescriptor = pr.securityDescriptor;
      if (!!pr.securityDescriptor) prParts.push(`<protectedRange${attrs(prAttrs)}><securityDescriptor>${escapeXml(pr.securityDescriptor)}</securityDescriptor></protectedRange>`);
      else prParts.push(selfCloseElement("protectedRange", attrs(prAttrs)));
    }
    prParts.push("</protectedRanges>");
    p.push(prParts.join(""));
  }
  if (opts.scenarios) {
    const scParts = ["<scenarios"];
    const scAttrs = {};
    if (opts.scenarios.current !== void 0) scAttrs.current = opts.scenarios.current;
    if (opts.scenarios.show !== void 0) scAttrs.show = opts.scenarios.show;
    scParts[0] = `<scenarios${attrs(scAttrs)}>`;
    for (const scenario of opts.scenarios.scenarios) {
      const sAttrs = { name: scenario.name };
      if (scenario.count !== void 0) sAttrs.count = scenario.count;
      if (scenario.user) sAttrs.user = scenario.user;
      if (scenario.comment) sAttrs.comment = scenario.comment;
      if (scenario.hidden) sAttrs.hidden = true;
      if (scenario.locked) sAttrs.locked = true;
      const sParts = [`<scenario${attrs(sAttrs)}>`];
      for (const cell of scenario.inputCells) {
        const icAttrs = {
          r: cell.reference,
          val: String(cell.val)
        };
        if (cell.deleted) icAttrs.deleted = true;
        if (cell.undone) icAttrs.undone = true;
        sParts.push(`<inputCells${attrs(icAttrs)}/>`);
      }
      sParts.push("</scenario>");
      scParts.push(sParts.join(""));
    }
    scParts.push("</scenarios>");
    p.push(scParts.join(""));
  }
  if (opts.autoFilter) p.push(stringifyAutoFilter(opts.autoFilter));
  if (opts.sortState) p.push(stringifySortStateXml(opts.sortState));
  if (opts.dataConsolidate) {
    const dc = opts.dataConsolidate;
    const dcAttrs = {};
    if (dc.function && dc.function !== "sum") dcAttrs.function = xsdConsolidateFunction.to(dc.function);
    if (dc.topLabels) dcAttrs.topLabels = 1;
    if (dc.leftLabels) dcAttrs.leftLabels = 1;
    if (dc.startLabels) dcAttrs.startLabels = 1;
    if (dc.link) dcAttrs.link = 1;
    const refsInner = dc.refs?.map((r) => `<dataRef ref="${escapeXml(r)}"/>`).join("") ?? "";
    const refsXml = refsInner ? `<dataRefs>${refsInner}</dataRefs>` : "";
    if (refsXml || Object.keys(dcAttrs).length > 0) p.push(`<dataConsolidate${attrs(dcAttrs)}>${refsXml}</dataConsolidate>`);
  }
  if (customSheetViews.length > 0) {
    p.push("<customSheetViews>");
    for (const csv of customSheetViews) {
      const csvAttrs = { guid: csv.guid };
      if (csv.scale !== void 0) csvAttrs.scale = csv.scale;
      if (csv.showPageBreaks) csvAttrs.showPageBreaks = 1;
      if (csv.showFormulas) csvAttrs.showFormulas = 1;
      if (csv.showGridLines === false) csvAttrs.showGridLines = 0;
      if (csv.showRowColHeaders === false) csvAttrs.showRowCol = 0;
      if (csv.outlineSymbols === false) csvAttrs.outlineSymbols = 0;
      if (csv.zeroValues === false) csvAttrs.zeroValues = 0;
      if (csv.fitToPage) csvAttrs.fitToPage = 1;
      if (csv.printArea) csvAttrs.printArea = 1;
      if (csv.filter) csvAttrs.filter = 1;
      if (csv.showAutoFilter) csvAttrs.showAutoFilter = 1;
      if (csv.hiddenRows) csvAttrs.hiddenRows = 1;
      if (csv.hiddenColumns) csvAttrs.hiddenColumns = 1;
      if (csv.state && csv.state !== "visible") csvAttrs.state = csv.state;
      if (csv.filterUnique) csvAttrs.filterUnique = 1;
      if (csv.view && csv.view !== "normal") csvAttrs.view = csv.view;
      p.push(`<customSheetView${attrs(csvAttrs)}/>`);
    }
    p.push("</customSheetViews>");
  }
  if (mergeCells.length > 0) {
    p.push(`<mergeCells count="${mergeCells.length}">`);
    for (const mc of mergeCells) p.push(selfCloseElement("mergeCell", attrs({ ref: mc.ref })));
    p.push("</mergeCells>");
  }
  if (opts.phoneticPr) {
    const pp = opts.phoneticPr;
    const ppAttrs = { fontId: pp.fontId };
    if (pp.type && pp.type !== "fullwidthKatakana") ppAttrs.type = pp.type;
    if (pp.alignment && pp.alignment !== "left") ppAttrs.alignment = pp.alignment;
    p.push(selfCloseElement("phoneticPr", attrs(ppAttrs)));
  }
  const conditionalFormats = opts.conditionalFormats ?? [];
  if (conditionalFormats.length > 0) for (const cf of conditionalFormats) {
    const cfAttrs = cf.pivot ? ` sqref="${cf.sqref}" pivot="1"` : ` sqref="${cf.sqref}"`;
    p.push(`<conditionalFormatting${cfAttrs}>`);
    for (const [ri, rule] of cf.rules.entries()) {
      const ruleAttrs = {
        type: rule.type,
        priority: rule.priority ?? ri + 1
      };
      if (rule.operator) ruleAttrs.operator = rule.operator;
      if (rule.dxfId !== void 0) ruleAttrs.dxfId = rule.dxfId;
      if (rule.stopIfTrue) ruleAttrs.stopIfTrue = 1;
      if (rule.timePeriod) ruleAttrs.timePeriod = rule.timePeriod;
      if (rule.rank !== void 0) ruleAttrs.rank = rule.rank;
      if (rule.bottom) ruleAttrs.bottom = 1;
      if (rule.percent) ruleAttrs.percent = 1;
      if (rule.text !== void 0) ruleAttrs.text = rule.text;
      if (rule.equalAverage) ruleAttrs.equalAverage = 1;
      if (rule.aboveAverage === false) ruleAttrs.aboveAverage = 0;
      if (rule.stdDev !== void 0) ruleAttrs.stdDev = rule.stdDev;
      const formulaXml = rule.formulas?.map((formula) => `<formula>${escapeXml(formula)}</formula>`).join("");
      if (rule.type === "colorScale" && rule.colorScale) {
        const cs = rule.colorScale;
        const inner = [];
        for (const v of cs.cfvo) inner.push(buildCfvoXml(v));
        for (const c of cs.colors) inner.push(buildCfColorXml(c));
        p.push(`<cfRule${attrs(ruleAttrs)}>${formulaXml ?? ""}<colorScale>${inner.join("")}</colorScale></cfRule>`);
      } else if (rule.type === "dataBar" && rule.dataBar) {
        const db = rule.dataBar;
        const inner = [];
        for (const v of db.cfvo) inner.push(buildCfvoXml(v));
        inner.push(buildCfColorXml(db.color));
        const dbAttrs = {};
        if (db.minLength !== void 0 && db.minLength !== 10) dbAttrs.minLength = db.minLength;
        if (db.maxLength !== void 0 && db.maxLength !== 90) dbAttrs.maxLength = db.maxLength;
        if (db.showValue === false) dbAttrs.showValue = 0;
        const attrStr = Object.keys(dbAttrs).length > 0 ? attrs(dbAttrs) : "";
        p.push(`<cfRule${attrs(ruleAttrs)}>${formulaXml ?? ""}<dataBar${attrStr}>${inner.join("")}</dataBar></cfRule>`);
      } else if (rule.type === "iconSet" && rule.iconSet) {
        const is = rule.iconSet;
        const inner = [];
        for (const v of is.cfvo) inner.push(buildCfvoXml(v));
        const isAttrs = {};
        if (is.iconSet !== void 0 && is.iconSet !== "3TrafficLights1") isAttrs.iconSet = is.iconSet;
        if (is.showValue === false) isAttrs.showValue = 0;
        if (is.percent === false) isAttrs.percent = 0;
        if (is.reverse) isAttrs.reverse = 1;
        const attrStr = Object.keys(isAttrs).length > 0 ? attrs(isAttrs) : "";
        p.push(`<cfRule${attrs(ruleAttrs)}>${formulaXml ?? ""}<iconSet${attrStr}>${inner.join("")}</iconSet></cfRule>`);
      } else if (formulaXml) p.push(`<cfRule${attrs(ruleAttrs)}>${formulaXml}</cfRule>`);
      else p.push(selfCloseElement("cfRule", attrs(ruleAttrs)));
    }
    p.push("</conditionalFormatting>");
  }
  const dataValidations = opts.dataValidations ?? [];
  if (dataValidations.length > 0) {
    const dvContainerAttrs = { count: dataValidations.length };
    if (opts.dataValidationsDisablePrompts) dvContainerAttrs.disablePrompts = 1;
    p.push(`<dataValidations${attrs(dvContainerAttrs)}>`);
    for (const dv of dataValidations) {
      const dvAttrs = { sqref: dv.sqref };
      if (dv.type && dv.type !== "none") dvAttrs.type = dv.type;
      if (dv.operator) dvAttrs.operator = dv.operator;
      if (dv.allowBlank) dvAttrs.allowBlank = 1;
      if (dv.showErrorMessage) dvAttrs.showErrorMessage = 1;
      if (dv.showInputMessage) dvAttrs.showInputMessage = 1;
      if (dv.errorTitle) dvAttrs.errorTitle = dv.errorTitle;
      if (dv.error) dvAttrs.error = dv.error;
      if (dv.promptTitle) dvAttrs.promptTitle = dv.promptTitle;
      if (dv.prompt) dvAttrs.prompt = dv.prompt;
      if (dv.errorStyle) dvAttrs.errorStyle = dv.errorStyle;
      if (dv.imeMode) dvAttrs.imeMode = dv.imeMode;
      if (dv.showDropDown) dvAttrs.showDropDown = 1;
      const inner = [];
      if (dv.formula1 !== void 0) inner.push(`<formula1>${escapeXml(dv.formula1)}</formula1>`);
      if (dv.formula2 !== void 0) inner.push(`<formula2>${escapeXml(dv.formula2)}</formula2>`);
      if (inner.length > 0) p.push(`<dataValidation${attrs(dvAttrs)}>`, ...inner, "</dataValidation>");
      else p.push(selfCloseElement("dataValidation", attrs(dvAttrs)));
    }
    p.push("</dataValidations>");
  }
  const hyperlinks = opts.hyperlinks ?? [];
  if (hyperlinks.length > 0) {
    p.push("<hyperlinks>");
    let hlIdx = 0;
    for (const hl of hyperlinks) {
      const hlAttrs = { ref: hl.cell };
      if (hl.url !== void 0) {
        hlIdx++;
        hlAttrs["r:id"] = `rId${hlIdx}`;
      }
      if (hl.location !== void 0) hlAttrs.location = hl.location;
      if (hl.tooltip) hlAttrs.tooltip = hl.tooltip;
      if (hl.display) hlAttrs.display = hl.display;
      p.push(selfCloseElement("hyperlink", attrs(hlAttrs)));
    }
    p.push("</hyperlinks>");
  }
  if (opts.printOptions) p.push(stringifyPrintOptionsXml(opts.printOptions));
  if (opts.pageMargins) {
    const pm = opts.pageMargins;
    p.push(`<pageMargins${attrs({
      left: convertToInch(pm.left ?? 0.75),
      right: convertToInch(pm.right ?? 0.75),
      top: convertToInch(pm.top ?? 1),
      bottom: convertToInch(pm.bottom ?? 1),
      header: convertToInch(pm.header ?? 0.5),
      footer: convertToInch(pm.footer ?? 0.5)
    })}/>`);
  } else p.push('<pageMargins left="0.75" right="0.75" top="1" bottom="1" header="0.5" footer="0.5"/>');
  if (opts.pageSetup && Object.keys(opts.pageSetup).some((k) => k !== "fitToPage" && k !== "autoPageBreaks")) p.push(stringifyPageSetupXml(opts.pageSetup));
  if (opts.headerFooter) {
    const hfXml = stringifyHeaderFooterXml(opts.headerFooter);
    if (hfXml) p.push(hfXml);
  }
  if (rowBreaks.length > 0) {
    let manualCount = 0;
    const brkParts = rowBreaks.map((b) => {
      const bAttrs = { id: b.id };
      if (b.min !== void 0) bAttrs.min = b.min;
      if (b.max !== void 0) bAttrs.max = b.max;
      if (b.manual) {
        bAttrs.man = 1;
        manualCount++;
      }
      if (b.pivot) bAttrs.pt = 1;
      return `<brk${attrs(bAttrs)}/>`;
    });
    p.push(`<rowBreaks count="${rowBreaks.length}" manualBreakCount="${manualCount}">${brkParts.join("")}</rowBreaks>`);
  }
  if (colBreaks.length > 0) {
    let manualCount = 0;
    const brkParts = colBreaks.map((b) => {
      const bAttrs = { id: b.id };
      if (b.min !== void 0) bAttrs.min = b.min;
      if (b.max !== void 0) bAttrs.max = b.max;
      if (b.manual) {
        bAttrs.man = 1;
        manualCount++;
      }
      if (b.pivot) bAttrs.pt = 1;
      return `<brk${attrs(bAttrs)}/>`;
    });
    p.push(`<colBreaks count="${colBreaks.length}" manualBreakCount="${manualCount}">${brkParts.join("")}</colBreaks>`);
  }
  if (customProperties.length > 0) {
    const cpParts = ["<customProperties>"];
    for (const cp of customProperties) cpParts.push(`<customPr name="${escapeXml(cp.name)}" r:id="${escapeXml(cp.rId)}"/>`);
    cpParts.push("</customProperties>");
    p.push(cpParts.join(""));
  }
  if (cellWatches.length > 0) {
    p.push("<cellWatches>");
    for (const cw of cellWatches) p.push(`<cellWatch r="${escapeXml(cw.reference)}"/>`);
    p.push("</cellWatches>");
  }
  if (ignoredErrors.length > 0) {
    const ieParts = ["<ignoredErrors>"];
    for (const ie of ignoredErrors) {
      const ieAttrs = { sqref: ie.sqref };
      if (ie.evalError) ieAttrs.evalError = 1;
      if (ie.twoDigitTextYear) ieAttrs.twoDigitTextYear = 1;
      if (ie.numberStoredAsText) ieAttrs.numberStoredAsText = 1;
      if (ie.formula) ieAttrs.formula = 1;
      if (ie.formulaRange) ieAttrs.formulaRange = 1;
      if (ie.unlockedFormula) ieAttrs.unlockedFormula = 1;
      if (ie.emptyCellReference) ieAttrs.emptyCellReference = 1;
      if (ie.listDataValidation) ieAttrs.listDataValidation = 1;
      if (ie.calculatedColumn) ieAttrs.calculatedColumn = 1;
      ieParts.push(selfCloseElement("ignoredError", attrs(ieAttrs)));
    }
    ieParts.push("</ignoredErrors>");
    p.push(ieParts.join(""));
  }
  if (opts.smartTags && opts.smartTags.length > 0) {
    const stParts = ["<smartTags>"];
    for (const cst of opts.smartTags) {
      stParts.push(`<cellSmartTags r="${escapeXml(cst.reference)}">`);
      for (const st of cst.smartTags) {
        const stAttrs = [`type="${st.type}"`];
        if (st.deleted) stAttrs.push('deleted="1"');
        if (st.xmlBased) stAttrs.push('xmlBased="1"');
        const prXml = st.properties ? st.properties.map((pr) => `<cellSmartTagPr key="${escapeXml(pr.key)}" val="${escapeXml(pr.val)}"/>`).join("") : "";
        stParts.push(prXml ? `<cellSmartTag ${stAttrs.join(" ")}>${prXml}</cellSmartTag>` : `<cellSmartTag ${stAttrs.join(" ")}/>`);
      }
      stParts.push("</cellSmartTags>");
    }
    stParts.push("</smartTags>");
    p.push(stParts.join(""));
  }
  p.push("<!--DRAWING-->");
  p.push("<!--LEGACY_DRAWING-->");
  if (opts.legacyDrawingHF) p.push(`<legacyDrawingHF r:id="${escapeXml(opts.legacyDrawingHF)}"/>`);
  if (opts.drawingHF) {
    const dhf = opts.drawingHF;
    const dhfAttrs = { "r:id": dhf.rId };
    if (dhf.lho !== void 0) dhfAttrs.lho = dhf.lho;
    if (dhf.lhe !== void 0) dhfAttrs.lhe = dhf.lhe;
    if (dhf.lhf !== void 0) dhfAttrs.lhf = dhf.lhf;
    if (dhf.cho !== void 0) dhfAttrs.cho = dhf.cho;
    if (dhf.che !== void 0) dhfAttrs.che = dhf.che;
    if (dhf.chf !== void 0) dhfAttrs.chf = dhf.chf;
    if (dhf.rho !== void 0) dhfAttrs.rho = dhf.rho;
    if (dhf.rhe !== void 0) dhfAttrs.rhe = dhf.rhe;
    if (dhf.rhf !== void 0) dhfAttrs.rhf = dhf.rhf;
    if (dhf.lfo !== void 0) dhfAttrs.lfo = dhf.lfo;
    if (dhf.lfe !== void 0) dhfAttrs.lfe = dhf.lfe;
    if (dhf.lff !== void 0) dhfAttrs.lff = dhf.lff;
    if (dhf.cfo !== void 0) dhfAttrs.cfo = dhf.cfo;
    if (dhf.cfe !== void 0) dhfAttrs.cfe = dhf.cfe;
    if (dhf.cff !== void 0) dhfAttrs.cff = dhf.cff;
    if (dhf.rfo !== void 0) dhfAttrs.rfo = dhf.rfo;
    if (dhf.rfe !== void 0) dhfAttrs.rfe = dhf.rfe;
    if (dhf.rff !== void 0) dhfAttrs.rff = dhf.rff;
    p.push(selfCloseElement("drawingHF", attrs(dhfAttrs)));
  }
  if (opts.backgroundImage) p.push("<!--BACKGROUND_PICTURE-->");
  function anchorMarkerXml(tag, m) {
    return `<${tag}><xdr:col>${m.col}</xdr:col><xdr:colOff>${m.colOff ?? 0}</xdr:colOff><xdr:row>${m.row}</xdr:row><xdr:rowOff>${m.rowOff ?? 0}</xdr:rowOff></${tag}>`;
  }
  function embeddedAnchorXml(anchor) {
    return `<anchor ${[
      `xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"`,
      ...anchor.moveWithCells ? ['moveWithCells="1"'] : [],
      ...anchor.sizeWithCells ? ['sizeWithCells="1"'] : []
    ].join(" ")}>${anchorMarkerXml("from", anchor.from)}${anchorMarkerXml("to", anchor.to)}</anchor>`;
  }
  function wrapAlternateContent(choiceXml, fallbackXml, wrapped) {
    if (!wrapped) return choiceXml;
    return `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main" Requires="x14">${choiceXml}</mc:Choice><mc:Fallback>${fallbackXml}</mc:Fallback></mc:AlternateContent>`;
  }
  if (oleObjects.length > 0) {
    const oleParts = ["<oleObjects>"];
    for (const ole of oleObjects) {
      const oleAttrs = [`shapeId="${ole.shapeId}"`];
      if (ole.progId) oleAttrs.push(`progId="${escapeXml(ole.progId)}"`);
      if (ole.dvAspect && ole.dvAspect !== "DVASPECT_CONTENT") oleAttrs.push(`dvAspect="${ole.dvAspect}"`);
      if (ole.link) oleAttrs.push(`link="${escapeXml(ole.link)}"`);
      if (ole.oleUpdate) oleAttrs.push(`oleUpdate="${ole.oleUpdate}"`);
      if (ole.autoLoad) oleAttrs.push('autoLoad="1"');
      if (ole.rId) oleAttrs.push(`r:id="${escapeXml(ole.rId)}"`);
      let innerXml;
      if (ole.objectPr) {
        const opr = ole.objectPr;
        const oprAttrs = [];
        if (opr.locked === false) oprAttrs.push('locked="0"');
        if (opr.defaultSize === false) oprAttrs.push('defaultSize="0"');
        if (opr.print === false) oprAttrs.push('print="0"');
        if (opr.disabled) oprAttrs.push('disabled="1"');
        if (opr.uiObject) oprAttrs.push('uiObject="1"');
        if (opr.autoFill === false) oprAttrs.push('autoFill="0"');
        if (opr.autoLine === false) oprAttrs.push('autoLine="0"');
        if (opr.autoPict === false) oprAttrs.push('autoPict="0"');
        if (opr.macro) oprAttrs.push(`macro="${escapeXml(opr.macro)}"`);
        if (opr.altText) oprAttrs.push(`altText="${escapeXml(opr.altText)}"`);
        if (opr.dde) oprAttrs.push('dde="1"');
        if (opr.iconRid) oprAttrs.push(`r:id="${escapeXml(opr.iconRid)}"`);
        const anchorXml = opr.anchor ? embeddedAnchorXml(opr.anchor) : "";
        innerXml = `<objectPr${oprAttrs.length ? " " + oprAttrs.join(" ") : ""}>${anchorXml}</objectPr>`;
      } else innerXml = "";
      const full = innerXml ? `<oleObject ${oleAttrs.join(" ")}>${innerXml}</oleObject>` : `<oleObject ${oleAttrs.join(" ")}/>`;
      oleParts.push(wrapAlternateContent(full, `<oleObject ${oleAttrs.join(" ")}/>`, ole.alternateContent));
    }
    oleParts.push("</oleObjects>");
    p.push(oleParts.join(""));
  }
  if (controls.length > 0) {
    const ctrlParts = ["<controls>"];
    for (const c of controls) {
      const cAttrs = [`shapeId="${c.shapeId}"`, `r:id="${escapeXml(c.rId)}"`];
      if (c.name) cAttrs.push(`name="${escapeXml(c.name)}"`);
      const prAttrs = [];
      if (c.locked === false) prAttrs.push('locked="0"');
      if (c.uiObject) prAttrs.push('uiObject="1"');
      if (c.recalcAlways) prAttrs.push('recalcAlways="1"');
      if (c.linkedCell) prAttrs.push(`linkedCell="${escapeXml(c.linkedCell)}"`);
      if (c.listFillRange) prAttrs.push(`listFillRange="${escapeXml(c.listFillRange)}"`);
      if (c.formula) prAttrs.push(`cf="${escapeXml(c.formula)}"`);
      if (c.defaultSize === false) prAttrs.push('defaultSize="0"');
      if (c.autoLine === false) prAttrs.push('autoLine="0"');
      if (c.autoPict === false) prAttrs.push('autoPict="0"');
      if (c.iconRid) prAttrs.push(`r:id="${escapeXml(c.iconRid)}"`);
      const anchorXml = c.anchor ? embeddedAnchorXml(c.anchor) : "";
      const full = prAttrs.length > 0 || anchorXml ? `<control ${cAttrs.join(" ")}><controlPr${prAttrs.length ? " " + prAttrs.join(" ") : ""}>${anchorXml}</controlPr></control>` : `<control ${cAttrs.join(" ")}/>`;
      ctrlParts.push(wrapAlternateContent(full, `<control ${cAttrs.join(" ")}/>`, c.alternateContent));
    }
    ctrlParts.push("</controls>");
    p.push(ctrlParts.join(""));
  }
  if (webPublishItems.length > 0) {
    const wpParts = [`<webPublishItems count="${webPublishItems.length}">`];
    for (const wpi of webPublishItems) {
      const wpiAttrs = [
        `id="${wpi.id}"`,
        `divId="${escapeXml(wpi.divId)}"`,
        `sourceType="${wpi.sourceType}"`,
        `destinationFile="${escapeXml(wpi.destinationFile)}"`
      ];
      if (wpi.sourceRef) wpiAttrs.push(`sourceRef="${escapeXml(wpi.sourceRef)}"`);
      if (wpi.sourceObject) wpiAttrs.push(`sourceObject="${escapeXml(wpi.sourceObject)}"`);
      if (wpi.title) wpiAttrs.push(`title="${escapeXml(wpi.title)}"`);
      if (wpi.autoRepublish) wpiAttrs.push('autoRepublish="1"');
      wpParts.push(`<webPublishItem ${wpiAttrs.join(" ")}/>`);
    }
    wpParts.push("</webPublishItems>");
    p.push(wpParts.join(""));
  }
  p.push("<!--TABLE_PARTS-->");
  if (opts.ext) p.push(`<extLst>${opts.ext}</extLst>`);
  p.push("</worksheet>");
  return p.join("");
}
function buildCfvoXml(cfvo) {
  const a = { type: cfvo.type };
  if (cfvo.val !== void 0) a.val = cfvo.val;
  if (cfvo.gte === false) a.gte = 0;
  return `<cfvo${attrs(a)}/>`;
}
function buildCfColorXml(color) {
  if (color.rgb !== void 0) return `<color rgb="FF${color.rgb}"/>`;
  const a = {};
  if (color.theme !== void 0) {
    a.theme = color.theme;
    if (color.tint !== void 0) a.tint = color.tint;
  }
  if (color.indexed !== void 0) a.indexed = color.indexed;
  return `<color${attrs(a)}/>`;
}
function buildSheetViewAttrs(sv) {
  const svMap = { workbookViewId: 0 };
  if (sv?.tabSelected !== void 0) svMap.tabSelected = sv.tabSelected ? 1 : 0;
  if (sv?.showGridLines === false) svMap.showGridLines = 0;
  if (sv?.showRowColHeaders === false) svMap.showRowColHeaders = 0;
  if (sv?.showZeros === false) svMap.showZeros = 0;
  if (sv?.zoomScale !== void 0) svMap.zoomScale = sv.zoomScale;
  if (sv?.rightToLeft) svMap.rightToLeft = 1;
  if (sv?.windowProtection) svMap.windowProtection = 1;
  if (sv?.showFormulas) svMap.showFormulas = 1;
  if (sv?.showRuler === false) svMap.showRuler = 0;
  if (sv?.showOutlineSymbols === false) svMap.showOutlineSymbols = 0;
  if (sv?.defaultGridColor === false) svMap.defaultGridColor = 0;
  if (sv?.showWhiteSpace === false) svMap.showWhiteSpace = 0;
  if (sv?.view) svMap.view = sv.view;
  if (sv?.topLeftCell) svMap.topLeftCell = sv.topLeftCell;
  if (sv?.colorId !== void 0) svMap.colorId = sv.colorId;
  if (sv?.zoomScaleNormal !== void 0) svMap.zoomScaleNormal = sv.zoomScaleNormal;
  if (sv?.zoomScaleSheetLayoutView !== void 0) svMap.zoomScaleSheetLayoutView = sv.zoomScaleSheetLayoutView;
  if (sv?.zoomScalePageLayoutView !== void 0) svMap.zoomScalePageLayoutView = sv.zoomScalePageLayoutView;
  return attrs(svMap);
}
function buildPivotSelectionXml(ps) {
  const psAttrs = [];
  if (ps.pane) psAttrs.push(`pane="${ps.pane}"`);
  if (ps.showHeader) psAttrs.push('showHeader="1"');
  if (ps.label) psAttrs.push('label="1"');
  if (ps.data) psAttrs.push('data="1"');
  if (ps.extendable) psAttrs.push('extendable="1"');
  if (ps.count !== void 0) psAttrs.push(`count="${ps.count}"`);
  if (ps.axis) psAttrs.push(`axis="${ps.axis}"`);
  if (ps.dimension !== void 0) psAttrs.push(`dimension="${ps.dimension}"`);
  if (ps.start !== void 0) psAttrs.push(`start="${ps.start}"`);
  if (ps.min !== void 0) psAttrs.push(`min="${ps.min}"`);
  if (ps.max !== void 0) psAttrs.push(`max="${ps.max}"`);
  if (ps.activeRow !== void 0) psAttrs.push(`activeRow="${ps.activeRow}"`);
  if (ps.activeCol !== void 0) psAttrs.push(`activeCol="${ps.activeCol}"`);
  if (ps.previousRow !== void 0) psAttrs.push(`previousRow="${ps.previousRow}"`);
  if (ps.previousCol !== void 0) psAttrs.push(`previousCol="${ps.previousCol}"`);
  if (ps.click !== void 0) psAttrs.push(`click="${ps.click}"`);
  if (ps.rId) psAttrs.push(`r:id="${escapeXml(ps.rId)}"`);
  const areaXml = ps.pivotArea ? buildPivotAreaXml(ps.pivotArea) : "";
  const attrStr = psAttrs.join(" ");
  return areaXml ? `<pivotSelection ${attrStr}>${areaXml}</pivotSelection>` : `<pivotSelection ${attrStr}/>`;
}
function buildSelectionXml(sel) {
  const selAttrs = {};
  if (sel.pane) selAttrs.pane = sel.pane;
  if (sel.activeCell) selAttrs.activeCell = sel.activeCell;
  if (sel.activeCellId !== void 0) selAttrs.activeCellId = sel.activeCellId;
  if (sel.sqref) selAttrs.sqref = sel.sqref;
  return `<selection${attrs(selAttrs)}/>`;
}
function buildFormulaString(cellFormula) {
  const fOpts = typeof cellFormula === "string" ? { formula: cellFormula } : cellFormula;
  const fAttrs = {};
  if (fOpts.type && fOpts.type !== FormulaType.NORMAL) fAttrs.t = fOpts.type;
  if (fOpts.reference) fAttrs.ref = fOpts.reference;
  if (fOpts.sharedIndex !== void 0) fAttrs.si = fOpts.sharedIndex;
  if (fOpts.aca) fAttrs.aca = 1;
  if (fOpts.dt2D) fAttrs.dt2D = 1;
  if (fOpts.dtr) fAttrs.dtr = 1;
  if (fOpts.del1) fAttrs.del1 = 1;
  if (fOpts.del2) fAttrs.del2 = 1;
  if (fOpts.inputCell1) fAttrs.r1 = fOpts.inputCell1;
  if (fOpts.inputCell2) fAttrs.r2 = fOpts.inputCell2;
  if (fOpts.calculateCell) fAttrs.ca = 1;
  if (fOpts.arrayContext) fAttrs.bx = 1;
  if (fOpts.formula !== void 0 && fOpts.formula !== "") return `<f${attrs(fAttrs)}>${escapeXml(fOpts.formula)}</f>`;
  if (Object.keys(fAttrs).length > 0) return selfCloseElement("f", attrs(fAttrs));
  return "";
}
function appendSheetDataRows(rows, out, sharedStrings, styles, startRowNumber = 1) {
  for (let i = 0; i < rows.length; i++) {
    const rowOpts = rows[i];
    const rowNumber = rowOpts.rowNumber ?? startRowNumber + i;
    let rowAttr = ` r="${rowNumber}"`;
    if (rowOpts.height !== void 0) rowAttr += ` ht="${convertToPt(rowOpts.height)}" customHeight="1"`;
    if (rowOpts.hidden) rowAttr += ' hidden="1"';
    if (rowOpts.spans) rowAttr += ` spans="${rowOpts.spans}"`;
    let hasStyle = false;
    if (typeof rowOpts.style === "number") {
      rowAttr += ` s="${rowOpts.style}"`;
      hasStyle = true;
    } else if (rowOpts.style !== void 0 && styles) {
      rowAttr += ` s="${styles.register(rowOpts.style)}"`;
      hasStyle = true;
    }
    if (rowOpts.customFormat || hasStyle) rowAttr += ' customFormat="1"';
    if (rowOpts.thickTop) rowAttr += ' thickTop="1"';
    if (rowOpts.thickBot) rowAttr += ' thickBot="1"';
    if (rowOpts.phonetic) rowAttr += ' ph="1"';
    if (rowOpts.outlineLevel !== void 0) rowAttr += ` outlineLevel="${rowOpts.outlineLevel}"`;
    if (rowOpts.collapsed) rowAttr += ' collapsed="1"';
    const cells = rowOpts.cells;
    if (cells) {
      out.push(`<row${rowAttr}>`);
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const cellStr = buildCellString(cell.reference ?? defaultCellRef(rowNumber, j + 1), cell, sharedStrings, styles);
        if (cellStr) out.push(cellStr);
      }
      out.push("</row>");
    } else out.push(`<row${rowAttr}/>`);
  }
}
function editSheetTailMarker(xml, marker, replacement) {
  const tailStart = findSheetTailStart(xml);
  if (tailStart === -1) return xml;
  const tail = xml.slice(tailStart);
  const at = tail.indexOf(marker);
  if (at === -1) return xml;
  return xml.slice(0, tailStart) + tail.slice(0, at) + replacement + tail.slice(at + marker.length);
}
function findSheetTailStart(xml) {
  let at = xml.lastIndexOf("</sheetData>");
  if (at === -1) at = xml.lastIndexOf("<sheetData/>");
  return at;
}
function stripWorksheetPlaceholders(xml) {
  let out = editSheetTailMarker(xml, "<!--BACKGROUND_PICTURE-->", "");
  out = editSheetTailMarker(out, "<!--TABLE_PARTS-->", "");
  out = editSheetTailMarker(out, "<!--LEGACY_DRAWING-->", "");
  return editSheetTailMarker(out, "<!--DRAWING-->", "");
}
function buildCellString(ref, cell, sharedStrings, styles) {
  const rAttr = ` r="${ref}"`;
  let sAttr = "";
  if (typeof cell.style === "number") sAttr = ` s="${cell.style}"`;
  else if (cell.style !== void 0 && styles) sAttr = ` s="${styles.register(cell.style)}"`;
  let mdAttr = "";
  if (cell.cellMetadataId !== void 0) mdAttr += ` cm="${cell.cellMetadataId}"`;
  if (cell.valueMetadataId !== void 0) mdAttr += ` vm="${cell.valueMetadataId}"`;
  const value = cell.value;
  if (cell.error !== void 0) {
    const errorV = cell.formula ? `${buildFormulaString(cell.formula)}<v>${escapeXml(cell.error)}</v>` : `<v>${escapeXml(cell.error)}</v>`;
    return `<c${rAttr}${sAttr}${mdAttr} t="e">${errorV}</c>`;
  }
  if (cell.formula) {
    const fStr = buildFormulaString(cell.formula);
    if (value === null || value === void 0) return `<c${rAttr}${sAttr}${mdAttr}>${fStr}</c>`;
    let vStr = "";
    let tAttr = "";
    if (typeof value === "number") vStr = `<v>${value}</v>`;
    else if (typeof value === "boolean") {
      tAttr = ' t="b"';
      vStr = `<v>${value ? 1 : 0}</v>`;
    } else if (typeof value === "string") {
      tAttr = ' t="str"';
      vStr = `<v>${escapeXml(value)}</v>`;
    } else if (value instanceof Date) vStr = `<v>${dateToSerialNumber(value)}</v>`;
    if (vStr) return `<c${rAttr}${sAttr}${mdAttr}${tAttr}>${fStr}${vStr}</c>`;
    return `<c${rAttr}${sAttr}${mdAttr}>${fStr}</c>`;
  }
  if (value === null || value === void 0) {
    if (cell.reference !== void 0 || cell.style !== void 0 || mdAttr) return `<c${rAttr}${sAttr}${mdAttr}/>`;
    return "";
  }
  if (typeof value === "object" && !(value instanceof Date)) {
    if (sharedStrings) {
      const idx = sharedStrings.registerRich(value);
      return `<c${rAttr}${sAttr}${mdAttr} t="s"><v>${idx}</v></c>`;
    }
    return `<c${rAttr}${sAttr}${mdAttr} t="inlineStr"><is>${buildRstXml(value)}</is></c>`;
  }
  if (typeof value === "string") {
    if (sharedStrings) {
      const idx = sharedStrings.register(value);
      return `<c${rAttr}${sAttr}${mdAttr} t="s"><v>${idx}</v></c>`;
    }
    return `<c${rAttr}${sAttr}${mdAttr} t="inlineStr"><is>${tElement(value)}</is></c>`;
  }
  if (typeof value === "number") return `<c${rAttr}${sAttr}${mdAttr}><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c${rAttr}${sAttr}${mdAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
  if (value instanceof Date) {
    const serial = dateToSerialNumber(value);
    return `<c${rAttr}${sAttr}${mdAttr}><v>${serial}</v></c>`;
  }
  return "";
}
function defaultCellRef(row, col) {
  return columnToLetter(col) + row;
}
function stringifyPageSetupXml(ps) {
  const psAttrs = {};
  if (ps.paperSize !== void 0) psAttrs.paperSize = ps.paperSize;
  if (ps.orientation && ps.orientation !== "default") psAttrs.orientation = ps.orientation;
  if (ps.scale !== void 0) psAttrs.scale = ps.scale;
  if (ps.fitToWidth !== void 0) psAttrs.fitToWidth = ps.fitToWidth;
  if (ps.fitToHeight !== void 0) psAttrs.fitToHeight = ps.fitToHeight;
  if (ps.pageOrder && ps.pageOrder !== "downThenOver") psAttrs.pageOrder = ps.pageOrder;
  if (ps.useFirstPageNumber) psAttrs.useFirstPageNumber = 1;
  if (ps.firstPageNumber !== void 0) psAttrs.firstPageNumber = ps.firstPageNumber;
  if (ps.paperHeight !== void 0) psAttrs.paperHeight = typeof ps.paperHeight === "number" ? `${ps.paperHeight}mm` : ps.paperHeight;
  if (ps.paperWidth !== void 0) psAttrs.paperWidth = typeof ps.paperWidth === "number" ? `${ps.paperWidth}mm` : ps.paperWidth;
  if (ps.usePrinterDefaults === false) psAttrs.usePrinterDefaults = 0;
  if (ps.blackAndWhite) psAttrs.blackAndWhite = 1;
  if (ps.draft) psAttrs.draft = 1;
  if (ps.cellComments && ps.cellComments !== "none") psAttrs.cellComments = ps.cellComments;
  if (ps.errors && ps.errors !== "displayed") psAttrs.errors = ps.errors;
  if (ps.horizontalDpi !== void 0) psAttrs.horizontalDpi = ps.horizontalDpi;
  if (ps.verticalDpi !== void 0) psAttrs.verticalDpi = ps.verticalDpi;
  if (ps.copies !== void 0) psAttrs.copies = ps.copies;
  if (ps.printerSettingsRId) psAttrs["r:id"] = ps.printerSettingsRId;
  return selfCloseElement("pageSetup", attrs(psAttrs));
}
function stringifyPrintOptionsXml(po) {
  const poAttrs = {};
  if (po.horizontalCentered) poAttrs.horizontalCentered = 1;
  if (po.verticalCentered) poAttrs.verticalCentered = 1;
  if (po.headings) poAttrs.headings = 1;
  if (po.gridLines) poAttrs.gridLines = 1;
  if (po.gridLinesSet === false) poAttrs.gridLinesSet = 0;
  return selfCloseElement("printOptions", attrs(poAttrs));
}
function stringifyHeaderFooterXml(hf) {
  const hfAttrs = {};
  if (hf.differentOddEven) hfAttrs.differentOddEven = 1;
  if (hf.differentFirst) hfAttrs.differentFirst = 1;
  if (hf.scaleWithDoc === false) hfAttrs.scaleWithDoc = 0;
  if (hf.alignWithMargins === false) hfAttrs.alignWithMargins = 0;
  const inner = [];
  if (hf.oddHeader) inner.push(`<oddHeader>${escapeXml(hf.oddHeader)}</oddHeader>`);
  if (hf.oddFooter) inner.push(`<oddFooter>${escapeXml(hf.oddFooter)}</oddFooter>`);
  if (hf.evenHeader) inner.push(`<evenHeader>${escapeXml(hf.evenHeader)}</evenHeader>`);
  if (hf.evenFooter) inner.push(`<evenFooter>${escapeXml(hf.evenFooter)}</evenFooter>`);
  if (hf.firstHeader) inner.push(`<firstHeader>${escapeXml(hf.firstHeader)}</firstHeader>`);
  if (hf.firstFooter) inner.push(`<firstFooter>${escapeXml(hf.firstFooter)}</firstFooter>`);
  if (inner.length > 0) return `<headerFooter${attrs(hfAttrs)}>${inner.join("")}</headerFooter>`;
  if (Object.keys(hfAttrs).length > 0) return selfCloseElement("headerFooter", attrs(hfAttrs));
}
function stringifySheetProtectionXml(prot) {
  const protAttrs = {};
  if (prot.password) protAttrs.password = hashPassword(prot.password);
  let derived;
  if (prot.password !== void 0 && prot.hashValue === void 0) derived = derivePasswordHash(prot.password);
  protAttrs.algorithmName = prot.algorithmName ?? derived?.algorithmName;
  protAttrs.hashValue = prot.hashValue ?? derived?.hashValue;
  protAttrs.saltValue = prot.saltValue ?? derived?.saltValue;
  if (prot.spinCount !== void 0) protAttrs.spinCount = prot.spinCount;
  else if (derived) protAttrs.spinCount = derived.spinCount;
  if (prot.sheet) protAttrs.sheet = 1;
  if (prot.objects) protAttrs.objects = 1;
  if (prot.scenarios) protAttrs.scenarios = 1;
  if (prot.formatCells === false) protAttrs.formatCells = 0;
  if (prot.formatColumns === false) protAttrs.formatColumns = 0;
  if (prot.formatRows === false) protAttrs.formatRows = 0;
  if (prot.insertColumns === false) protAttrs.insertColumns = 0;
  if (prot.insertRows === false) protAttrs.insertRows = 0;
  if (prot.insertHyperlinks === false) protAttrs.insertHyperlinks = 0;
  if (prot.deleteColumns === false) protAttrs.deleteColumns = 0;
  if (prot.deleteRows === false) protAttrs.deleteRows = 0;
  if (prot.selectLockedCells) protAttrs.selectLockedCells = 1;
  if (prot.sort === false) protAttrs.sort = 0;
  if (prot.autoFilter === false) protAttrs.autoFilter = 0;
  if (prot.pivotTables === false) protAttrs.pivotTables = 0;
  if (prot.selectUnlockedCells) protAttrs.selectUnlockedCells = 1;
  return selfCloseElement("sheetProtection", attrs(protAttrs));
}
var calcChainDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const parts = ['<calcChain xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    for (const cell of opts.cells) {
      const cellAttrs = {
        r: cell.reference,
        i: cell.sheetIndex
      };
      if (cell.array) cellAttrs.a = true;
      if (cell.childChain) cellAttrs.l = true;
      parts.push(`<c${attrs(cellAttrs)}/>`);
    }
    parts.push("</calcChain>");
    return parts.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const cells = [];
    for (const child of el.elements ?? []) {
      if (child.name !== "c") continue;
      const r = child.attributes?.["r"];
      const i = child.attributes?.["i"];
      if (r && i) {
        const cell = {
          reference: String(r),
          sheetIndex: Number(i)
        };
        if (child.attributes?.["a"]) cell.array = true;
        if (parseOnOff(child.attributes?.["l"])) cell.childChain = true;
        cells.push(cell);
      }
    }
    result.cells = cells;
    return result;
  }
};
var chartsheetDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<chartsheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
    if (opts.tabColor || opts.published !== void 0 || opts.codeName) {
      const prAttrs = [];
      if (opts.tabColor) prAttrs.push(`<tabColor${attrs({ rgb: opts.tabColor })}/>`);
      const spAttrs = [];
      if (opts.published === false) spAttrs.push(' published="0"');
      if (opts.codeName) spAttrs.push(` codeName="${escapeXml(opts.codeName)}"`);
      p.push(`<sheetPr${spAttrs.join("")}>${prAttrs.join("")}</sheetPr>`);
    }
    const svAttrs = [];
    if (opts.tabSelected) svAttrs.push('tabSelected="1"');
    if (opts.zoomScale !== void 0) svAttrs.push(`zoomScale="${opts.zoomScale}"`);
    if (opts.zoomToFit) svAttrs.push('zoomToFit="1"');
    svAttrs.push('workbookViewId="0"');
    p.push(`<sheetViews><sheetView ${svAttrs.join(" ")}/></sheetViews>`);
    if (opts.sheetProtection) {
      const sp = opts.sheetProtection;
      const spAttrs = {};
      if (sp.password) spAttrs.password = hashPassword(sp.password);
      let derived;
      if (sp.password !== void 0 && sp.hashValue === void 0) derived = derivePasswordHash(sp.password);
      spAttrs.algorithmName = sp.algorithmName ?? derived?.algorithmName;
      spAttrs.hashValue = sp.hashValue ?? derived?.hashValue;
      spAttrs.saltValue = sp.saltValue ?? derived?.saltValue;
      if (sp.spinCount !== void 0) spAttrs.spinCount = sp.spinCount;
      else if (derived) spAttrs.spinCount = derived.spinCount;
      if (sp.content) spAttrs.content = 1;
      if (sp.objects) spAttrs.objects = 1;
      if (Object.keys(spAttrs).length > 0) p.push(`<sheetProtection${attrs(spAttrs)}/>`);
    }
    if (opts.pageMargins) {
      const pm = opts.pageMargins;
      p.push(`<pageMargins${attrs({
        left: convertToInch(pm.left ?? 0.7),
        right: convertToInch(pm.right ?? 0.7),
        top: convertToInch(pm.top ?? 0.75),
        bottom: convertToInch(pm.bottom ?? 0.75),
        header: convertToInch(pm.header ?? 0.3),
        footer: convertToInch(pm.footer ?? 0.3)
      })}/>`);
    }
    if (opts.pageSetup) {
      const ps = opts.pageSetup;
      const psAttrs = {};
      if (ps.paperSize !== void 0) psAttrs.paperSize = ps.paperSize;
      if (ps.paperHeight !== void 0) psAttrs.paperHeight = typeof ps.paperHeight === "number" ? `${ps.paperHeight}mm` : ps.paperHeight;
      if (ps.paperWidth !== void 0) psAttrs.paperWidth = typeof ps.paperWidth === "number" ? `${ps.paperWidth}mm` : ps.paperWidth;
      if (ps.firstPageNumber !== void 0) psAttrs.firstPageNumber = ps.firstPageNumber;
      if (ps.orientation && ps.orientation !== "default") psAttrs.orientation = ps.orientation;
      if (ps.usePrinterDefaults === false) psAttrs.usePrinterDefaults = 0;
      if (ps.blackAndWhite) psAttrs.blackAndWhite = 1;
      if (ps.draft) psAttrs.draft = 1;
      if (ps.useFirstPageNumber) psAttrs.useFirstPageNumber = 1;
      if (ps.horizontalDpi !== void 0) psAttrs.horizontalDpi = ps.horizontalDpi;
      if (ps.verticalDpi !== void 0) psAttrs.verticalDpi = ps.verticalDpi;
      if (ps.copies !== void 0) psAttrs.copies = ps.copies;
      if (ps.printerSettingsRId) psAttrs["r:id"] = ps.printerSettingsRId;
      p.push(`<pageSetup${attrs(psAttrs)}/>`);
    }
    if (opts.headerFooter) {
      const hfXml = stringifyHeaderFooterXml(opts.headerFooter);
      if (hfXml) p.push(hfXml);
    }
    p.push(`<drawing r:id="${escapeXml(opts.drawingRId)}"/>`);
    p.push("</chartsheet>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const sheetPr = findChild(el, "sheetPr");
    if (sheetPr) {
      if (String(attr(sheetPr, "published")) === "0") result.published = false;
      if (attr(sheetPr, "codeName")) result.codeName = attr(sheetPr, "codeName");
      const tabColor = findChild(sheetPr, "tabColor");
      if (tabColor) {
        const rgb = attr(tabColor, "rgb");
        if (rgb) result.tabColor = String(rgb);
      }
    }
    const sheetViews = findChild(el, "sheetViews");
    if (sheetViews) {
      const sv = findChild(sheetViews, "sheetView");
      if (sv) {
        if (parseOnOff(attr(sv, "tabSelected"))) result.tabSelected = true;
        const zoomScale = attrNum(sv, "zoomScale");
        if (zoomScale !== void 0) result.zoomScale = zoomScale;
        if (parseOnOff(attr(sv, "zoomToFit"))) result.zoomToFit = true;
      }
    }
    const sheetProtectionEl = findChild(el, "sheetProtection");
    if (sheetProtectionEl) {
      const sp = {};
      const an = attr(sheetProtectionEl, "algorithmName");
      if (an) sp.algorithmName = an;
      const hv = attr(sheetProtectionEl, "hashValue");
      if (hv) sp.hashValue = hv;
      const sv = attr(sheetProtectionEl, "saltValue");
      if (sv) sp.saltValue = sv;
      const sc = attrNum(sheetProtectionEl, "spinCount");
      if (sc !== void 0) sp.spinCount = sc;
      if (parseOnOff(attr(sheetProtectionEl, "content"))) sp.content = true;
      if (parseOnOff(attr(sheetProtectionEl, "objects"))) sp.objects = true;
      result.sheetProtection = sp;
    }
    const pageMarginsEl = findChild(el, "pageMargins");
    if (pageMarginsEl) {
      const pm = {};
      const ml = attrNum(pageMarginsEl, "left");
      if (ml !== void 0) pm.left = ml;
      const mr = attrNum(pageMarginsEl, "right");
      if (mr !== void 0) pm.right = mr;
      const mt2 = attrNum(pageMarginsEl, "top");
      if (mt2 !== void 0) pm.top = mt2;
      const mb = attrNum(pageMarginsEl, "bottom");
      if (mb !== void 0) pm.bottom = mb;
      const mh = attrNum(pageMarginsEl, "header");
      if (mh !== void 0) pm.header = mh;
      const mf = attrNum(pageMarginsEl, "footer");
      if (mf !== void 0) pm.footer = mf;
      result.pageMargins = pm;
    }
    const pageSetupEl = findChild(el, "pageSetup");
    if (pageSetupEl) {
      const ps = {};
      const pz = attrNum(pageSetupEl, "paperSize");
      if (pz !== void 0) ps.paperSize = pz;
      const ph = attrMeasure(pageSetupEl, "paperHeight");
      if (ph !== void 0) ps.paperHeight = ph;
      const pw = attrMeasure(pageSetupEl, "paperWidth");
      if (pw !== void 0) ps.paperWidth = pw;
      const fpn = attrNum(pageSetupEl, "firstPageNumber");
      if (fpn !== void 0) ps.firstPageNumber = fpn;
      const orient = attr(pageSetupEl, "orientation");
      if (orient) ps.orientation = orient;
      if (String(attr(pageSetupEl, "usePrinterDefaults")) === "0") ps.usePrinterDefaults = false;
      if (parseOnOff(attr(pageSetupEl, "blackAndWhite"))) ps.blackAndWhite = true;
      if (parseOnOff(attr(pageSetupEl, "draft"))) ps.draft = true;
      if (parseOnOff(attr(pageSetupEl, "useFirstPageNumber"))) ps.useFirstPageNumber = true;
      const hdpi = attrNum(pageSetupEl, "horizontalDpi");
      if (hdpi !== void 0) ps.horizontalDpi = hdpi;
      const vdpi = attrNum(pageSetupEl, "verticalDpi");
      if (vdpi !== void 0) ps.verticalDpi = vdpi;
      const copies = attrNum(pageSetupEl, "copies");
      if (copies !== void 0) ps.copies = copies;
      const psRid = attr(pageSetupEl, "r:id");
      if (psRid) ps.printerSettingsRId = psRid;
      result.pageSetup = ps;
    }
    const headerFooterEl = findChild(el, "headerFooter");
    if (headerFooterEl) result.headerFooter = parseHeaderFooterEl(headerFooterEl);
    return result;
  }
};
var commentsDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (opts.comments.length === 0) return void 0;
    const authors = collectAuthors(opts.comments);
    const p = [`<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">`, `<authors>`];
    for (const author of authors) p.push(`<author>${escapeXml(author)}</author>`);
    p.push("</authors><commentList>");
    for (const entry of opts.comments) {
      const authorId = authors.indexOf(entry.author);
      const textXml = typeof entry.text === "string" ? tElement(entry.text) : buildRstXml(entry.text);
      p.push(`<comment ref="${entry.cell}" authorId="${authorId}"><text>${textXml}</text></comment>`);
    }
    p.push("</commentList></comments>");
    return p.join("");
  },
  parse(el, _ctx) {
    const comments = [];
    const authors = [];
    const authorsEl = findChild(el, "authors");
    if (authorsEl) {
      for (const a of authorsEl.elements ?? []) if (a.name === "author") authors.push(textOf(a) ?? "");
    }
    const listEl = findChild(el, "commentList");
    if (listEl) for (const c of listEl.elements ?? []) {
      if (c.name !== "comment") continue;
      const ref = attr(c, "ref") ?? "";
      const authorId = Number(attr(c, "authorId") ?? 0);
      const textEl = findChild(c, "text");
      const text = textEl ? parseRst(textEl) : "";
      const commentPrEl = findChild(c, "commentPr");
      const comment = {
        cell: ref,
        author: authors[authorId] ?? "",
        text
      };
      if (commentPrEl) comment.commentPr = parseCommentPr(commentPrEl);
      comments.push(comment);
    }
    return { comments };
  }
};
var vmlNotesDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (opts.comments.length === 0) return void 0;
    const p = [
      '<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">',
      stringifyVmlShapeLayout({
        ext: "edit",
        idmap: {
          ext: "edit",
          data: "1"
        }
      }),
      stringifyVmlShapetype({
        id: "_x0000_t202",
        coordsize: "21600,21600",
        spt: 202,
        path: "m,l,21600r21600,l21600,xe",
        stroke: { joinstyle: "miter" },
        pathElement: {
          gradientshapeok: true,
          connecttype: "rect"
        }
      })
    ];
    for (const [i, c] of opts.comments.entries()) {
      const { col, row } = cellRefToVmlCoords(c.cell);
      const anchor = c.anchor ? [
        c.anchor.from.col,
        Math.round(convertToEmu(c.anchor.from.colOff ?? 0) / 9525),
        c.anchor.from.row,
        Math.round(convertToEmu(c.anchor.from.rowOff ?? 0) / 9525),
        c.anchor.to.col,
        Math.round(convertToEmu(c.anchor.to.colOff ?? 0) / 9525),
        c.anchor.to.row,
        Math.round(convertToEmu(c.anchor.to.rowOff ?? 0) / 9525)
      ] : [
        col,
        0,
        row,
        0,
        col + 2,
        0,
        row + 2,
        0
      ];
      const style = {
        position: "absolute",
        marginLeft: "59.25pt",
        marginTop: "1.5pt",
        width: `${c.size?.width ?? DEFAULT_NOTE_WIDTH}pt`,
        height: `${c.size?.height ?? DEFAULT_NOTE_HEIGHT}pt`,
        zIndex: 1
      };
      if (!c.visible) style.visibility = "hidden";
      p.push(stringifyVmlShape({
        id: `_x0000_s${1025 + i}`,
        type: "#_x0000_t202",
        style,
        fillcolor: "infoBackground [80]",
        strokecolor: "none [81]",
        insetmode: "auto",
        fill: { color2: "infoBackground [80]" },
        shadow: {
          color: "none [81]",
          obscured: true
        },
        pathElement: { connecttype: "none" },
        textbox: {
          style: { directionAlt: "auto" },
          content: '<div style="text-align:left"></div>'
        },
        clientData: {
          objectType: "Note",
          MoveWithCells: "",
          SizeWithCells: "",
          Anchor: anchor.join(", "),
          AutoFill: false,
          Row: row,
          Column: col
        }
      }));
    }
    p.push("</xml>");
    return p.join("");
  },
  parse(el, _ctx) {
    const anchors = [];
    for (const child of el.elements ?? []) {
      if (child.type !== "element" || child.name !== "v:shape") continue;
      const shape = parseVmlShape(child);
      const cd = shape.clientData;
      if (!cd || cd.objectType !== "Note" || cd.Row === void 0 || cd.Column === void 0) continue;
      const note = {
        row: cd.Row,
        column: cd.Column,
        visible: shape.style?.visibility !== "hidden"
      };
      const nums = (cd.Anchor ?? "").split(/[,\s]+/).filter(Boolean).map(Number);
      if (nums.length === 8 && nums.every((n) => !Number.isNaN(n))) note.anchor = {
        from: {
          col: nums[0],
          colOff: nums[1] * 9525,
          row: nums[2],
          rowOff: nums[3] * 9525
        },
        to: {
          col: nums[4],
          colOff: nums[5] * 9525,
          row: nums[6],
          rowOff: nums[7] * 9525
        }
      };
      const width = lengthToPt(shape.style?.width);
      if (width !== void 0) note.width = width;
      const height = lengthToPt(shape.style?.height);
      if (height !== void 0) note.height = height;
      anchors.push(note);
    }
    return anchors;
  }
};
function lengthToPt(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !/^-?[\d.]/.test(value)) return void 0;
  return convertToPt(value);
}
var DEFAULT_NOTE_WIDTH = 108;
var DEFAULT_NOTE_HEIGHT = 59.25;
function mergeNoteAnchors(comments, anchors) {
  if (!comments || anchors.length === 0) return;
  for (const note of anchors) {
    const comment = comments.find((c) => {
      const { col, row } = cellRefToVmlCoords(c.cell);
      return col === note.column && row === note.row;
    });
    if (!comment) continue;
    if (note.anchor !== void 0) comment.anchor = note.anchor;
    if (note.visible) comment.visible = true;
    if (note.width !== void 0 || note.height !== void 0) comment.size = {
      width: note.width ?? DEFAULT_NOTE_WIDTH,
      height: note.height ?? DEFAULT_NOTE_HEIGHT
    };
  }
}
function collectAuthors(comments) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const entry of comments) if (!seen.has(entry.author)) {
    seen.add(entry.author);
    result.push(entry.author);
  }
  return result.length > 0 ? result : [""];
}
function parseCommentPr(el) {
  const pr = {};
  const locked = attr(el, "locked");
  if (locked !== void 0) pr.locked = parseOnOff(locked) ?? false;
  const defaultSize = attr(el, "defaultSize");
  if (defaultSize !== void 0) pr.defaultSize = parseOnOff(defaultSize) ?? false;
  const print = attr(el, "print");
  if (print !== void 0) pr.print = parseOnOff(print) ?? false;
  const disabled = attr(el, "disabled");
  if (disabled !== void 0) pr.disabled = parseOnOff(disabled) ?? false;
  const autoFill = attr(el, "autoFill");
  if (autoFill !== void 0) pr.autoFill = parseOnOff(autoFill) ?? false;
  const autoLine = attr(el, "autoLine");
  if (autoLine !== void 0) pr.autoLine = parseOnOff(autoLine) ?? false;
  const altText = attr(el, "altText");
  if (altText !== void 0) pr.altText = altText;
  const textHAlign = attr(el, "textHAlign");
  if (textHAlign !== void 0) pr.textHAlign = textHAlign;
  const textVAlign = attr(el, "textVAlign");
  if (textVAlign !== void 0) pr.textVAlign = textVAlign;
  const lockText = attr(el, "lockText");
  if (lockText !== void 0) pr.lockText = parseOnOff(lockText) ?? false;
  const justLastX = attr(el, "justLastX");
  if (justLastX !== void 0) pr.justLastX = parseOnOff(justLastX) ?? false;
  const autoScale = attr(el, "autoScale");
  if (autoScale !== void 0) pr.autoScale = parseOnOff(autoScale) ?? false;
  const anchorEl = findChild(el, "anchor");
  if (anchorEl) {
    const anchor = parseAnchor(anchorEl);
    if (anchor) pr.anchor = anchor;
  }
  return pr;
}
function parseAnchor(el) {
  const from2 = findChild(el, "xdr:from");
  const to = findChild(el, "xdr:to");
  if (!from2 || !to) return void 0;
  return {
    moveWithCells: parseOnOff(attr(el, "moveWithCells")),
    sizeWithCells: parseOnOff(attr(el, "sizeWithCells")),
    from: parseMarker(from2),
    to: parseMarker(to)
  };
}
function parseMarker(el) {
  const num = (tag) => Number(textOf(findChild(el, tag)) ?? 0);
  return {
    col: num("xdr:col"),
    colOff: num("xdr:colOff"),
    row: num("xdr:row"),
    rowOff: num("xdr:rowOff")
  };
}
function cellRefToVmlCoords(ref) {
  let i = 0;
  while (i < ref.length && ref.charCodeAt(i) >= 65 && ref.charCodeAt(i) <= 90) i++;
  return {
    col: letterToColumn(ref.slice(0, i)) - 1,
    row: parseInt(ref.slice(i), 10) - 1
  };
}
function parseRst(textEl) {
  const runs = [];
  const parts = [];
  let hasRuns = false;
  for (const child of textEl.elements ?? []) if (child.name === "t") parts.push(textOf(child) ?? "");
  else if (child.name === "r") {
    hasRuns = true;
    const t = findChild(child, "t");
    const run = { text: t ? textOf(t) ?? "" : "" };
    const rPr = findChild(child, "rPr");
    if (rPr) run.properties = parseRPr(rPr);
    runs.push(run);
  }
  if (hasRuns) return { runs };
  return parts.join("");
}
var ANCHOR_TYPES = {
  twoCell: "twoCell",
  oneCell: "oneCell",
  absolute: "absolute"
};
function pickAnchorOptions(source) {
  const picked = {
    col: source.col,
    row: source.row
  };
  const keys = [
    "colOffset",
    "rowOffset",
    "toCol",
    "toRow",
    "toColOffset",
    "toRowOffset",
    "anchorType",
    "editAs",
    "absoluteX",
    "absoluteY",
    "extentCx",
    "extentCy",
    "locksWithSheet",
    "printsWithSheet"
  ];
  const optional = picked;
  for (const key of keys) if (source[key] !== void 0) optional[key] = source[key];
  return picked;
}
function findXdr(el, local) {
  return findChild(el, local) ?? findChild(el, `xdr:${local}`);
}
function readNumChild(el, tag) {
  const child = findXdr(el, tag);
  if (!child?.elements?.length) return 0;
  const n = Number(child.elements[0]?.text ?? "");
  return Number.isNaN(n) ? 0 : n;
}
function readMarker(el) {
  return {
    col: readNumChild(el, "col") + 1,
    colOffset: readNumChild(el, "colOff") || void 0,
    row: readNumChild(el, "row") + 1,
    rowOffset: readNumChild(el, "rowOff") || void 0
  };
}
function readAnchorFields(anchor, name, result) {
  result.col = 1;
  result.row = 1;
  const clientData = findXdr(anchor, "clientData");
  if (clientData?.attributes) {
    if (clientData.attributes["fLocksWithSheet"] !== void 0) result.locksWithSheet = parseOnOff(clientData.attributes["fLocksWithSheet"]) ?? true;
    if (clientData.attributes["fPrintsWithSheet"] !== void 0) result.printsWithSheet = parseOnOff(clientData.attributes["fPrintsWithSheet"]) ?? true;
  }
  const readExt = (el) => {
    if (!el?.attributes) return;
    const cx = Number(el.attributes["cx"]);
    const cy = Number(el.attributes["cy"]);
    if (!Number.isNaN(cx)) result.extentCx = cx;
    if (!Number.isNaN(cy)) result.extentCy = cy;
  };
  if (name === "absoluteAnchor") {
    result.anchorType = ANCHOR_TYPES.absolute;
    const pos = findXdr(anchor, "pos");
    if (pos?.attributes) {
      const x = Number(pos.attributes["x"]);
      const y = Number(pos.attributes["y"]);
      if (!Number.isNaN(x)) result.absoluteX = x;
      if (!Number.isNaN(y)) result.absoluteY = y;
    }
    readExt(findXdr(anchor, "ext"));
    return;
  }
  const from2 = findXdr(anchor, "from");
  if (from2) {
    const m = readMarker(from2);
    result.col = m.col;
    result.row = m.row;
    if (m.colOffset !== void 0) result.colOffset = m.colOffset;
    if (m.rowOffset !== void 0) result.rowOffset = m.rowOffset;
  }
  if (name === "oneCellAnchor") {
    result.anchorType = ANCHOR_TYPES.oneCell;
    readExt(findXdr(anchor, "ext"));
    return;
  }
  result.anchorType = ANCHOR_TYPES.twoCell;
  const to = findXdr(anchor, "to");
  if (to) {
    const m = readMarker(to);
    result.toCol = m.col;
    result.toRow = m.row;
    if (m.colOffset !== void 0) result.toColOffset = m.colOffset;
    if (m.rowOffset !== void 0) result.toRowOffset = m.rowOffset;
  }
  const editAs = anchor.attributes?.["editAs"];
  if (editAs) result.editAs = editAs;
}
function readCNvPr(parent, nonVisualTag, ctx) {
  const nonVisual = findXdr(parent, nonVisualTag);
  const cNvPr = nonVisual ? findXdr(nonVisual, "cNvPr") : void 0;
  const result = parseNonVisualDrawingProperties(cNvPr);
  const hlinkClick = cNvPr ? findChild(cNvPr, "a:hlinkClick") : void 0;
  if (hlinkClick) result.hyperlink = readHyperlink(hlinkClick, ctx);
  return result;
}
function parseImageAnchor(anchor, pic, name, ctx) {
  const refs = readPicRefs(pic);
  const result = {
    col: 1,
    row: 1,
    rId: refs.embed ?? "",
    ...refs.link ? { linkRId: refs.link } : {}
  };
  Object.assign(result, readCNvPr(pic, "nvPicPr", ctx));
  const blipFill = findXdr(pic, "blipFill");
  const nvPicPr = findXdr(pic, "nvPicPr");
  const cNvPicPr = nvPicPr ? findXdr(nvPicPr, "cNvPicPr") : void 0;
  if (cNvPicPr?.attributes?.["preferRelativeResize"] !== void 0) result.preferRelativeResize = parseOnOff(String(cNvPicPr.attributes["preferRelativeResize"])) ?? true;
  if (cNvPicPr) {
    const locks = findChild(cNvPicPr, "a:picLocks");
    if (locks) result.locking = pictureLockingDesc.parse(locks, ctx);
  }
  const blip = blipFill ? findChild(blipFill, "a:blip") : void 0;
  if (blip) {
    const parsed = blipDesc.parse(blip, {});
    if (parsed.blipEffects) result.blipEffects = parsed.blipEffects;
    if (parsed.useLocalDpi !== void 0) result.useLocalDpi = parsed.useLocalDpi;
    if (parsed.ext !== void 0) result.blipExt = parsed.ext;
  }
  const srcRect = blipFill ? findChild(blipFill, "a:srcRect") : void 0;
  if (srcRect) result.sourceRectangle = sourceRectangleDesc.parse(srcRect, ctx);
  const spPrEl = findXdr(pic, "spPr");
  if (spPrEl) {
    result.spPr = shapePropertiesDesc.parse(spPrEl, ctx);
    const bwMode = spPrEl.attributes?.["bwMode"];
    if (bwMode !== void 0) result.blackWhiteMode = bwMode;
  }
  const ext = readPicExtent(pic);
  if (ext.cx !== void 0) result.extentCx = ext.cx;
  if (ext.cy !== void 0) result.extentCy = ext.cy;
  readAnchorFields(anchor, name, result);
  return result;
}
function readPicRefs(pic) {
  const blipFill = findXdr(pic, "blipFill") ?? pic;
  const attrs2 = findChild(blipFill, "a:blip")?.attributes;
  return {
    embed: attrs2?.["r:embed"],
    link: attrs2?.["r:link"]
  };
}
function readPicExtent(pic) {
  const spPr = findXdr(pic, "spPr");
  const xfrm = spPr ? findChild(spPr, "a:xfrm") : void 0;
  const ext = xfrm ? findChild(xfrm, "a:ext") : void 0;
  if (!ext?.attributes) return {};
  const cx = Number(ext.attributes["cx"]);
  const cy = Number(ext.attributes["cy"]);
  return {
    cx: Number.isNaN(cx) ? void 0 : cx,
    cy: Number.isNaN(cy) ? void 0 : cy
  };
}
function parseChartAnchor(anchor, graphicFrame, name, ctx) {
  const graphicData = findChild(findChild(graphicFrame, "a:graphic") ?? graphicFrame, "a:graphicData");
  const rId = (graphicData ? findChild(graphicData, "c:chart") : void 0)?.attributes?.["r:id"];
  if (!rId) return void 0;
  const result = {
    col: 1,
    row: 1,
    rId
  };
  Object.assign(result, readCNvPr(graphicFrame, "nvGraphicFramePr", ctx));
  const nvGraphicFramePr = findXdr(graphicFrame, "nvGraphicFramePr");
  const cNvGraphicFramePr = nvGraphicFramePr ? findXdr(nvGraphicFramePr, "cNvGraphicFramePr") : void 0;
  if (cNvGraphicFramePr) {
    const locks = findChild(cNvGraphicFramePr, "a:graphicFrameLocks");
    if (locks) result.frameLocks = graphicFrameLockingDesc.parse(locks, ctx);
  }
  if (graphicFrame.attributes?.["macro"] !== void 0) result.macro = String(graphicFrame.attributes["macro"]);
  readAnchorFields(anchor, name, result);
  return result;
}
function parseSmartArtAnchor(anchor, graphicFrame, name, ctx) {
  const graphicData = findChild(findChild(graphicFrame, "a:graphic") ?? graphicFrame, "a:graphicData");
  const relIds = graphicData ? findChild(graphicData, "dgm:relIds") : void 0;
  const dm = relIds?.attributes?.["r:dm"];
  const lo = relIds?.attributes?.["r:lo"];
  const qs = relIds?.attributes?.["r:qs"];
  const cs = relIds?.attributes?.["r:cs"];
  if (!dm || !lo || !qs || !cs) return void 0;
  const result = {
    col: 1,
    row: 1,
    dataRId: dm,
    layoutRId: lo,
    quickStyleRId: qs,
    colorsRId: cs
  };
  Object.assign(result, readCNvPr(graphicFrame, "nvGraphicFramePr", ctx));
  const nvGraphicFramePr = findXdr(graphicFrame, "nvGraphicFramePr");
  const cNvGraphicFramePr = nvGraphicFramePr ? findXdr(nvGraphicFramePr, "cNvGraphicFramePr") : void 0;
  if (cNvGraphicFramePr) {
    const locks = findChild(cNvGraphicFramePr, "a:graphicFrameLocks");
    if (locks) result.frameLocks = graphicFrameLockingDesc.parse(locks, ctx);
  }
  if (graphicFrame.attributes?.["macro"] !== void 0) result.macro = String(graphicFrame.attributes["macro"]);
  readAnchorFields(anchor, name, result);
  return result;
}
function parseShapeAnchor(anchor, sp, name, ctx) {
  const result = {
    col: 1,
    row: 1,
    spPr: {}
  };
  readAnchorFields(anchor, name, result);
  Object.assign(result, readCNvPr(sp, "nvSpPr", ctx));
  const nvSpPr = findXdr(sp, "nvSpPr");
  const cNvSpPr = nvSpPr ? findXdr(nvSpPr, "cNvSpPr") : void 0;
  if (cNvSpPr?.attributes?.["txBox"] !== void 0) result.textBox = parseOnOff(String(cNvSpPr.attributes["txBox"])) ?? true;
  const spLocks = cNvSpPr ? findChild(cNvSpPr, "a:spLocks") : void 0;
  if (spLocks) result.locking = shapeLockingDesc.parse(spLocks, ctx);
  const spPr = findXdr(sp, "spPr");
  if (spPr) result.spPr = shapePropertiesDesc.parse(spPr, ctx);
  const styleEl = findXdr(sp, "style");
  if (styleEl) {
    const style = parseShapeStyle(styleEl, ctx);
    if (style) result.style = style;
  }
  const txBody = findXdr(sp, "txBody");
  if (txBody) result.textBody = textBodyDesc.parse(txBody, ctx);
  if (sp.attributes?.["macro"] !== void 0) result.macro = String(sp.attributes["macro"]);
  if (sp.attributes?.["textlink"] !== void 0) result.textlink = String(sp.attributes["textlink"]);
  return result;
}
function readConnectorNonVisual(target, cxnSp, ctx) {
  const nvCxnSpPr = findXdr(cxnSp, "nvCxnSpPr");
  if (!nvCxnSpPr) return;
  const cNvCxnSpPr = findXdr(nvCxnSpPr, "cNvCxnSpPr");
  if (!cNvCxnSpPr) return;
  const cxnSpLocks = findChild(cNvCxnSpPr, "a:cxnSpLocks");
  if (cxnSpLocks) {
    const locks = connectorLockingDesc.parse(cxnSpLocks, ctx);
    if (locks && Object.keys(locks).length > 0) target.locking = locks;
  }
  const stCxn = findChild(cNvCxnSpPr, "a:stCxn");
  if (stCxn) {
    const conn = parseEndpointConnection(stCxn);
    if (conn) target.startConnection = conn;
  }
  const endCxn = findChild(cNvCxnSpPr, "a:endCxn");
  if (endCxn) {
    const conn = parseEndpointConnection(endCxn);
    if (conn) target.endConnection = conn;
  }
}
function parseConnectorAnchor(anchor, cxnSp, name, ctx) {
  const result = {
    col: 1,
    row: 1,
    spPr: {}
  };
  readAnchorFields(anchor, name, result);
  Object.assign(result, readCNvPr(cxnSp, "nvCxnSpPr", ctx));
  const spPr = findXdr(cxnSp, "spPr");
  if (spPr) result.spPr = shapePropertiesDesc.parse(spPr, ctx);
  if (cxnSp.attributes?.["macro"] !== void 0) result.macro = String(cxnSp.attributes["macro"]);
  readConnectorNonVisual(result, cxnSp, ctx);
  const topConnStyle = findXdr(cxnSp, "style");
  if (topConnStyle) {
    const style = parseShapeStyle(topConnStyle, ctx);
    if (style) result.style = style;
  }
  return result;
}
function parseGroupAnchor(anchor, grpSp, name, ctx) {
  const result = {
    col: 1,
    row: 1,
    grpSpPr: {}
  };
  readAnchorFields(anchor, name, result);
  Object.assign(result, readCNvPr(grpSp, "nvGrpSpPr", ctx));
  const grpSpPrEl = findXdr(grpSp, "grpSpPr");
  if (grpSpPrEl) result.grpSpPr = groupShapePropertiesDesc.parse(grpSpPrEl, ctx);
  const shapes = [];
  const childConnectors = [];
  for (const child of grpSp.elements ?? []) {
    const local = child.name?.startsWith("xdr:") ? child.name.slice(4) : child.name;
    if (local === "sp") {
      const spPr = findXdr(child, "spPr");
      const childShape = { spPr: spPr ? shapePropertiesDesc.parse(spPr, ctx) : {} };
      Object.assign(childShape, readCNvPr(child, "nvSpPr", ctx));
      const childNvSpPr = findXdr(child, "nvSpPr");
      const childCnVSpPr = childNvSpPr ? findXdr(childNvSpPr, "cNvSpPr") : void 0;
      if (childCnVSpPr?.attributes?.["txBox"] !== void 0) childShape.textBox = parseOnOff(String(childCnVSpPr.attributes["txBox"])) ?? true;
      const childSpLocks = childCnVSpPr ? findChild(childCnVSpPr, "a:spLocks") : void 0;
      if (childSpLocks) childShape.locking = shapeLockingDesc.parse(childSpLocks, ctx);
      const childStyle = findXdr(child, "style");
      if (childStyle) {
        const style = parseShapeStyle(childStyle, ctx);
        if (style) childShape.style = style;
      }
      const txBody = findXdr(child, "txBody");
      if (txBody) childShape.textBody = textBodyDesc.parse(txBody, ctx);
      if (child.attributes?.["macro"] !== void 0) childShape.macro = String(child.attributes["macro"]);
      if (child.attributes?.["textlink"] !== void 0) childShape.textlink = String(child.attributes["textlink"]);
      shapes.push(childShape);
    } else if (local === "cxnSp") {
      const spPr = findXdr(child, "spPr");
      const childConn = { spPr: spPr ? shapePropertiesDesc.parse(spPr, ctx) : {} };
      Object.assign(childConn, readCNvPr(child, "nvCxnSpPr", ctx));
      if (child.attributes?.["macro"] !== void 0) childConn.macro = String(child.attributes["macro"]);
      readConnectorNonVisual(childConn, child, ctx);
      const connStyle = findXdr(child, "style");
      if (connStyle) {
        const style = parseShapeStyle(connStyle, ctx);
        if (style) childConn.style = style;
      }
      childConnectors.push(childConn);
    }
  }
  if (shapes.length > 0) result.shapes = shapes;
  if (childConnectors.length > 0) result.connectors = childConnectors;
  return result;
}
function parseContentPartAnchor(anchor, contentPart, name) {
  const rId = contentPart.attributes?.["r:id"];
  if (!rId) return void 0;
  const result = {
    col: 1,
    row: 1,
    rId
  };
  readAnchorFields(anchor, name, result);
  return result;
}
var XDR_NS = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
var A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
var R_NS$1 = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
var C_URI = "http://schemas.openxmlformats.org/drawingml/2006/chart";
var DGM_URI = "http://schemas.openxmlformats.org/drawingml/2006/diagram";
function markerXml(col, colOff, row, rowOff) {
  return `<xdr:col>${col - 1}</xdr:col><xdr:colOff>${convertToEmu(colOff)}</xdr:colOff><xdr:row>${row - 1}</xdr:row><xdr:rowOff>${convertToEmu(rowOff)}</xdr:rowOff>`;
}
function clientDataXml(obj) {
  const attrs2 = [];
  if (obj.locksWithSheet !== void 0) attrs2.push(`fLocksWithSheet="${obj.locksWithSheet ? 1 : 0}"`);
  if (obj.printsWithSheet !== void 0) attrs2.push(`fPrintsWithSheet="${obj.printsWithSheet ? 1 : 0}"`);
  return attrs2.length ? `<xdr:clientData ${attrs2.join(" ")}/>` : "<xdr:clientData/>";
}
function wrapAnchor(opts, inner) {
  const anchorType = opts.anchorType ?? ANCHOR_TYPES.twoCell;
  const cx = convertToEmu(opts.extentCx ?? 4e5);
  const cy = convertToEmu(opts.extentCy ?? 3e5);
  if (anchorType === ANCHOR_TYPES.absolute) return `<xdr:absoluteAnchor><xdr:pos x="${convertToEmu(opts.absoluteX ?? 0)}" y="${convertToEmu(opts.absoluteY ?? 0)}"/><xdr:ext cx="${cx}" cy="${cy}"/>${inner}</xdr:absoluteAnchor>`;
  const from2 = markerXml(opts.col, opts.colOffset ?? 0, opts.row, opts.rowOffset ?? 0);
  if (anchorType === ANCHOR_TYPES.oneCell) return `<xdr:oneCellAnchor><xdr:from>${from2}</xdr:from><xdr:ext cx="${cx}" cy="${cy}"/>${inner}</xdr:oneCellAnchor>`;
  return `<xdr:twoCellAnchor${opts.editAs === void 0 ? "" : ` editAs="${opts.editAs}"`}><xdr:from>${from2}</xdr:from><xdr:to>${markerXml(opts.toCol ?? opts.col + 1, opts.toColOffset ?? 0, opts.toRow ?? opts.row + 1, opts.toRowOffset ?? 0)}</xdr:to>${inner}</xdr:twoCellAnchor>`;
}
function picXml(img, id, cx, cy, ctx) {
  const spPr = (img.spPr ? shapePropertiesDesc.stringify(img.spPr, ctx) : shapePropertiesDesc.stringify({
    x: 0,
    y: 0,
    width: cx,
    height: cy,
    geometry: "rect"
  }, ctx)) ?? "";
  const prAttr = img.preferRelativeResize === void 0 ? "" : ` preferRelativeResize="${img.preferRelativeResize ? 1 : 0}"`;
  const locks = img.locking ? pictureLockingDesc.stringify(img.locking, ctx) ?? "" : "";
  const cNvPicPr = locks ? `<xdr:cNvPicPr${prAttr}>${locks}</xdr:cNvPicPr>` : `<xdr:cNvPicPr${prAttr}/>`;
  const effects = img.blipEffects ? stringifyBlipEffects(img.blipEffects, ctx) : "";
  const extLst = img.blipExt ? `<a:extLst>${img.blipExt}</a:extLst>` : img.useLocalDpi !== void 0 ? `<a:extLst><a:ext uri="{28A0092B-C50C-407E-A947-70E740481C1C}"><a14:useLocalDpi xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main" val="${img.useLocalDpi ? 1 : 0}"/></a:ext></a:extLst>` : "";
  const blipAttrs = [];
  if (img.rId) blipAttrs.push(`r:embed="${img.rId}"`);
  if (img.linkRId) blipAttrs.push(`r:link="${img.linkRId}"`);
  const attrs2 = blipAttrs.join(" ");
  const open = blipAttrs.length ? `<a:blip ${attrs2}` : "<a:blip";
  const blipContent = effects + extLst;
  const blip = blipContent ? `${open}>${blipContent}</a:blip>` : `${open}/>`;
  const srcRect = img.sourceRectangle ? createSourceRectangle(img.sourceRectangle) : "";
  const bwModeAttr = img.blackWhiteMode ? ` bwMode="${img.blackWhiteMode}"` : "";
  return `<xdr:pic><xdr:nvPicPr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, img, `Picture ${id}`, hlinkClickXml(img.hyperlink, ctx))}${cNvPicPr}</xdr:nvPicPr><xdr:blipFill>${blip}${srcRect}<a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr${bwModeAttr}>${spPr}</xdr:spPr></xdr:pic>`;
}
function stringifyImage(img, id, ctx) {
  return wrapAnchor(img, `${picXml(img, id, convertToEmu(img.extentCx ?? 4e5), convertToEmu(img.extentCy ?? 3e5), ctx)}${clientDataXml(img)}`);
}
function hlinkClickXml(hyperlink, ctx) {
  if (!hyperlink || !ctx) return void 0;
  return buildHyperlinkElement("a:hlinkClick", hyperlink, registerHyperlink(hyperlink, ctx));
}
function graphicFrameXml(id, cNvPr, name, rId, cx, cy, ctx, extras = {}) {
  const locks = extras.frameLocks ? graphicFrameLockingDesc.stringify(extras.frameLocks, ctx) ?? "" : "";
  const cNvGraphicFramePr = locks ? `<xdr:cNvGraphicFramePr>${locks}</xdr:cNvGraphicFramePr>` : "<xdr:cNvGraphicFramePr/>";
  return `<xdr:graphicFrame${extras.macro === void 0 ? "" : ` macro="${escapeXml(extras.macro)}"`}><xdr:nvGraphicFramePr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, cNvPr, name, hlinkClickXml(extras.hyperlink, ctx))}${cNvGraphicFramePr}</xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></xdr:xfrm><a:graphic><a:graphicData uri="${C_URI}"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="${R_NS$1}" r:id="${rId}"/></a:graphicData></a:graphic></xdr:graphicFrame>`;
}
function stringifyChart(chart, id, ctx) {
  const anchor = {
    toCol: chart.col + 9,
    toRow: chart.row + 16,
    ...chart
  };
  const clientData = clientDataXml(chart);
  const isTwoCell = (anchor.anchorType ?? ANCHOR_TYPES.twoCell) === ANCHOR_TYPES.twoCell;
  const cx = isTwoCell ? 0 : convertToEmu(anchor.extentCx ?? 4e5);
  const cy = isTwoCell ? 0 : convertToEmu(anchor.extentCy ?? 3e5);
  return wrapAnchor(anchor, `${graphicFrameXml(id, chart, `Chart ${id}`, chart.rId, cx, cy, ctx, {
    frameLocks: chart.frameLocks,
    macro: chart.macro,
    hyperlink: chart.hyperlink
  })}${clientData}`);
}
function stringifySmartArt(smartArt, id, ctx) {
  const anchor = {
    toCol: smartArt.col + 9,
    toRow: smartArt.row + 16,
    ...smartArt
  };
  const clientData = clientDataXml(smartArt);
  const isTwoCell = (anchor.anchorType ?? ANCHOR_TYPES.twoCell) === ANCHOR_TYPES.twoCell;
  const cx = isTwoCell ? 0 : convertToEmu(anchor.extentCx ?? 4e5);
  const cy = isTwoCell ? 0 : convertToEmu(anchor.extentCy ?? 3e5);
  const locks = smartArt.frameLocks ? graphicFrameLockingDesc.stringify(smartArt.frameLocks, ctx) ?? "" : "";
  const cNvGraphicFramePr = locks ? `<xdr:cNvGraphicFramePr>${locks}</xdr:cNvGraphicFramePr>` : "<xdr:cNvGraphicFramePr/>";
  return wrapAnchor(anchor, `${`<xdr:graphicFrame${smartArt.macro === void 0 ? "" : ` macro="${escapeXml(smartArt.macro)}"`}><xdr:nvGraphicFramePr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, smartArt, `SmartArt ${id}`)}${cNvGraphicFramePr}</xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></xdr:xfrm><a:graphic><a:graphicData uri="${DGM_URI}"><dgm:relIds xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" r:dm="${smartArt.dataRId}" r:lo="${smartArt.layoutRId}" r:qs="${smartArt.quickStyleRId}" r:cs="${smartArt.colorsRId}"/></a:graphicData></a:graphic></xdr:graphicFrame>`}${clientData}`);
}
function buildShapeContent(shape, id, fallbackName, spPr, textBody, ctx, attrs2 = "", style) {
  const cNvPr = shape;
  const spPrXml = shapePropertiesDesc.stringify(spPr, ctx) ?? "";
  const styleXml = style ? stringifyShapeStyle(style, ctx, "xdr:style") : "";
  const txBodyXml = textBody ? `<xdr:txBody>${textBodyDesc.stringify(textBody, ctx)}</xdr:txBody>` : "";
  const txBoxAttr = shape.textBox === void 0 ? "" : ` txBox="${shape.textBox ? 1 : 0}"`;
  const locksXml = shape.locking ? shapeLockingDesc.stringify(shape.locking, ctx) ?? "" : "";
  const cNvSpPr = locksXml ? `<xdr:cNvSpPr${txBoxAttr}>${locksXml}</xdr:cNvSpPr>` : `<xdr:cNvSpPr${txBoxAttr}/>`;
  return `<xdr:sp${attrs2}><xdr:nvSpPr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, cNvPr, fallbackName, hlinkClickXml(shape.hyperlink, ctx))}${cNvSpPr}</xdr:nvSpPr><xdr:spPr>${spPrXml}</xdr:spPr>${styleXml}${txBodyXml}</xdr:sp>`;
}
function buildConnectorContent(cNvPr, id, fallbackName, spPr, ctx, attrs2 = "", connector) {
  const spPrXml = shapePropertiesDesc.stringify(spPr, ctx) ?? "";
  const styleXml = connector?.style ? stringifyShapeStyle(connector.style, ctx, "xdr:style") : "";
  const cNvCxnSpPrInner = [];
  if (connector?.locking) {
    const locks = connectorLockingDesc.stringify(connector.locking, ctx);
    if (locks) cNvCxnSpPrInner.push(locks);
  }
  if (connector?.startConnection) cNvCxnSpPrInner.push(stringifyEndpointConnection("stCxn", connector.startConnection));
  if (connector?.endConnection) cNvCxnSpPrInner.push(stringifyEndpointConnection("endCxn", connector.endConnection));
  const cNvCxnSpPr = cNvCxnSpPrInner.length ? `<xdr:cNvCxnSpPr>${cNvCxnSpPrInner.join("")}</xdr:cNvCxnSpPr>` : "<xdr:cNvCxnSpPr/>";
  return `<xdr:cxnSp${attrs2}><xdr:nvCxnSpPr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, cNvPr, fallbackName, hlinkClickXml(cNvPr?.hyperlink, ctx))}${cNvCxnSpPr}</xdr:nvCxnSpPr><xdr:spPr>${spPrXml}</xdr:spPr>${styleXml}</xdr:cxnSp>`;
}
function stringifyShape(shape, id, ctx) {
  return wrapAnchor(shape, `${buildShapeContent(shape, id, `Shape ${id}`, shape.spPr, shape.textBody, ctx, macroTextlinkAttrs(shape), shape.style)}${clientDataXml(shape)}`);
}
function stringifyConnector(conn, id, ctx) {
  return wrapAnchor(conn, `${buildConnectorContent(conn, id, `Connector ${id}`, conn.spPr, ctx, macroTextlinkAttrs(conn), conn)}${clientDataXml(conn)}`);
}
function stringifyContentPart(cp) {
  return wrapAnchor(cp, `<xdr:contentPart r:id="${cp.rId}"/>${clientDataXml(cp)}`);
}
function buildGroup(grp, id, ctx) {
  const grpSpPrXml = groupShapePropertiesDesc.stringify(grp.grpSpPr, ctx) ?? "";
  let childId = id + 1;
  const children2 = [];
  for (const childShape of grp.shapes ?? []) {
    children2.push(buildShapeContent(childShape, childId, `Shape ${childId}`, childShape.spPr, childShape.textBody, ctx, macroTextlinkAttrs(childShape), childShape.style));
    childId++;
  }
  for (const childConn of grp.connectors ?? []) {
    children2.push(buildConnectorContent(childConn, childId, `Connector ${childId}`, childConn.spPr, ctx, macroTextlinkAttrs(childConn), childConn));
    childId++;
  }
  return {
    xml: `<xdr:grpSp><xdr:nvGrpSpPr>${stringifyNonVisualDrawingProperties("xdr:cNvPr", id, grp, `Group ${id}`, hlinkClickXml(grp.hyperlink, ctx))}<xdr:cNvGrpSpPr/></xdr:nvGrpSpPr><xdr:grpSpPr>${grpSpPrXml}</xdr:grpSpPr>${children2.join("")}</xdr:grpSp>`,
    nextId: childId
  };
}
function macroTextlinkAttrs(shape) {
  const a = [];
  if (shape.macro !== void 0) a.push(`macro="${escapeXml(shape.macro)}"`);
  if (shape.textlink !== void 0) a.push(`textlink="${escapeXml(shape.textlink)}"`);
  return a.length ? " " + a.join(" ") : "";
}
function readAnchorShapeId(anchor) {
  const firstCnvPr = (el) => {
    for (const child of el.elements ?? []) {
      if ((child.name ?? "").endsWith("cNvPr")) return child;
      const found = firstCnvPr(child);
      if (found) return found;
    }
  };
  const cNvPr = firstCnvPr(anchor);
  if (!cNvPr) return void 0;
  const id = Number(cNvPr.attributes?.["id"]);
  return Number.isNaN(id) ? void 0 : id;
}
var drawingDesc = {
  kind: "custom",
  stringify(opts, ctx) {
    const images = opts.images ?? [];
    const charts = opts.charts ?? [];
    const smartArts = opts.smartArts ?? [];
    const shapes = opts.shapes ?? [];
    const connectors = opts.connectors ?? [];
    const groups = opts.groups ?? [];
    const contentParts = opts.contentParts ?? [];
    if (images.length + charts.length + smartArts.length + shapes.length + connectors.length + groups.length + contentParts.length === 0) return void 0;
    const emissions = [];
    for (const img of images) emissions.push({
      order: img.zOrder,
      shapeId: img.shapeId,
      emit: (id) => stringifyImage(img, id, ctx)
    });
    for (const chart of charts) emissions.push({
      order: chart.zOrder,
      shapeId: chart.shapeId,
      emit: (id) => stringifyChart(chart, id, ctx)
    });
    for (const smartArt of smartArts) emissions.push({
      order: smartArt.zOrder,
      shapeId: smartArt.shapeId,
      emit: (id) => stringifySmartArt(smartArt, id, ctx)
    });
    for (const shape of shapes) emissions.push({
      order: shape.zOrder,
      shapeId: shape.shapeId,
      emit: (id) => stringifyShape(shape, id, ctx)
    });
    for (const conn of connectors) emissions.push({
      order: conn.zOrder,
      shapeId: conn.shapeId,
      emit: (id) => stringifyConnector(conn, id, ctx)
    });
    for (const grp of groups) emissions.push({
      order: grp.zOrder,
      shapeId: grp.shapeId,
      emit: (id) => wrapAnchor(grp, `${buildGroup(grp, id, ctx).xml}${clientDataXml(grp)}`)
    });
    for (const cp of contentParts) emissions.push({
      order: cp.zOrder,
      shapeId: cp.shapeId,
      emit: () => stringifyContentPart(cp)
    });
    emissions.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    const usedIds = new Set(emissions.map((e) => e.shapeId).filter((n) => n !== void 0));
    const p = [`<xdr:wsDr xmlns:xdr="${XDR_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS$1}">`];
    let next = 1;
    for (const e of emissions) {
      const id = e.shapeId ?? (() => {
        while (usedIds.has(next)) next++;
        usedIds.add(next);
        return next;
      })();
      p.push(e.emit(id));
    }
    p.push("</xdr:wsDr>");
    return p.join("");
  },
  parse(el, ctx) {
    const result = {};
    const images = [];
    const charts = [];
    const smartArts = [];
    const shapes = [];
    const connectors = [];
    const groups = [];
    const contentParts = [];
    let order = 0;
    const stamp = (obj, anchor) => {
      obj.zOrder = order++;
      const shapeId = readAnchorShapeId(anchor);
      if (shapeId !== void 0) obj.shapeId = shapeId;
      return obj;
    };
    for (const anchor of el.elements ?? []) {
      const rawName = anchor.name ?? "";
      const name = rawName.startsWith("xdr:") ? rawName.slice(4) : rawName;
      if (name !== "twoCellAnchor" && name !== "oneCellAnchor" && name !== "absoluteAnchor") continue;
      const pic = findXdr(anchor, "pic");
      if (pic) {
        images.push(stamp(parseImageAnchor(anchor, pic, name, ctx), anchor));
        continue;
      }
      const graphicFrame = findXdr(anchor, "graphicFrame");
      if (graphicFrame) {
        const chart = parseChartAnchor(anchor, graphicFrame, name, ctx);
        if (chart) {
          charts.push(stamp(chart, anchor));
          continue;
        }
        const smartArt = parseSmartArtAnchor(anchor, graphicFrame, name, ctx);
        if (smartArt) {
          smartArts.push(stamp(smartArt, anchor));
          continue;
        }
        continue;
      }
      const sp = findXdr(anchor, "sp");
      if (sp) {
        shapes.push(stamp(parseShapeAnchor(anchor, sp, name, ctx), anchor));
        continue;
      }
      const cxnSp = findXdr(anchor, "cxnSp");
      if (cxnSp) {
        connectors.push(stamp(parseConnectorAnchor(anchor, cxnSp, name, ctx), anchor));
        continue;
      }
      const grpSp = findXdr(anchor, "grpSp");
      if (grpSp) {
        groups.push(stamp(parseGroupAnchor(anchor, grpSp, name, ctx), anchor));
        continue;
      }
      const contentPart = findXdr(anchor, "contentPart");
      if (contentPart) {
        const cp = parseContentPartAnchor(anchor, contentPart, name);
        if (cp) contentParts.push(stamp(cp, anchor));
      }
    }
    if (images.length > 0) result.images = images;
    if (charts.length > 0) result.charts = charts;
    if (smartArts.length > 0) result.smartArts = smartArts;
    if (shapes.length > 0) result.shapes = shapes;
    if (connectors.length > 0) result.connectors = connectors;
    if (groups.length > 0) result.groups = groups;
    if (contentParts.length > 0) result.contentParts = contentParts;
    return result;
  }
};
var externalLinkDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<externalLink xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
    if (opts.externalBook) {
      const book = opts.externalBook;
      const bookParts = [];
      if (book.sheetNames && book.sheetNames.length > 0) {
        bookParts.push("<sheetNames>");
        for (const name of book.sheetNames) bookParts.push(`<sheetName val="${escapeXml(name)}"/>`);
        bookParts.push("</sheetNames>");
      }
      if (book.definedNames && book.definedNames.length > 0) {
        bookParts.push("<definedNames>");
        for (const dn of book.definedNames) {
          const dnAttrs = { name: dn.name };
          if (dn.refersTo !== void 0) dnAttrs.refersTo = dn.refersTo;
          if (dn.sheetId !== void 0) dnAttrs.sheetId = dn.sheetId;
          bookParts.push(`<definedName${attrs(dnAttrs)}/>`);
        }
        bookParts.push("</definedNames>");
      }
      if (book.sheetDataSet && book.sheetDataSet.length > 0) {
        bookParts.push("<sheetDataSet>");
        for (const sd of book.sheetDataSet) {
          const sdAttrs = { sheetId: sd.sheetId };
          if (sd.refreshError) sdAttrs.refreshError = 1;
          bookParts.push(`<sheetData${attrs(sdAttrs)}>`);
          if (sd.rows) for (const row of sd.rows) {
            bookParts.push(`<row r="${row.rowNumber}">`);
            if (row.cells) for (const cell of row.cells) {
              const cellAttrs = { r: cell.reference };
              if (cell.type !== void 0) cellAttrs.t = cell.type;
              if (cell.valueMetadataIndex !== void 0) cellAttrs.vm = cell.valueMetadataIndex;
              if (cell.value !== void 0) bookParts.push(`<cell${attrs(cellAttrs)}><v>${escapeXml(cell.value)}</v></cell>`);
              else bookParts.push(`<cell${attrs(cellAttrs)}/>`);
            }
            bookParts.push("</row>");
          }
          bookParts.push("</sheetData>");
        }
        bookParts.push("</sheetDataSet>");
      }
      const ridAttr = opts.bookRId ? ` r:id="${opts.bookRId}"` : "";
      p.push(`<externalBook${ridAttr}${bookParts.length > 0 ? `>${bookParts.join("")}</externalBook>` : "/>"}`);
    }
    if (opts.ddeLink) {
      const dde = opts.ddeLink;
      const ddeParts = [];
      if (dde.ddeItems && dde.ddeItems.length > 0) {
        ddeParts.push("<ddeItems>");
        for (const item of dde.ddeItems) {
          const itemAttrs = [];
          if (item.name !== void 0) itemAttrs.push(`name="${escapeXml(item.name)}"`);
          if (item.ole) itemAttrs.push('ole="1"');
          if (item.advise) itemAttrs.push('advise="1"');
          if (item.preferPic) itemAttrs.push('preferPic="1"');
          if (item.values) {
            const v = item.values;
            const valuesAttrs = [];
            if (v.rows !== void 0) valuesAttrs.push(`rows="${v.rows}"`);
            if (v.cols !== void 0) valuesAttrs.push(`cols="${v.cols}"`);
            const valueParts = [];
            for (const dv of v.values) {
              const valueAttrs = dv.type !== void 0 ? ` t="${dv.type}"` : "";
              valueParts.push(`<value${valueAttrs}><val>${escapeXml(dv.value)}</val></value>`);
            }
            ddeParts.push(`<ddeItem${itemAttrs.length > 0 ? " " + itemAttrs.join(" ") : ""}><values${valuesAttrs.length > 0 ? " " + valuesAttrs.join(" ") : ""}>${valueParts.join("")}</values></ddeItem>`);
          } else ddeParts.push(`<ddeItem${itemAttrs.length > 0 ? " " + itemAttrs.join(" ") : ""}/>`);
        }
        ddeParts.push("</ddeItems>");
      }
      p.push(`<ddeLink ddeService="${escapeXml(dde.ddeService)}" ddeTopic="${escapeXml(dde.ddeTopic)}"${ddeParts.length > 0 ? `>${ddeParts.join("")}</ddeLink>` : "/>"}`);
    }
    if (opts.oleLink) {
      const oleRId = opts.oleRId ? ` r:id="${escapeXml(opts.oleRId)}"` : "";
      const progIdAttr = opts.oleLink.progId ? ` progId="${escapeXml(opts.oleLink.progId)}"` : "";
      const oleChildren = [];
      if (opts.oleLink.oleItems && opts.oleLink.oleItems.length > 0) {
        const itemParts = [`<oleItems>`];
        for (const item of opts.oleLink.oleItems) {
          const itemAttrs = [`name="${escapeXml(item.name)}"`];
          if (item.icon) itemAttrs.push('icon="1"');
          if (item.advise) itemAttrs.push('advise="1"');
          if (item.preferPic) itemAttrs.push('preferPic="1"');
          itemParts.push(`<oleItem ${itemAttrs.join(" ")}/>`);
        }
        itemParts.push("</oleItems>");
        oleChildren.push(itemParts.join(""));
      }
      if (oleChildren.length > 0) p.push(`<oleLink${oleRId}${progIdAttr}>${oleChildren.join("")}</oleLink>`);
      else p.push(`<oleLink${oleRId}${progIdAttr}/>`);
    }
    p.push("</externalLink>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const bookEl = findChild(el, "externalBook");
    if (bookEl) {
      const book = {};
      if (bookEl.attributes?.["r:id"]) result.bookRId = String(bookEl.attributes["r:id"]);
      const sheetNamesEl = findChild(bookEl, "sheetNames");
      if (sheetNamesEl) {
        const names = [];
        for (const child of sheetNamesEl.elements ?? []) if (child.name === "sheetName" && child.attributes?.["val"]) names.push(String(child.attributes["val"]));
        if (names.length > 0) book.sheetNames = names;
      }
      const definedNamesEl = findChild(bookEl, "definedNames");
      if (definedNamesEl) {
        const dns = [];
        for (const child of definedNamesEl.elements ?? []) {
          if (child.name !== "definedName") continue;
          const dn = { name: String(child.attributes?.["name"] ?? "") };
          if (child.attributes?.["refersTo"]) dn.refersTo = String(child.attributes["refersTo"]);
          if (child.attributes?.["sheetId"] !== void 0) dn.sheetId = Number(child.attributes["sheetId"]);
          dns.push(dn);
        }
        if (dns.length > 0) book.definedNames = dns;
      }
      const sheetDataSetEl = findChild(bookEl, "sheetDataSet");
      if (sheetDataSetEl) {
        const sds = [];
        for (const sdChild of sheetDataSetEl.elements ?? []) {
          if (sdChild.name !== "sheetData") continue;
          const sd = { sheetId: Number(sdChild.attributes?.["sheetId"] ?? 0) };
          if (sdChild.attributes?.["refreshError"]) sd.refreshError = true;
          const rows = [];
          for (const rowChild of sdChild.elements ?? []) {
            if (rowChild.name !== "row") continue;
            const row = { rowNumber: Number(rowChild.attributes?.["r"] ?? 0) };
            const cells = [];
            for (const cellChild of rowChild.elements ?? []) {
              if (cellChild.name !== "cell") continue;
              const cell = { reference: String(cellChild.attributes?.["r"] ?? "") };
              if (cellChild.attributes?.["t"]) cell.type = String(cellChild.attributes["t"]);
              if (cellChild.attributes?.["vm"] !== void 0) cell.valueMetadataIndex = Number(cellChild.attributes["vm"]);
              const vEl = findChild(cellChild, "v");
              if (vEl && vEl.elements?.[0]?.text !== void 0) cell.value = String(vEl.elements[0].text);
              cells.push(cell);
            }
            if (cells.length > 0) row.cells = cells;
            rows.push(row);
          }
          if (rows.length > 0) sd.rows = rows;
          sds.push(sd);
        }
        if (sds.length > 0) book.sheetDataSet = sds;
      }
      result.externalBook = book;
    }
    const ddeEl = findChild(el, "ddeLink");
    if (ddeEl) {
      const dde = {
        ddeService: String(ddeEl.attributes?.["ddeService"] ?? ""),
        ddeTopic: String(ddeEl.attributes?.["ddeTopic"] ?? "")
      };
      const ddeItemsEl = findChild(ddeEl, "ddeItems");
      if (ddeItemsEl) {
        const items = [];
        for (const child of ddeItemsEl.elements ?? []) {
          if (child.name !== "ddeItem") continue;
          const item = {};
          if (child.attributes?.["name"] !== void 0) item.name = String(child.attributes["name"]);
          if (child.attributes?.["ole"]) item.ole = true;
          if (child.attributes?.["advise"]) item.advise = true;
          if (child.attributes?.["preferPic"]) item.preferPic = true;
          const valuesEl = findChild(child, "values");
          if (valuesEl) {
            const values = { values: [] };
            if (valuesEl.attributes?.["rows"] !== void 0) values.rows = Number(valuesEl.attributes["rows"]);
            if (valuesEl.attributes?.["cols"] !== void 0) values.cols = Number(valuesEl.attributes["cols"]);
            for (const valueChild of valuesEl.elements ?? []) {
              if (valueChild.name !== "value") continue;
              const valEl2 = findChild(valueChild, "val");
              const dv = { value: valEl2 ? String(valEl2.elements?.[0]?.text ?? "") : "" };
              if (valueChild.attributes?.["t"]) dv.type = valueChild.attributes["t"];
              values.values.push(dv);
            }
            item.values = values;
          }
          items.push(item);
        }
        if (items.length > 0) dde.ddeItems = items;
      }
      result.ddeLink = dde;
    }
    const oleEl = findChild(el, "oleLink");
    if (oleEl) {
      const ole = {};
      if (oleEl.attributes?.["r:id"]) result.oleRId = String(oleEl.attributes["r:id"]);
      if (oleEl.attributes?.["progId"]) ole.progId = String(oleEl.attributes["progId"]);
      const oleItemsEl = findChild(oleEl, "oleItems");
      if (oleItemsEl) {
        const items = [];
        for (const child of oleItemsEl.elements ?? []) {
          if (child.name !== "oleItem") continue;
          const item = { name: String(child.attributes?.["name"] ?? "") };
          if (child.attributes?.["icon"]) item.icon = true;
          if (child.attributes?.["advise"]) item.advise = true;
          if (child.attributes?.["preferPic"]) item.preferPic = true;
          items.push(item);
        }
        if (items.length > 0) ole.oleItems = items;
      }
      result.oleLink = ole;
    }
    return result;
  }
};
var CRED_METHODS = /* @__PURE__ */ new Set([
  "integrated",
  "none",
  "stored",
  "prompt"
]);
var connectionsDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<connections xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    for (const c of opts.connections) {
      const cAttrs = [`id="${c.id}"`];
      if (c.sourceFile !== void 0) cAttrs.push(`sourceFile="${escapeXml(c.sourceFile)}"`);
      if (c.odcFile !== void 0) cAttrs.push(`odcFile="${escapeXml(c.odcFile)}"`);
      if (c.keepAlive) cAttrs.push('keepAlive="1"');
      if (c.interval !== void 0) cAttrs.push(`interval="${c.interval}"`);
      if (c.name !== void 0) cAttrs.push(`name="${escapeXml(c.name)}"`);
      if (c.description !== void 0) cAttrs.push(`description="${escapeXml(c.description)}"`);
      if (c.type !== void 0) cAttrs.push(`type="${c.type}"`);
      if (c.reconnectionMethod !== void 0) cAttrs.push(`reconnectionMethod="${c.reconnectionMethod}"`);
      cAttrs.push(`refreshedVersion="${c.refreshedVersion}"`);
      if (c.minRefreshableVersion !== void 0) cAttrs.push(`minRefreshableVersion="${c.minRefreshableVersion}"`);
      if (c.savePassword) cAttrs.push('savePassword="1"');
      if (c.new) cAttrs.push('new="1"');
      if (c.deleted) cAttrs.push('deleted="1"');
      if (c.onlyUseConnectionFile) cAttrs.push('onlyUseConnectionFile="1"');
      if (c.backgroundRefresh) cAttrs.push('background="1"');
      if (c.refreshOnLoad) cAttrs.push('refreshOnLoad="1"');
      if (c.saveData) cAttrs.push('saveData="1"');
      if (c.credentials !== void 0 && CRED_METHODS.has(c.credentials)) cAttrs.push(`credentials="${c.credentials}"`);
      if (c.singleSignOnId !== void 0) cAttrs.push(`singleSignOnId="${escapeXml(c.singleSignOnId)}"`);
      const inner = [];
      if (c.dbPr) {
        const dAttrs = [`connection="${escapeXml(c.dbPr.connection)}"`];
        if (c.dbPr.command !== void 0) dAttrs.push(`command="${escapeXml(c.dbPr.command)}"`);
        if (c.dbPr.serverCommand !== void 0) dAttrs.push(`serverCommand="${escapeXml(c.dbPr.serverCommand)}"`);
        if (c.dbPr.commandType !== void 0) dAttrs.push(`commandType="${c.dbPr.commandType}"`);
        inner.push(`<dbPr ${dAttrs.join(" ")}/>`);
      }
      if (c.olapPr) inner.push(stringifyOlapPr(c.olapPr));
      if (c.webPr) {
        const w = c.webPr;
        const wAttrs = [];
        if (w.xml) wAttrs.push('xml="1"');
        if (w.sourceData) wAttrs.push('sourceData="1"');
        if (w.parsePre) wAttrs.push('parsePre="1"');
        if (w.consecutive) wAttrs.push('consecutive="1"');
        if (w.firstRow) wAttrs.push('firstRow="1"');
        if (w.xl97) wAttrs.push('xl97="1"');
        if (w.textDates) wAttrs.push('textDates="1"');
        if (w.xl2000) wAttrs.push('xl2000="1"');
        if (w.url !== void 0) wAttrs.push(`url="${escapeXml(w.url)}"`);
        if (w.post !== void 0) wAttrs.push(`post="${escapeXml(w.post)}"`);
        if (w.htmlTables) wAttrs.push('htmlTables="1"');
        if (w.htmlFormat !== void 0) wAttrs.push(`htmlFormat="${escapeXml(w.htmlFormat)}"`);
        if (w.editPage !== void 0) wAttrs.push(`editPage="${escapeXml(w.editPage)}"`);
        const tablesXml = w.tables && w.tables.length > 0 ? `<tables count="${w.tables.length}">${w.tables.map((t) => t === null ? "<m/>" : typeof t === "number" ? `<x v="${t}"/>` : `<s v="${escapeXml(t)}"/>`).join("")}</tables>` : "";
        if (tablesXml) inner.push(`<webPr ${wAttrs.join(" ")}>${tablesXml}</webPr>`);
        else inner.push(`<webPr ${wAttrs.join(" ")}/>`);
      }
      if (c.textPr) {
        const t = c.textPr;
        const tAttrs = [];
        if (t.prompt === false) tAttrs.push('prompt="0"');
        if (t.fileType !== void 0) tAttrs.push(`fileType="${t.fileType}"`);
        if (t.codePage !== void 0) tAttrs.push(`codePage="${t.codePage}"`);
        if (t.characterSet !== void 0) tAttrs.push(`characterSet="${escapeXml(t.characterSet)}"`);
        if (t.firstRow !== void 0) tAttrs.push(`firstRow="${t.firstRow}"`);
        if (t.sourceFile !== void 0) tAttrs.push(`sourceFile="${escapeXml(t.sourceFile)}"`);
        if (t.delimited === false) tAttrs.push('delimited="0"');
        if (t.delimiter !== void 0) tAttrs.push(`delimiter="${escapeXml(t.delimiter)}"`);
        if (t.decimal !== void 0) tAttrs.push(`decimal="${escapeXml(t.decimal)}"`);
        if (t.thousands !== void 0) tAttrs.push(`thousands="${escapeXml(t.thousands)}"`);
        if (t.tab === false) tAttrs.push('tab="0"');
        if (t.space) tAttrs.push('space="1"');
        if (t.comma) tAttrs.push('comma="1"');
        if (t.semicolon) tAttrs.push('semicolon="1"');
        if (t.consecutive) tAttrs.push('consecutive="1"');
        if (t.qualifier !== void 0) tAttrs.push(`qualifier="${t.qualifier}"`);
        const fieldsXml = t.textFields && t.textFields.length > 0 ? `<textFields count="${t.textFields.length}">${t.textFields.map((f) => {
          const fAttrs = [];
          if (f.type !== void 0) fAttrs.push(`type="${escapeXml(f.type)}"`);
          if (f.position !== void 0) fAttrs.push(`position="${f.position}"`);
          return `<textField ${fAttrs.join(" ")}/>`;
        }).join("")}</textFields>` : "";
        if (fieldsXml) inner.push(`<textPr ${tAttrs.join(" ")}>${fieldsXml}</textPr>`);
        else inner.push(`<textPr ${tAttrs.join(" ")}/>`);
      }
      if (c.parameters && c.parameters.length > 0) {
        const pmParts = [`<parameters count="${c.parameters.length}">`];
        for (const pm of c.parameters) {
          const pmAttrs = [];
          if (pm.name !== void 0) pmAttrs.push(`name="${escapeXml(pm.name)}"`);
          if (pm.sqlType !== void 0) pmAttrs.push(`sqlType="${pm.sqlType}"`);
          if (pm.parameterType !== void 0) pmAttrs.push(`parameterType="${pm.parameterType}"`);
          if (pm.refreshOnChange) pmAttrs.push('refreshOnChange="1"');
          if (pm.prompt !== void 0) pmAttrs.push(`prompt="${escapeXml(pm.prompt)}"`);
          if (pm.boolean !== void 0) pmAttrs.push(`boolean="${pm.boolean ? 1 : 0}"`);
          if (pm.double !== void 0) pmAttrs.push(`double="${pm.double}"`);
          if (pm.integer !== void 0) pmAttrs.push(`integer="${pm.integer}"`);
          if (pm.string !== void 0) pmAttrs.push(`string="${escapeXml(pm.string)}"`);
          if (pm.cell !== void 0) pmAttrs.push(`cell="${escapeXml(pm.cell)}"`);
          pmParts.push(`<parameter ${pmAttrs.join(" ")}/>`);
        }
        pmParts.push("</parameters>");
        inner.push(pmParts.join(""));
      }
      if (inner.length > 0) p.push(`<connection ${cAttrs.join(" ")}>${inner.join("")}</connection>`);
      else p.push(`<connection ${cAttrs.join(" ")}/>`);
    }
    p.push("</connections>");
    return p.join("");
  },
  parse(el, _ctx) {
    const connections = [];
    for (const cEl of el.elements ?? []) {
      if (cEl.name !== "connection") continue;
      const c = { id: attrNum(cEl, "id") ?? 0 };
      if (attr(cEl, "sourceFile") !== void 0) c.sourceFile = attr(cEl, "sourceFile");
      if (attr(cEl, "odcFile") !== void 0) c.odcFile = attr(cEl, "odcFile");
      if (parseOnOff(attr(cEl, "keepAlive"))) c.keepAlive = true;
      const interval = attrNum(cEl, "interval");
      if (interval !== void 0) c.interval = interval;
      if (attr(cEl, "name") !== void 0) c.name = attr(cEl, "name");
      if (attr(cEl, "description") !== void 0) c.description = attr(cEl, "description");
      const type = attrNum(cEl, "type");
      if (type !== void 0) c.type = type;
      const rm = attrNum(cEl, "reconnectionMethod");
      if (rm !== void 0) c.reconnectionMethod = rm;
      const rv = attrNum(cEl, "refreshedVersion");
      if (rv !== void 0) c.refreshedVersion = rv;
      const mrv = attrNum(cEl, "minRefreshableVersion");
      if (mrv !== void 0) c.minRefreshableVersion = mrv;
      if (parseOnOff(attr(cEl, "savePassword"))) c.savePassword = true;
      if (parseOnOff(attr(cEl, "new"))) c.new = true;
      if (parseOnOff(attr(cEl, "deleted"))) c.deleted = true;
      if (parseOnOff(attr(cEl, "onlyUseConnectionFile"))) c.onlyUseConnectionFile = true;
      if (parseOnOff(attr(cEl, "background"))) c.backgroundRefresh = true;
      if (parseOnOff(attr(cEl, "refreshOnLoad"))) c.refreshOnLoad = true;
      if (parseOnOff(attr(cEl, "saveData"))) c.saveData = true;
      if (attr(cEl, "credentials") !== void 0) c.credentials = attr(cEl, "credentials");
      if (attr(cEl, "singleSignOnId") !== void 0) c.singleSignOnId = attr(cEl, "singleSignOnId");
      const dbEl = findChild(cEl, "dbPr");
      if (dbEl) c.dbPr = {
        connection: attr(dbEl, "connection") ?? "",
        command: attr(dbEl, "command"),
        serverCommand: attr(dbEl, "serverCommand"),
        commandType: attrNum(dbEl, "commandType")
      };
      const olapEl = findChild(cEl, "olapPr");
      if (olapEl) {
        const ol = parseOlapPr(olapEl);
        if (ol) c.olapPr = ol;
      }
      const webEl = findChild(cEl, "webPr");
      if (webEl) {
        const w = {};
        if (parseOnOff(attr(webEl, "xml"))) w.xml = true;
        if (parseOnOff(attr(webEl, "sourceData"))) w.sourceData = true;
        if (parseOnOff(attr(webEl, "parsePre"))) w.parsePre = true;
        if (parseOnOff(attr(webEl, "consecutive"))) w.consecutive = true;
        if (parseOnOff(attr(webEl, "firstRow"))) w.firstRow = true;
        if (parseOnOff(attr(webEl, "xl97"))) w.xl97 = true;
        if (parseOnOff(attr(webEl, "textDates"))) w.textDates = true;
        if (parseOnOff(attr(webEl, "xl2000"))) w.xl2000 = true;
        if (attr(webEl, "url") !== void 0) w.url = attr(webEl, "url");
        if (attr(webEl, "post") !== void 0) w.post = attr(webEl, "post");
        if (parseOnOff(attr(webEl, "htmlTables"))) w.htmlTables = true;
        if (attr(webEl, "htmlFormat") !== void 0) w.htmlFormat = attr(webEl, "htmlFormat");
        if (attr(webEl, "editPage") !== void 0) w.editPage = attr(webEl, "editPage");
        const tablesEl = findChild(webEl, "tables");
        if (tablesEl) {
          const tables = [];
          for (const tEl of tablesEl.elements ?? []) if (tEl.name === "m") tables.push(null);
          else if (tEl.name === "s") tables.push(attr(tEl, "v") ?? "");
          else if (tEl.name === "x") tables.push(attrNum(tEl, "v") ?? 0);
          if (tables.length > 0) w.tables = tables;
        }
        c.webPr = w;
      }
      const textEl = findChild(cEl, "textPr");
      if (textEl) {
        const t = {};
        if (String(attr(textEl, "prompt")) === "0") t.prompt = false;
        const ft = attr(textEl, "fileType");
        if (ft !== void 0) t.fileType = ft;
        const cp = attrNum(textEl, "codePage");
        if (cp !== void 0) t.codePage = cp;
        if (attr(textEl, "characterSet") !== void 0) t.characterSet = attr(textEl, "characterSet");
        const fr = attrNum(textEl, "firstRow");
        if (fr !== void 0) t.firstRow = fr;
        if (attr(textEl, "sourceFile") !== void 0) t.sourceFile = attr(textEl, "sourceFile");
        if (String(attr(textEl, "delimited")) === "0") t.delimited = false;
        if (attr(textEl, "delimiter") !== void 0) t.delimiter = attr(textEl, "delimiter");
        if (attr(textEl, "decimal") !== void 0) t.decimal = attr(textEl, "decimal");
        if (attr(textEl, "thousands") !== void 0) t.thousands = attr(textEl, "thousands");
        if (String(attr(textEl, "tab")) === "0") t.tab = false;
        if (parseOnOff(attr(textEl, "space"))) t.space = true;
        if (parseOnOff(attr(textEl, "comma"))) t.comma = true;
        if (parseOnOff(attr(textEl, "semicolon"))) t.semicolon = true;
        if (parseOnOff(attr(textEl, "consecutive"))) t.consecutive = true;
        const q = attr(textEl, "qualifier");
        if (q !== void 0) t.qualifier = q;
        const fieldsEl = findChild(textEl, "textFields");
        if (fieldsEl) {
          const fields = [];
          for (const fEl of fieldsEl.elements ?? []) {
            if (fEl.name !== "textField") continue;
            const f = {};
            if (attr(fEl, "type") !== void 0) f.type = attr(fEl, "type");
            const pos = attrNum(fEl, "position");
            if (pos !== void 0) f.position = pos;
            fields.push(f);
          }
          if (fields.length > 0) t.textFields = fields;
        }
        c.textPr = t;
      }
      const paramsEl = findChild(cEl, "parameters");
      if (paramsEl) {
        const params = [];
        for (const pmEl of paramsEl.elements ?? []) {
          if (pmEl.name !== "parameter") continue;
          const pm = {};
          if (attr(pmEl, "name") !== void 0) pm.name = attr(pmEl, "name");
          const st = attrNum(pmEl, "sqlType");
          if (st !== void 0) pm.sqlType = st;
          const pt = attr(pmEl, "parameterType");
          if (pt !== void 0) pm.parameterType = pt;
          if (parseOnOff(attr(pmEl, "refreshOnChange"))) pm.refreshOnChange = true;
          if (attr(pmEl, "prompt") !== void 0) pm.prompt = attr(pmEl, "prompt");
          if (attr(pmEl, "boolean") !== void 0) pm.boolean = parseOnOff(attr(pmEl, "boolean"));
          const dbl = attrNum(pmEl, "double");
          if (dbl !== void 0) pm.double = dbl;
          const int = attrNum(pmEl, "integer");
          if (int !== void 0) pm.integer = int;
          if (attr(pmEl, "string") !== void 0) pm.string = attr(pmEl, "string");
          if (attr(pmEl, "cell") !== void 0) pm.cell = attr(pmEl, "cell");
          params.push(pm);
        }
        if (params.length > 0) c.parameters = params;
      }
      connections.push(c);
    }
    return { connections };
  }
};
var queryTableDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const attrs2 = [];
    if (opts.name !== void 0) attrs2.push(`name="${escapeXml(opts.name)}"`);
    if (opts.headers === false) attrs2.push('headers="0"');
    if (opts.rowNumbers) attrs2.push('rowNumbers="1"');
    if (opts.disableRefresh) attrs2.push('disableRefresh="1"');
    if (opts.backgroundRefresh === false) attrs2.push('backgroundRefresh="0"');
    if (opts.firstBackgroundRefresh) attrs2.push('firstBackgroundRefresh="1"');
    if (opts.refreshOnLoad) attrs2.push('refreshOnLoad="1"');
    if (opts.growShrinkType !== void 0) attrs2.push(`growShrinkType="${opts.growShrinkType}"`);
    if (opts.fillFormulas) attrs2.push('fillFormulas="1"');
    if (opts.removeDataOnSave) attrs2.push('removeDataOnSave="1"');
    if (opts.disableEdit) attrs2.push('disableEdit="1"');
    if (opts.preserveFormatting === false) attrs2.push('preserveFormatting="0"');
    if (opts.adjustColumnWidth) attrs2.push('adjustColumnWidth="1"');
    if (opts.autoFormat) attrs2.push('autoFormat="1"');
    if (opts.intermediate) attrs2.push('intermediate="1"');
    attrs2.push(`connectionId="${opts.connectionId}"`);
    let inner = "";
    const r = opts.queryTableRefresh;
    if (r) {
      const rAttrs = [];
      if (r.preserveSortFilterLayout === false) rAttrs.push('preserveSortFilterLayout="0"');
      if (r.fieldIdWrapped) rAttrs.push('fieldIdWrapped="1"');
      if (r.headersInLastRefresh === false) rAttrs.push('headersInLastRefresh="0"');
      if (r.minimumVersion !== void 0) rAttrs.push(`minimumVersion="${r.minimumVersion}"`);
      if (r.nextId !== void 0) rAttrs.push(`nextId="${r.nextId}"`);
      if (r.unboundColumnsLeft !== void 0) rAttrs.push(`unboundColumnsLeft="${r.unboundColumnsLeft}"`);
      if (r.unboundColumnsRight !== void 0) rAttrs.push(`unboundColumnsRight="${r.unboundColumnsRight}"`);
      const rInner = [];
      if (r.queryTableFields && r.queryTableFields.length > 0) {
        const fParts = [`<queryTableFields count="${r.queryTableFields.length}">`];
        for (const f of r.queryTableFields) {
          const fAttrs = [`id="${f.id}"`];
          if (f.name !== void 0) fAttrs.push(`name="${escapeXml(f.name)}"`);
          if (f.dataBound === false) fAttrs.push('dataBound="0"');
          if (f.rowNumbers) fAttrs.push('rowNumbers="1"');
          if (f.fillFormulas) fAttrs.push('fillFormulas="1"');
          if (f.clipped) fAttrs.push('clipped="1"');
          if (f.tableColumnId !== void 0) fAttrs.push(`tableColumnId="${f.tableColumnId}"`);
          fParts.push(`<queryTableField ${fAttrs.join(" ")}/>`);
        }
        fParts.push("</queryTableFields>");
        rInner.push(fParts.join(""));
      }
      if (r.deletedFields && r.deletedFields.length > 0) {
        const dParts = [`<queryTableDeletedFields count="${r.deletedFields.length}">`];
        for (const d of r.deletedFields) dParts.push(`<deletedField name="${escapeXml(d.name)}"/>`);
        dParts.push("</queryTableDeletedFields>");
        rInner.push(dParts.join(""));
      }
      if (rInner.length > 0) inner = `<queryTableRefresh ${rAttrs.join(" ")}>${rInner.join("")}</queryTableRefresh>`;
      else inner = `<queryTableRefresh ${rAttrs.join(" ")}/>`;
    }
    return `<queryTable xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ${attrs2.join(" ")}>${inner}</queryTable>`;
  },
  parse(el, _ctx) {
    const result = {};
    if (attr(el, "name") !== void 0) result.name = attr(el, "name");
    if (String(attr(el, "headers")) === "0") result.headers = false;
    if (parseOnOff(attr(el, "rowNumbers"))) result.rowNumbers = true;
    if (parseOnOff(attr(el, "disableRefresh"))) result.disableRefresh = true;
    if (String(attr(el, "backgroundRefresh")) === "0") result.backgroundRefresh = false;
    if (parseOnOff(attr(el, "firstBackgroundRefresh"))) result.firstBackgroundRefresh = true;
    if (parseOnOff(attr(el, "refreshOnLoad"))) result.refreshOnLoad = true;
    const gst = attr(el, "growShrinkType");
    if (gst !== void 0) result.growShrinkType = gst;
    if (parseOnOff(attr(el, "fillFormulas"))) result.fillFormulas = true;
    if (parseOnOff(attr(el, "removeDataOnSave"))) result.removeDataOnSave = true;
    if (parseOnOff(attr(el, "disableEdit"))) result.disableEdit = true;
    if (String(attr(el, "preserveFormatting")) === "0") result.preserveFormatting = false;
    if (parseOnOff(attr(el, "adjustColumnWidth"))) result.adjustColumnWidth = true;
    if (parseOnOff(attr(el, "autoFormat"))) result.autoFormat = true;
    if (parseOnOff(attr(el, "intermediate"))) result.intermediate = true;
    const cid = attrNum(el, "connectionId");
    if (cid !== void 0) result.connectionId = cid;
    const rEl = findChild(el, "queryTableRefresh");
    if (rEl) {
      const r = {};
      if (String(attr(rEl, "preserveSortFilterLayout")) === "0") r.preserveSortFilterLayout = false;
      if (parseOnOff(attr(rEl, "fieldIdWrapped"))) r.fieldIdWrapped = true;
      if (String(attr(rEl, "headersInLastRefresh")) === "0") r.headersInLastRefresh = false;
      const mv = attrNum(rEl, "minimumVersion");
      if (mv !== void 0) r.minimumVersion = mv;
      const nid = attrNum(rEl, "nextId");
      if (nid !== void 0) r.nextId = nid;
      const ucl = attrNum(rEl, "unboundColumnsLeft");
      if (ucl !== void 0) r.unboundColumnsLeft = ucl;
      const ucr = attrNum(rEl, "unboundColumnsRight");
      if (ucr !== void 0) r.unboundColumnsRight = ucr;
      const fieldsEl = findChild(rEl, "queryTableFields");
      if (fieldsEl) {
        const fields = [];
        for (const fEl of fieldsEl.elements ?? []) {
          if (fEl.name !== "queryTableField") continue;
          const f = { id: attrNum(fEl, "id") ?? 0 };
          if (attr(fEl, "name") !== void 0) f.name = attr(fEl, "name");
          if (String(attr(fEl, "dataBound")) === "0") f.dataBound = false;
          if (parseOnOff(attr(fEl, "rowNumbers"))) f.rowNumbers = true;
          if (parseOnOff(attr(fEl, "fillFormulas"))) f.fillFormulas = true;
          if (parseOnOff(attr(fEl, "clipped"))) f.clipped = true;
          const tci = attrNum(fEl, "tableColumnId");
          if (tci !== void 0) f.tableColumnId = tci;
          fields.push(f);
        }
        if (fields.length > 0) r.queryTableFields = fields;
      }
      const delEl = findChild(rEl, "queryTableDeletedFields");
      if (delEl) {
        const deleted = [];
        for (const dEl of delEl.elements ?? []) {
          if (dEl.name !== "deletedField") continue;
          deleted.push({ name: attr(dEl, "name") ?? "" });
        }
        if (deleted.length > 0) r.deletedFields = deleted;
      }
      result.queryTableRefresh = r;
    }
    return result;
  }
};
var METADATA_TYPE_BOOL_ATTRS = [
  "ghostRow",
  "ghostCol",
  "edit",
  "delete",
  "copy",
  "pasteAll",
  "pasteFormulas",
  "pasteValues",
  "pasteFormats",
  "pasteComments",
  "pasteDataValidation",
  "pasteBorders",
  "pasteColWidths",
  "pasteNumberFormats",
  "merge",
  "splitFirst",
  "splitAll",
  "rowColShift",
  "clearAll",
  "clearFormats",
  "clearContents",
  "clearComments",
  "assign",
  "coerce",
  "adjust",
  "cellMeta"
];
var metadataDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<metadata xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    if (opts.types && opts.types.length > 0) {
      p.push(`<metadataTypes count="${opts.types.length}">`);
      for (const t of opts.types) {
        const attrs2 = [`name="${escapeXml(t.name)}"`, `minSupportedVersion="${t.minSupportedVersion}"`];
        for (const key of METADATA_TYPE_BOOL_ATTRS) if (t[key]) attrs2.push(`${key}="1"`);
        p.push(`<metadataType ${attrs2.join(" ")}/>`);
      }
      p.push("</metadataTypes>");
    }
    if (opts.strings && opts.strings.length > 0) {
      p.push(`<metadataStrings count="${opts.strings.length}">`);
      for (const s of opts.strings) p.push(`<s v="${escapeXml(s.value)}"/>`);
      p.push("</metadataStrings>");
    }
    if (opts.mdx && opts.mdx.length > 0) {
      p.push(`<mdxMetadata count="${opts.mdx.length}">`);
      for (const m of opts.mdx) {
        const attrs2 = [`n="${m.stringIndex}"`, `f="${m.functionType}"`];
        let inner = "";
        if (m.tuple) {
          const t = m.tuple;
          const tAttrs = [];
          if (t.count !== void 0) tAttrs.push(`c="${t.count}"`);
          if (t.culture !== void 0) tAttrs.push(`ct="${escapeXml(t.culture)}"`);
          if (t.styleIndex !== void 0) tAttrs.push(`si="${t.styleIndex}"`);
          if (t.formatIndex !== void 0) tAttrs.push(`fi="${t.formatIndex}"`);
          if (t.backgroundColor !== void 0) tAttrs.push(`bc="${t.backgroundColor}"`);
          if (t.foregroundColor !== void 0) tAttrs.push(`fc="${t.foregroundColor}"`);
          if (t.italic) tAttrs.push('i="1"');
          if (t.underline) tAttrs.push('u="1"');
          if (t.strikethrough) tAttrs.push('st="1"');
          if (t.bold) tAttrs.push('b="1"');
          const idxXml = stringifyStringIndexes(t.stringIndexes);
          inner = idxXml ? `<t ${tAttrs.join(" ")}>${idxXml}</t>` : `<t ${tAttrs.join(" ")}/>`;
        } else if (m.set) {
          const s = m.set;
          const sAttrs = [`ns="${s.namespaceCount}"`];
          if (s.count !== void 0) sAttrs.push(`c="${s.count}"`);
          if (s.order !== void 0 && s.order !== "u") sAttrs.push(`o="${escapeXml(s.order)}"`);
          const idxXml = stringifyStringIndexes(s.stringIndexes);
          inner = idxXml ? `<ms ${sAttrs.join(" ")}>${idxXml}</ms>` : `<ms ${sAttrs.join(" ")}/>`;
        } else if (m.memberProp) inner = `<p n="${m.memberProp.nameIndex}" np="${m.memberProp.namePairIndex}"/>`;
        else if (m.kpi) inner = `<k n="${m.kpi.nameIndex}" np="${m.kpi.namePairIndex}" p="${m.kpi.property}"/>`;
        p.push(`<mdx ${attrs2.join(" ")}>${inner}</mdx>`);
      }
      p.push("</mdxMetadata>");
    }
    for (const fm of opts.futureMetadata ?? []) {
      const blocks = fm.blocks ?? [];
      if (blocks.length > 0) {
        p.push(`<futureMetadata name="${escapeXml(fm.name)}" count="${blocks.length}">`);
        for (const b of blocks) if (b.extLst) p.push(`<bk>${b.extLst}</bk>`);
        else p.push("<bk/>");
        p.push("</futureMetadata>");
      } else p.push(`<futureMetadata name="${escapeXml(fm.name)}"/>`);
    }
    if (opts.cellMetadata && opts.cellMetadata.length > 0) {
      p.push(`<cellMetadata count="${opts.cellMetadata.length}">`);
      for (const b of opts.cellMetadata) p.push(stringifyBlock(b));
      p.push("</cellMetadata>");
    }
    if (opts.valueMetadata && opts.valueMetadata.length > 0) {
      p.push(`<valueMetadata count="${opts.valueMetadata.length}">`);
      for (const b of opts.valueMetadata) p.push(stringifyBlock(b));
      p.push("</valueMetadata>");
    }
    p.push("</metadata>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const typesEl = findChild(el, "metadataTypes");
    if (typesEl) {
      const types = [];
      for (const tEl of typesEl.elements ?? []) {
        if (tEl.name !== "metadataType") continue;
        const t = { name: attr(tEl, "name") ?? "" };
        const msv = attrNum(tEl, "minSupportedVersion");
        if (msv !== void 0) t.minSupportedVersion = msv;
        for (const key of METADATA_TYPE_BOOL_ATTRS) if (parseOnOff(attr(tEl, key))) t[key] = true;
        types.push(t);
      }
      result.types = types;
    }
    const stringsEl = findChild(el, "metadataStrings");
    if (stringsEl) {
      const strings = [];
      for (const sEl of stringsEl.elements ?? []) {
        if (sEl.name !== "s") continue;
        strings.push({ value: attr(sEl, "v") ?? "" });
      }
      result.strings = strings;
    }
    const mdxEl = findChild(el, "mdxMetadata");
    if (mdxEl) {
      const mdx = [];
      for (const mEl of mdxEl.elements ?? []) {
        if (mEl.name !== "mdx") continue;
        const m = {
          stringIndex: attrNum(mEl, "n") ?? 0,
          functionType: attr(mEl, "f") ?? "m"
        };
        const tEl = findChild(mEl, "t");
        if (tEl) {
          const t = {};
          const c = attrNum(tEl, "c");
          if (c !== void 0) t.count = c;
          if (attr(tEl, "ct") !== void 0) t.culture = attr(tEl, "ct");
          const si = attrNum(tEl, "si");
          if (si !== void 0) t.styleIndex = si;
          const fi = attrNum(tEl, "fi");
          if (fi !== void 0) t.formatIndex = fi;
          if (attr(tEl, "bc") !== void 0) t.backgroundColor = attr(tEl, "bc");
          if (attr(tEl, "fc") !== void 0) t.foregroundColor = attr(tEl, "fc");
          if (parseOnOff(attr(tEl, "i"))) t.italic = true;
          if (parseOnOff(attr(tEl, "u"))) t.underline = true;
          if (parseOnOff(attr(tEl, "st"))) t.strikethrough = true;
          if (parseOnOff(attr(tEl, "b"))) t.bold = true;
          const idx = parseStringIndexes(tEl);
          if (idx) t.stringIndexes = idx;
          m.tuple = t;
        }
        const msEl = findChild(mEl, "ms");
        if (msEl) {
          const s = { namespaceCount: attrNum(msEl, "ns") ?? 0 };
          const c = attrNum(msEl, "c");
          if (c !== void 0) s.count = c;
          if (attr(msEl, "o") !== void 0) s.order = attr(msEl, "o");
          const idx = parseStringIndexes(msEl);
          if (idx) s.stringIndexes = idx;
          m.set = s;
        }
        const pEl = findChild(mEl, "p");
        if (pEl) m.memberProp = {
          nameIndex: attrNum(pEl, "n") ?? 0,
          namePairIndex: attrNum(pEl, "np") ?? 0
        };
        const kEl = findChild(mEl, "k");
        if (kEl) m.kpi = {
          nameIndex: attrNum(kEl, "n") ?? 0,
          namePairIndex: attrNum(kEl, "np") ?? 0,
          property: attr(kEl, "p") ?? "v"
        };
        mdx.push(m);
      }
      result.mdx = mdx;
    }
    const future = [];
    for (const fmEl of el.elements ?? []) {
      if (fmEl.name !== "futureMetadata") continue;
      const fm = { name: attr(fmEl, "name") ?? "" };
      const blocks = [];
      for (const bEl of fmEl.elements ?? []) {
        if (bEl.name !== "bk") continue;
        const extEl = findChild(bEl, "extLst");
        blocks.push({ extLst: extEl ? stringifyElement(extEl) : void 0 });
      }
      if (blocks.length > 0) fm.blocks = blocks;
      future.push(fm);
    }
    if (future.length > 0) result.futureMetadata = future;
    const cellEl = findChild(el, "cellMetadata");
    if (cellEl) result.cellMetadata = parseBlocks(cellEl);
    const valueEl = findChild(el, "valueMetadata");
    if (valueEl) result.valueMetadata = parseBlocks(valueEl);
    return result;
  }
};
function stringifyStringIndexes(indexes) {
  if (!indexes || indexes.length === 0) return "";
  return indexes.map((i) => `<n x="${i.index}"${i.show ? ' s="1"' : ""}/>`).join("");
}
function parseStringIndexes(parent) {
  const out = [];
  for (const nEl of parent.elements ?? []) {
    if (nEl.name !== "n") continue;
    const idx = { index: attrNum(nEl, "x") ?? 0 };
    if (parseOnOff(attr(nEl, "s"))) idx.show = true;
    out.push(idx);
  }
  return out.length > 0 ? out : void 0;
}
function stringifyBlock(b) {
  return `<bk>${(b.records ?? []).map((r) => `<rc t="${r.typeIndex}" v="${r.valueIndex}"/>`).join("")}</bk>`;
}
function parseBlocks(el) {
  const blocks = [];
  for (const bEl of el.elements ?? []) {
    if (bEl.name !== "bk") continue;
    const records = [];
    for (const rcEl of bEl.elements ?? []) {
      if (rcEl.name !== "rc") continue;
      records.push({
        typeIndex: attrNum(rcEl, "t") ?? 0,
        valueIndex: attrNum(rcEl, "v") ?? 0
      });
    }
    blocks.push(records.length > 0 ? { records } : {});
  }
  return blocks;
}
var pivotTableDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return stringifyPivotTable(opts.options, opts.sourceData, opts.cacheId);
  },
  parse(el, _ctx) {
    const result = {};
    if (attr(el, "name")) result.name = attr(el, "name");
    if (attr(el, "cacheId") !== void 0) result.cacheId = attrNum(el, "cacheId") ?? 0;
    if (parseOnOff(attr(el, "dataOnRows"))) result.dataOnRows = true;
    if (String(attr(el, "showHeaders")) === "0") result.showHeaders = false;
    if (parseOnOff(attr(el, "showEmptyRow"))) result.showEmptyRow = true;
    if (parseOnOff(attr(el, "showEmptyCol"))) result.showEmptyCol = true;
    if (attr(el, "grandTotalCaption")) result.grandTotalCaption = attr(el, "grandTotalCaption");
    if (attr(el, "errorCaption")) result.errorCaption = attr(el, "errorCaption");
    if (parseOnOff(attr(el, "showError"))) result.showError = true;
    if (attr(el, "missingCaption")) result.missingCaption = attr(el, "missingCaption");
    if (String(attr(el, "showMissing")) === "0") result.showMissing = false;
    if (attr(el, "pageStyle")) result.pageStyle = attr(el, "pageStyle");
    if (attr(el, "pivotTableStyle")) result.pivotTableStyle = attr(el, "pivotTableStyle");
    if (attr(el, "tag")) result.tag = attr(el, "tag");
    if (String(attr(el, "showItems")) === "0") result.showItems = false;
    if (parseOnOff(attr(el, "editData"))) result.editData = true;
    if (parseOnOff(attr(el, "disableFieldList"))) result.disableFieldList = true;
    if (String(attr(el, "showCalcMbrs")) === "0") result.showCalcMbrs = false;
    if (parseOnOff(attr(el, "visualTotals"))) result.visualTotals = true;
    if (String(attr(el, "showMultipleLabel")) === "0") result.showMultipleLabel = false;
    if (String(attr(el, "showDataDropDown")) === "0") result.showDataDropDown = false;
    if (String(attr(el, "showDrill")) === "0") result.showDrill = false;
    if (parseOnOff(attr(el, "printDrill"))) result.printDrill = true;
    if (parseOnOff(attr(el, "showMemberPropertyTips"))) result.showMemberPropertyTips = true;
    if (String(attr(el, "showDataTips")) === "0") result.showDataTips = false;
    if (String(attr(el, "enableWizard")) === "0") result.enableWizard = false;
    if (String(attr(el, "enableDrill")) === "0") result.enableDrill = false;
    if (String(attr(el, "enableFieldProperties")) === "0") result.enableFieldProperties = false;
    const pageWrap = attrNum(el, "pageWrap");
    if (pageWrap !== void 0) result.pageWrap = pageWrap;
    if (parseOnOff(attr(el, "pageOverThenDown"))) result.pageOverThenDown = true;
    if (parseOnOff(attr(el, "subtotalHiddenItems"))) result.subtotalHiddenItems = true;
    if (parseOnOff(attr(el, "fieldPrintTitles"))) result.fieldPrintTitles = true;
    if (parseOnOff(attr(el, "mergeItem"))) result.mergeItem = true;
    if (String(attr(el, "showDropZones")) === "0") result.showDropZones = false;
    if (parseOnOff(attr(el, "published"))) result.published = true;
    if (String(attr(el, "gridDropZones")) === "0") result.gridDropZones = false;
    if (String(attr(el, "multipleFieldFilters")) === "0") result.multipleFieldFilters = false;
    if (attr(el, "rowHeaderCaption")) result.rowHeaderCaption = attr(el, "rowHeaderCaption");
    if (attr(el, "colHeaderCaption")) result.colHeaderCaption = attr(el, "colHeaderCaption");
    if (parseOnOff(attr(el, "fieldListSortAscending"))) result.fieldListSortAscending = true;
    if (parseOnOff(attr(el, "mdxSubqueries"))) result.mdxSubqueries = true;
    if (String(attr(el, "customListSort")) === "0") result.customListSort = false;
    if (parseOnOff(attr(el, "asteriskTotals"))) result.asteriskTotals = true;
    const dataPosition = attrNum(el, "dataPosition");
    if (dataPosition !== void 0) result.dataPosition = dataPosition;
    if (parseOnOff(attr(el, "immersive"))) result.immersive = true;
    if (attr(el, "vacatedStyle")) result.vacatedStyle = attr(el, "vacatedStyle");
    if (parseOnOff(attr(el, "chartFormat"))) result.chartFormat = true;
    if (String(attr(el, "preserveFormatting")) === "0") result.preserveFormatting = false;
    else if (parseOnOff(attr(el, "preserveFormatting"))) result.preserveFormatting = true;
    if (attr(el, "dataCaption")) result.dataCaption = attr(el, "dataCaption");
    const locEl = findChild(el, "location");
    if (locEl) {
      if (attr(locEl, "ref")) result.location = attr(locEl, "ref");
      const rpc = attrNum(locEl, "rowPageCount");
      if (rpc !== void 0) result.locationRowPageCount = rpc;
      const cpc = attrNum(locEl, "colPageCount");
      if (cpc !== void 0) result.locationColPageCount = cpc;
    }
    const pfEl = findChild(el, "pivotFields");
    if (pfEl) {
      const fields = [];
      for (const fEl of pfEl.elements ?? []) {
        if (fEl.name !== "pivotField") continue;
        const field = {};
        const axis = attr(fEl, "axis");
        if (axis) field.axis = axis;
        if (String(attr(fEl, "showAll")) === "0") field.showAll = false;
        else if (parseOnOff(attr(fEl, "showAll"))) field.showAll = true;
        if (parseOnOff(attr(fEl, "dataField"))) field.dataField = true;
        if (attr(fEl, "hierarchy")) field.hierarchy = attr(fEl, "hierarchy");
        if (String(attr(fEl, "dragToRow")) === "0") field.dragToRow = false;
        if (String(attr(fEl, "dragToCol")) === "0") field.dragToCol = false;
        if (String(attr(fEl, "dragToPage")) === "0") field.dragToPage = false;
        if (parseOnOff(attr(fEl, "dragToData"))) field.dragToData = true;
        if (String(attr(fEl, "dragOff")) === "0") field.dragOff = false;
        if (String(attr(fEl, "showDropDowns")) === "0") field.showDropDowns = false;
        if (parseOnOff(attr(fEl, "insertBlankRow"))) field.insertBlankRow = true;
        if (parseOnOff(attr(fEl, "showPropCell"))) field.showPropCell = true;
        if (parseOnOff(attr(fEl, "showPropTip"))) field.showPropTip = true;
        if (parseOnOff(attr(fEl, "showPropAsCaption"))) field.showPropAsCaption = true;
        if (String(attr(fEl, "compact")) === "0") field.compact = false;
        if (parseOnOff(attr(fEl, "outline"))) field.outline = true;
        if (String(attr(fEl, "subtotalTop")) === "0") field.subtotalTop = false;
        if (parseOnOff(attr(fEl, "includeNewItemsInFilter"))) field.includeNewItemsInFilter = true;
        if (parseOnOff(attr(fEl, "avgSubtotal"))) field.avgSubtotal = true;
        if (parseOnOff(attr(fEl, "countASubtotal"))) field.countASubtotal = true;
        if (parseOnOff(attr(fEl, "maxSubtotal"))) field.maxSubtotal = true;
        if (parseOnOff(attr(fEl, "minSubtotal"))) field.minSubtotal = true;
        if (parseOnOff(attr(fEl, "sumSubtotal"))) field.sumSubtotal = true;
        fields.push(field);
      }
      result.pivotFields = fields;
    }
    const dfEl = findChild(el, "dataFields");
    if (dfEl) {
      const dataFields = [];
      for (const dEl of dfEl.elements ?? []) {
        if (dEl.name !== "dataField") continue;
        const df = {};
        if (attr(dEl, "name")) df.name = attr(dEl, "name");
        const fld = attrNum(dEl, "fld");
        if (fld !== void 0) df.fld = fld;
        if (attr(dEl, "subtotal")) df.subtotal = attr(dEl, "subtotal");
        if (attr(dEl, "showDataAs")) df.showDataAs = attr(dEl, "showDataAs");
        const baseField = attrNum(dEl, "baseField");
        if (baseField !== void 0) df.baseField = baseField;
        const baseItem = attrNum(dEl, "baseItem");
        if (baseItem !== void 0) df.baseItem = baseItem;
        if (attr(dEl, "numFmtId")) df.numFmtId = attr(dEl, "numFmtId");
        dataFields.push(df);
      }
      result.dataFields = dataFields;
    }
    const rowFieldsEl = findChild(el, "rowFields");
    if (rowFieldsEl) {
      const rowFields = [];
      for (const f of rowFieldsEl.elements ?? []) if (f.name === "field") {
        const x = attrNum(f, "x");
        if (x !== void 0) rowFields.push(x);
      }
      result.rowFields = rowFields;
    }
    const colFieldsEl = findChild(el, "colFields");
    if (colFieldsEl) {
      const colFields = [];
      for (const f of colFieldsEl.elements ?? []) if (f.name === "field") {
        const x = attrNum(f, "x");
        if (x !== void 0) colFields.push(x);
      }
      result.colFields = colFields;
    }
    const pageFieldsEl = findChild(el, "pageFields");
    if (pageFieldsEl) {
      const pageFields = [];
      for (const pf of pageFieldsEl.elements ?? []) {
        if (pf.name !== "pageField") continue;
        const pfResult = {};
        const fld = attrNum(pf, "fld");
        if (fld !== void 0) pfResult.fld = fld;
        const hier = attrNum(pf, "hier");
        if (hier !== void 0) pfResult.hier = hier;
        if (attr(pf, "cap")) pfResult.cap = attr(pf, "cap");
        const item = attrNum(pf, "item");
        if (item !== void 0) pfResult.item = item;
        pageFields.push(pfResult);
      }
      result.pageFields = pageFields;
    }
    const formatsEl = findChild(el, "formats");
    if (formatsEl) {
      const formats = [];
      for (const fmtEl of formatsEl.elements ?? []) {
        if (fmtEl.name !== "format") continue;
        const fmt = {};
        if (attr(fmtEl, "action")) fmt.action = attr(fmtEl, "action");
        const dxfId = attrNum(fmtEl, "dxfId");
        if (dxfId !== void 0) fmt.dxfId = dxfId;
        const paEl = findChild(fmtEl, "pivotArea");
        if (paEl) fmt.pivotArea = parsePivotArea(paEl);
        formats.push(fmt);
      }
      result.formats = formats;
    }
    const condFormatsEl = findChild(el, "conditionalFormats");
    if (condFormatsEl) {
      const condFormats = [];
      for (const cfEl of condFormatsEl.elements ?? []) {
        if (cfEl.name !== "conditionalFormat") continue;
        const cf = {};
        if (attr(cfEl, "scope")) cf.scope = attr(cfEl, "scope");
        if (attr(cfEl, "type")) cf.type = attr(cfEl, "type");
        const priority = attrNum(cfEl, "priority");
        if (priority !== void 0) cf.priority = priority;
        const areasEl = findChild(cfEl, "pivotAreas");
        if (areasEl) {
          const areas = [];
          for (const aEl of areasEl.elements ?? []) {
            if (aEl.name !== "pivotArea") continue;
            areas.push(parsePivotArea(aEl));
          }
          cf.pivotAreas = areas;
        }
        condFormats.push(cf);
      }
      result.conditionalFormats = condFormats;
    }
    const chartFormatsEl = findChild(el, "chartFormats");
    if (chartFormatsEl) {
      const chartFormats = [];
      for (const cfEl of chartFormatsEl.elements ?? []) {
        if (cfEl.name !== "chartFormat") continue;
        const cf = {};
        const chart = attrNum(cfEl, "chart");
        if (chart !== void 0) cf.chart = chart;
        const format = attrNum(cfEl, "format");
        if (format !== void 0) cf.format = format;
        if (parseOnOff(attr(cfEl, "series"))) cf.series = true;
        const paEl = findChild(cfEl, "pivotArea");
        if (paEl) cf.pivotArea = parsePivotArea(paEl);
        chartFormats.push(cf);
      }
      result.chartFormats = chartFormats;
    }
    const hierarchiesEl = findChild(el, "pivotHierarchies");
    if (hierarchiesEl) {
      const hierarchies = [];
      for (const hEl of hierarchiesEl.elements ?? []) {
        if (hEl.name !== "pivotHierarchy") continue;
        const h = {};
        if (parseOnOff(attr(hEl, "outline"))) h.outline = true;
        if (parseOnOff(attr(hEl, "multipleItemSelectionAllowed"))) h.multipleItemSelectionAllowed = true;
        if (parseOnOff(attr(hEl, "subtotalTop"))) h.subtotalTop = true;
        if (String(attr(hEl, "showInFieldList")) === "0") h.showInFieldList = false;
        if (String(attr(hEl, "dragToRow")) === "0") h.dragToRow = false;
        if (String(attr(hEl, "dragToCol")) === "0") h.dragToCol = false;
        if (String(attr(hEl, "dragToPage")) === "0") h.dragToPage = false;
        if (parseOnOff(attr(hEl, "dragToData"))) h.dragToData = true;
        if (String(attr(hEl, "dragOff")) === "0") h.dragOff = false;
        if (parseOnOff(attr(hEl, "includeNewItemsInFilter"))) h.includeNewItemsInFilter = true;
        if (attr(hEl, "caption")) h.caption = attr(hEl, "caption");
        hierarchies.push(h);
      }
      result.pivotHierarchies = hierarchies;
    }
    const filtersEl = findChild(el, "filters");
    if (filtersEl) {
      const filters = [];
      for (const fEl of filtersEl.elements ?? []) {
        if (fEl.name !== "filter") continue;
        const f = {};
        const fld = attrNum(fEl, "fld");
        if (fld !== void 0) f.fld = fld;
        if (attr(fEl, "type")) f.type = attr(fEl, "type");
        const id = attrNum(fEl, "id");
        if (id !== void 0) f.id = id;
        const mpFld = attrNum(fEl, "mpFld");
        if (mpFld !== void 0) f.mpFld = mpFld;
        const evalOrder = attrNum(fEl, "evalOrder");
        if (evalOrder !== void 0) f.evalOrder = evalOrder;
        const imh = attrNum(fEl, "iMeasureHier");
        if (imh !== void 0) f.iMeasureHier = imh;
        const imf = attrNum(fEl, "iMeasureFld");
        if (imf !== void 0) f.iMeasureFld = imf;
        if (attr(fEl, "stringValue1")) f.stringValue1 = attr(fEl, "stringValue1");
        if (attr(fEl, "stringValue2")) f.stringValue2 = attr(fEl, "stringValue2");
        filters.push(f);
      }
      result.filters = filters;
    }
    const rhuEl = findChild(el, "rowHierarchiesUsage");
    if (rhuEl) {
      const usage = [];
      for (const u of rhuEl.elements ?? []) if (u.name === "rowHierarchyUsage") usage.push({ hierarchyUsage: attrNum(u, "hierarchyUsage") ?? 0 });
      result.rowHierarchiesUsage = usage;
    }
    const chuEl = findChild(el, "colHierarchiesUsage");
    if (chuEl) {
      const usage = [];
      for (const u of chuEl.elements ?? []) if (u.name === "colHierarchyUsage") usage.push({ hierarchyUsage: attrNum(u, "hierarchyUsage") ?? 0 });
      result.colHierarchiesUsage = usage;
    }
    const ciEl = findChild(el, "calculatedItems");
    if (ciEl) {
      const items = [];
      for (const iEl of ciEl.elements ?? []) {
        if (iEl.name !== "calculatedItem") continue;
        const item = {};
        const field = attrNum(iEl, "field");
        if (field !== void 0) item.field = field;
        const formulaEl = findChild(iEl, "formula");
        if (formulaEl) item.formula = textOf(formulaEl);
        const paEl = findChild(iEl, "pivotArea");
        if (paEl) item.pivotArea = parsePivotArea(paEl);
        items.push(item);
      }
      result.calculatedItems = items;
    }
    const cmEl = findChild(el, "calculatedMembers");
    if (cmEl) {
      const members = [];
      for (const mEl of cmEl.elements ?? []) {
        if (mEl.name !== "calculatedMember") continue;
        const m = {};
        if (attr(mEl, "name")) m.name = attr(mEl, "name");
        const mdxEl = findChild(mEl, "mdx");
        if (mdxEl) m.mdx = textOf(mdxEl) ?? "";
        if (attr(mEl, "memberName")) m.memberName = attr(mEl, "memberName");
        if (attr(mEl, "hierarchy")) m.hierarchy = attr(mEl, "hierarchy");
        if (attr(mEl, "parent")) m.parent = attr(mEl, "parent");
        const solveOrder = attrNum(mEl, "solveOrder");
        if (solveOrder !== void 0) m.solveOrder = solveOrder;
        if (parseOnOff(attr(mEl, "set"))) m.set = true;
        members.push(m);
      }
      result.calculatedMembers = members;
    }
    const styleInfoEl = findChild(el, "pivotTableStyleInfo");
    if (styleInfoEl) {
      const styleName = attr(styleInfoEl, "name");
      if (styleName) result.style = styleName;
    } else if (attr(el, "styleName")) result.style = attr(el, "styleName");
    return result;
  }
};
var pivotCacheDefDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return stringifyPivotCacheDef(opts.sourceRef, opts.sourceSheet, opts.sourceData, opts.recordsRid, opts.cacheDefOpts);
  },
  parse(el, _ctx) {
    const result = {};
    if (parseOnOff(attr(el, "invalid"))) result.invalid = true;
    if (String(attr(el, "saveData")) === "0") result.saveData = false;
    if (parseOnOff(attr(el, "optimizeMemory"))) result.optimizeMemory = true;
    if (String(attr(el, "enableRefresh")) === "0") result.enableRefresh = false;
    if (attr(el, "refreshedBy")) result.refreshedBy = attr(el, "refreshedBy");
    const rd = attrNum(el, "refreshedDate");
    if (rd !== void 0) result.refreshedDate = rd;
    if (attr(el, "refreshedDateIso")) result.refreshedDateIso = attr(el, "refreshedDateIso");
    if (parseOnOff(attr(el, "backgroundQuery"))) result.backgroundQuery = true;
    const mil = attrNum(el, "missingItemsLimit");
    if (mil !== void 0) result.missingItemsLimit = mil;
    if (parseOnOff(attr(el, "upgradeOnRefresh"))) result.upgradeOnRefresh = true;
    if (parseOnOff(attr(el, "supportSubquery"))) result.supportSubquery = true;
    if (parseOnOff(attr(el, "supportAdvancedDrill"))) result.supportAdvancedDrill = true;
    if (parseOnOff(attr(el, "refreshOnLoad"))) result.refreshOnLoad = true;
    if (parseOnOff(attr(el, "tupleCache"))) result.tupleCache = true;
    const recordCount = attrNum(el, "recordCount");
    if (recordCount !== void 0) result.recordCount = recordCount;
    const csEl = findChild(el, "cacheSource");
    if (csEl) {
      result.sourceType = attr(csEl, "type");
      const wssEl = findChild(csEl, "worksheetSource");
      if (wssEl) {
        const wss = {};
        if (attr(wssEl, "ref")) wss.ref = attr(wssEl, "ref");
        if (attr(wssEl, "sheet")) wss.sheet = attr(wssEl, "sheet");
        result.worksheetSource = wss;
      }
    }
    const cfEl = findChild(el, "cacheFields");
    if (cfEl) {
      const fields = [];
      for (const fEl of cfEl.elements ?? []) {
        if (fEl.name !== "cacheField") continue;
        const field = {};
        if (attr(fEl, "name")) field.name = attr(fEl, "name");
        if (attrNum(fEl, "numFmtId") !== void 0) field.numFmtId = attrNum(fEl, "numFmtId");
        const siEl = findChild(fEl, "sharedItems");
        if (siEl) {
          const items = [];
          for (const siChild of siEl.elements ?? []) {
            const v = attr(siChild, "v");
            if (v !== void 0) items.push(isNaN(Number(v)) ? v : Number(v));
          }
          field.sharedItems = items;
        }
        fields.push(field);
      }
      result.cacheFields = fields;
    }
    return result;
  }
};
var pivotCacheRecordsDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return stringifyPivotCacheRecords(opts.sourceData);
  },
  parse(el, _ctx) {
    const records = [];
    for (const rEl of el.elements ?? []) {
      if (rEl.name !== "r") continue;
      const record = [];
      for (const fEl of rEl.elements ?? []) {
        let entry;
        if (fEl.name === "x") entry = {
          type: "string",
          v: attrNum(fEl, "v") ?? 0
        };
        else if (fEl.name === "n") {
          const v = attr(fEl, "v");
          entry = {
            type: "number",
            v: v !== void 0 ? Number(v) : 0
          };
        } else if (fEl.name === "d") entry = {
          type: "date",
          v: attr(fEl, "v") ?? ""
        };
        else if (fEl.name === "e") entry = {
          type: "error",
          v: attr(fEl, "v") ?? ""
        };
        else if (fEl.name === "m") entry = { type: "missing" };
        else continue;
        record.push(entry);
      }
      records.push(record);
    }
    return { records };
  }
};
function stringifyPivotCacheDef(sourceRef, sourceSheet, sourceData, recordsRid, cacheDefOpts) {
  const p = [];
  const rootAttrs = [
    'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    `r:id="${escapeXml(recordsRid)}"`,
    `recordCount="${sourceData.records.length}"`,
    'createdVersion="6"',
    'refreshedVersion="6"',
    'minRefreshableVersion="3"'
  ];
  if (cacheDefOpts) {
    const cd2 = cacheDefOpts;
    if (cd2.invalid) rootAttrs.push('invalid="1"');
    if (cd2.saveData === false) rootAttrs.push('saveData="0"');
    if (cd2.optimizeMemory) rootAttrs.push('optimizeMemory="1"');
    if (cd2.enableRefresh === false) rootAttrs.push('enableRefresh="0"');
    if (cd2.refreshedBy) rootAttrs.push(`refreshedBy="${escapeXml(cd2.refreshedBy)}"`);
    if (cd2.refreshedDate !== void 0) rootAttrs.push(`refreshedDate="${cd2.refreshedDate}"`);
    if (cd2.refreshedDateIso) rootAttrs.push(`refreshedDateIso="${escapeXml(cd2.refreshedDateIso)}"`);
    if (cd2.backgroundQuery) rootAttrs.push('backgroundQuery="1"');
    if (cd2.missingItemsLimit !== void 0) rootAttrs.push(`missingItemsLimit="${cd2.missingItemsLimit}"`);
    if (cd2.upgradeOnRefresh) rootAttrs.push('upgradeOnRefresh="1"');
    if (cd2.supportSubquery) rootAttrs.push('supportSubquery="1"');
    if (cd2.supportAdvancedDrill) rootAttrs.push('supportAdvancedDrill="1"');
    if (cd2.refreshOnLoad) rootAttrs.push('refreshOnLoad="1"');
    if (cd2.tupleCache) rootAttrs.push('tupleCache="1"');
  }
  p.push(`<pivotCacheDefinition ${rootAttrs.join(" ")}>`);
  if (cacheDefOpts?.consolidation) {
    const con = cacheDefOpts.consolidation;
    const conParts = ['<cacheSource type="consolidation"><consolidation'];
    if (con.autoPage === false) conParts.push(' autoPage="0"');
    conParts.push(">");
    if (con.pages && con.pages.length > 0) {
      conParts.push(`<pages count="${con.pages.length}">`);
      for (const pg of con.pages) {
        const pgItems = pg.items ?? [];
        conParts.push(`<page${pgItems.length ? ` count="${pgItems.length}"` : ""}>`);
        for (const pi of pgItems) conParts.push(`<pageItem name="${escapeXml(pi.name)}"/>`);
        conParts.push("</page>");
      }
      conParts.push("</pages>");
    }
    conParts.push(`<rangeSets count="${con.rangeSets.length}">`);
    for (const rs of con.rangeSets) {
      const rsAttrs = [];
      if (rs.pageFieldIndex1 !== void 0) rsAttrs.push(`i1="${rs.pageFieldIndex1}"`);
      if (rs.pageFieldIndex2 !== void 0) rsAttrs.push(`i2="${rs.pageFieldIndex2}"`);
      if (rs.pageFieldIndex3 !== void 0) rsAttrs.push(`i3="${rs.pageFieldIndex3}"`);
      if (rs.pageFieldIndex4 !== void 0) rsAttrs.push(`i4="${rs.pageFieldIndex4}"`);
      if (rs.ref) rsAttrs.push(`ref="${escapeXml(rs.ref)}"`);
      if (rs.name) rsAttrs.push(`name="${escapeXml(rs.name)}"`);
      if (rs.sheet) rsAttrs.push(`sheet="${escapeXml(rs.sheet)}"`);
      if (rs.rId) rsAttrs.push(`r:id="${escapeXml(rs.rId)}"`);
      conParts.push(`<rangeSet ${rsAttrs.join(" ")}/>`);
    }
    conParts.push("</rangeSets></consolidation></cacheSource>");
    p.push(conParts.join(""));
  } else p.push(`<cacheSource type="worksheet"><worksheetSource ref="${escapeXml(sourceRef)}" sheet="${escapeXml(sourceSheet)}"/></cacheSource>`);
  const fieldNames = sourceData.fieldNames;
  p.push(`<cacheFields count="${fieldNames.length}">`);
  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i] ?? "";
    const numeric = isNumericField(sourceData.records, i);
    const uniqueVals = collectUniqueValues(sourceData.records, i);
    if (numeric) {
      let min = Infinity, max2 = -Infinity;
      for (const row of sourceData.records) {
        const v = row[i];
        if (typeof v === "number") {
          if (v < min) min = v;
          if (v > max2) max2 = v;
        }
      }
      if (!isFinite(min)) {
        min = 0;
        max2 = 0;
      }
      const allInteger = sourceData.records.every((row) => typeof row[i] === "number" && Number.isInteger(row[i]));
      const cfOverride = cacheDefOpts?.cacheFieldOverrides?.get(i);
      const cfExtraAttrs = [];
      const siExtraAttrs = [];
      if (cfOverride) {
        if (cfOverride.databaseField) cfExtraAttrs.push('databaseField="1"');
        if (cfOverride.level !== void 0) cfExtraAttrs.push(`level="${cfOverride.level}"`);
        if (cfOverride.mappingCount !== void 0) cfExtraAttrs.push(`mappingCount="${cfOverride.mappingCount}"`);
        if (cfOverride.memberPropertyField !== void 0) cfExtraAttrs.push(`memberPropertyField="${cfOverride.memberPropertyField}"`);
        if (cfOverride.propertyName) cfExtraAttrs.push(`propertyName="${escapeXml(cfOverride.propertyName)}"`);
        if (cfOverride.serverField) cfExtraAttrs.push('serverField="1"');
        if (cfOverride.uniqueList) cfExtraAttrs.push('uniqueList="1"');
        if (cfOverride.sqlType !== void 0) cfExtraAttrs.push(`sqlType="${cfOverride.sqlType}"`);
        if (cfOverride.containsMixedTypes) siExtraAttrs.push('containsMixedTypes="1"');
        if (cfOverride.containsNonDate) siExtraAttrs.push('containsNonDate="1"');
        if (cfOverride.longText) siExtraAttrs.push('longText="1"');
      }
      p.push(`<cacheField name="${escapeXml(fieldName)}" ${cfExtraAttrs.length ? cfExtraAttrs.join(" ") + " " : ""}numFmtId="0"><sharedItems containsSemiMixedTypes="0" containsString="0" containsNumber="1" containsInteger="${allInteger ? "1" : "0"}" minValue="${min}" maxValue="${max2}" count="${uniqueVals.length}"${siExtraAttrs.length ? " " + siExtraAttrs.join(" ") : ""}>`);
      for (const v of uniqueVals) if (v === null) p.push("<m/>");
      else if (v instanceof Date) p.push(`<d v="${v.toISOString().replace(/\.\d{3}Z$/, "Z")}"/>`);
      else p.push(`<n v="${v}"/>`);
      p.push("</sharedItems></cacheField>");
    } else {
      let hasDate = false, hasMissing = false;
      for (const v of uniqueVals) {
        if (v instanceof Date) hasDate = true;
        if (v === null) hasMissing = true;
      }
      const siAttrs = [`count="${uniqueVals.length}"`];
      if (hasDate) {
        siAttrs.push('containsDate="1"');
        let minD;
        let maxD;
        for (const v of uniqueVals) {
          if (!(v instanceof Date)) continue;
          if (!minD || v < minD) minD = v;
          if (!maxD || v > maxD) maxD = v;
        }
        const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
        if (minD) siAttrs.push(`minDate="${iso(minD)}"`);
        if (maxD) siAttrs.push(`maxDate="${iso(maxD)}"`);
      }
      if (hasMissing) siAttrs.push('containsBlank="1"');
      const cfOverride = cacheDefOpts?.cacheFieldOverrides?.get(i);
      const cfExtraAttrs = [];
      if (cfOverride) {
        if (cfOverride.databaseField) cfExtraAttrs.push('databaseField="1"');
        if (cfOverride.level !== void 0) cfExtraAttrs.push(`level="${cfOverride.level}"`);
        if (cfOverride.mappingCount !== void 0) cfExtraAttrs.push(`mappingCount="${cfOverride.mappingCount}"`);
        if (cfOverride.memberPropertyField !== void 0) cfExtraAttrs.push(`memberPropertyField="${cfOverride.memberPropertyField}"`);
        if (cfOverride.propertyName) cfExtraAttrs.push(`propertyName="${escapeXml(cfOverride.propertyName)}"`);
        if (cfOverride.serverField) cfExtraAttrs.push('serverField="1"');
        if (cfOverride.uniqueList) cfExtraAttrs.push('uniqueList="1"');
        if (cfOverride.sqlType !== void 0) cfExtraAttrs.push(`sqlType="${cfOverride.sqlType}"`);
        if (cfOverride.containsMixedTypes) siAttrs.push('containsMixedTypes="1"');
        if (cfOverride.containsNonDate) siAttrs.push('containsNonDate="1"');
        if (cfOverride.longText) siAttrs.push('longText="1"');
      }
      p.push(`<cacheField name="${escapeXml(fieldName)}" ${cfExtraAttrs.length ? cfExtraAttrs.join(" ") + " " : ""}numFmtId="0"><sharedItems ${siAttrs.join(" ")}>`);
      for (const v of uniqueVals) if (v === null) p.push("<m/>");
      else if (v instanceof Date) p.push(`<d v="${v.toISOString().replace(/\.\d{3}Z$/, "Z")}"/>`);
      else p.push(`<s v="${escapeXml(String(v))}"/>`);
      p.push("</sharedItems>");
      const fg = cacheDefOpts?.fieldGroups?.get(i);
      if (fg) {
        const fgParts = ["<fieldGroup"];
        if (fg.parent !== void 0) fgParts.push(` par="${fg.parent}"`);
        if (fg.base !== void 0) fgParts.push(` base="${fg.base}"`);
        fgParts.push(">");
        if (fg.rangePr) {
          const rp = fg.rangePr;
          const rpAttrs = [];
          if (rp.autoStart === false) rpAttrs.push('autoStart="0"');
          if (rp.autoEnd === false) rpAttrs.push('autoEnd="0"');
          if (rp.groupBy && rp.groupBy !== "range") rpAttrs.push(`groupBy="${rp.groupBy}"`);
          if (rp.startNum !== void 0) rpAttrs.push(`startNum="${rp.startNum}"`);
          if (rp.endNum !== void 0) rpAttrs.push(`endNum="${rp.endNum}"`);
          if (rp.startDate) rpAttrs.push(`startDate="${escapeXml(rp.startDate)}"`);
          if (rp.endDate) rpAttrs.push(`endDate="${escapeXml(rp.endDate)}"`);
          if (rp.groupInterval !== void 0) rpAttrs.push(`groupInterval="${rp.groupInterval}"`);
          fgParts.push(`<rangePr${rpAttrs.length ? " " + rpAttrs.join(" ") : ""}/>`);
        }
        if (fg.discretePr && fg.discretePr.length > 0) {
          fgParts.push(`<discretePr count="${fg.discretePr.length}">`);
          for (const idx of fg.discretePr) fgParts.push(`<x v="${idx}"/>`);
          fgParts.push("</discretePr>");
        }
        if (fg.groupItems && fg.groupItems.length > 0) {
          fgParts.push(`<groupItems count="${fg.groupItems.length}">`);
          for (const gi of fg.groupItems) fgParts.push(`<s v="${escapeXml(gi)}"/>`);
          fgParts.push("</groupItems>");
        }
        fgParts.push("</fieldGroup>");
        p.push(fgParts.join(""));
      }
      p.push("</cacheField>");
    }
  }
  p.push("</cacheFields>");
  if (cacheDefOpts?.mpMaps) for (const mp of cacheDefOpts.mpMaps) p.push(`<mpMap x="${mp.x}"/>`);
  const olapPrXml = cacheDefOpts?.olapPr ? stringifyOlapPr(cacheDefOpts.olapPr) : "";
  if (olapPrXml) p.push(olapPrXml);
  if (cacheDefOpts?.cacheHierarchies && cacheDefOpts.cacheHierarchies.length > 0) {
    const chs = cacheDefOpts.cacheHierarchies;
    p.push(`<cacheHierarchies count="${chs.length}">`);
    for (const ch2 of chs) {
      const chAttrs = [`uniqueName="${escapeXml(ch2.uniqueName)}"`, `count="${ch2.count}"`];
      if (ch2.caption) chAttrs.push(`caption="${escapeXml(ch2.caption)}"`);
      if (ch2.measure) chAttrs.push('measure="1"');
      if (ch2.set) chAttrs.push('set="1"');
      if (ch2.parentSet !== void 0) chAttrs.push(`parentSet="${ch2.parentSet}"`);
      if (ch2.iconSet !== void 0 && ch2.iconSet !== 0) chAttrs.push(`iconSet="${ch2.iconSet}"`);
      if (ch2.attribute) chAttrs.push('attribute="1"');
      if (ch2.time) chAttrs.push('time="1"');
      if (ch2.keyAttribute) chAttrs.push('keyAttribute="1"');
      if (ch2.defaultMemberUniqueName) chAttrs.push(`defaultMemberUniqueName="${escapeXml(ch2.defaultMemberUniqueName)}"`);
      if (ch2.allUniqueName) chAttrs.push(`allUniqueName="${escapeXml(ch2.allUniqueName)}"`);
      if (ch2.allCaption) chAttrs.push(`allCaption="${escapeXml(ch2.allCaption)}"`);
      if (ch2.dimensionUniqueName) chAttrs.push(`dimensionUniqueName="${escapeXml(ch2.dimensionUniqueName)}"`);
      if (ch2.displayFolder) chAttrs.push(`displayFolder="${escapeXml(ch2.displayFolder)}"`);
      if (ch2.measureGroup) chAttrs.push(`measureGroup="${escapeXml(ch2.measureGroup)}"`);
      if (ch2.measures) chAttrs.push('measures="1"');
      if (ch2.oneField) chAttrs.push('oneField="1"');
      if (ch2.hidden) chAttrs.push('hidden="1"');
      if (ch2.memberValueDatatype) chAttrs.push(`memberValueDatatype="${ch2.memberValueDatatype}"`);
      if (ch2.unbalanced) chAttrs.push('unbalanced="1"');
      if (ch2.unbalancedGroup) chAttrs.push('unbalancedGroup="1"');
      const hasGL = ch2.groupLevels && ch2.groupLevels.length > 0;
      const hasFU = ch2.fieldsUsage && ch2.fieldsUsage.length > 0;
      if (hasGL || hasFU) {
        p.push(`<cacheHierarchy ${chAttrs.join(" ")}>`);
        if (hasFU) {
          const fuParts = [`<fieldsUsage count="${ch2.fieldsUsage.length}">`];
          for (const fu of ch2.fieldsUsage) fuParts.push(`<fieldUsage v="${fu.value}"/>`);
          fuParts.push("</fieldsUsage>");
          p.push(fuParts.join(""));
        }
        if (hasGL) {
          const glParts = [`<groupLevels count="${ch2.groupLevels.length}">`];
          for (const gl of ch2.groupLevels) {
            const glAttrs = [`uniqueName="${escapeXml(gl.uniqueName)}"`, `caption="${escapeXml(gl.caption)}"`];
            if (gl.user) glAttrs.push('user="1"');
            if (gl.customRollUp) glAttrs.push('customRollUp="1"');
            if (gl.groups && gl.groups.length > 0) {
              glParts.push(`<groupLevel ${glAttrs.join(" ")}><groups count="${gl.groups.length}">`);
              for (const lg of gl.groups) {
                const lgAttrs = [
                  `name="${escapeXml(lg.name)}"`,
                  `uniqueName="${escapeXml(lg.uniqueName)}"`,
                  `caption="${escapeXml(lg.caption)}"`
                ];
                if (lg.uniqueParent) lgAttrs.push(`uniqueParent="${escapeXml(lg.uniqueParent)}"`);
                if (lg.id !== void 0) lgAttrs.push(`id="${lg.id}"`);
                glParts.push(`<group ${lgAttrs.join(" ")}><groupMembers count="${lg.members.length}">`);
                for (const gm of lg.members) {
                  const gmAttrs = [`uniqueName="${escapeXml(gm.uniqueName)}"`];
                  if (gm.group) gmAttrs.push('group="1"');
                  glParts.push(`<groupMember ${gmAttrs.join(" ")}/>`);
                }
                glParts.push("</groupMembers></group>");
              }
              glParts.push("</groups></groupLevel>");
            } else glParts.push(`<groupLevel ${glAttrs.join(" ")}/>`);
          }
          glParts.push("</groupLevels>");
          p.push(glParts.join(""));
        }
        p.push("</cacheHierarchy>");
      } else p.push(`<cacheHierarchy ${chAttrs.join(" ")}/>`);
    }
    p.push("</cacheHierarchies>");
  }
  if (cacheDefOpts?.kpis && cacheDefOpts.kpis.length > 0) {
    p.push(`<kpis count="${cacheDefOpts.kpis.length}">`);
    for (const k of cacheDefOpts.kpis) {
      const kAttrs = [`uniqueName="${escapeXml(k.uniqueName)}"`, `value="${escapeXml(k.value)}"`];
      if (k.caption) kAttrs.push(`caption="${escapeXml(k.caption)}"`);
      if (k.displayFolder) kAttrs.push(`displayFolder="${escapeXml(k.displayFolder)}"`);
      if (k.measureGroup) kAttrs.push(`measureGroup="${escapeXml(k.measureGroup)}"`);
      if (k.parent) kAttrs.push(`parent="${escapeXml(k.parent)}"`);
      if (k.goal) kAttrs.push(`goal="${escapeXml(k.goal)}"`);
      if (k.status) kAttrs.push(`status="${escapeXml(k.status)}"`);
      if (k.trend) kAttrs.push(`trend="${escapeXml(k.trend)}"`);
      if (k.weight) kAttrs.push(`weight="${escapeXml(k.weight)}"`);
      if (k.time) kAttrs.push(`time="${escapeXml(k.time)}"`);
      p.push(`<kpi ${kAttrs.join(" ")}/>`);
    }
    p.push("</kpis>");
  }
  if (cacheDefOpts?.measureGroups && cacheDefOpts.measureGroups.length > 0) {
    p.push(`<measureGroups count="${cacheDefOpts.measureGroups.length}">`);
    for (const mg of cacheDefOpts.measureGroups) p.push(`<measureGroup name="${escapeXml(mg.name)}" caption="${escapeXml(mg.caption)}"/>`);
    p.push("</measureGroups>");
  }
  if (cacheDefOpts?.measureDimensionMaps && cacheDefOpts.measureDimensionMaps.length > 0) {
    p.push(`<maps count="${cacheDefOpts.measureDimensionMaps.length}">`);
    for (const m of cacheDefOpts.measureDimensionMaps) {
      const mAttrs = [];
      if (m.measureGroup !== void 0) mAttrs.push(`measureGroup="${m.measureGroup}"`);
      if (m.dimension !== void 0) mAttrs.push(`dimension="${m.dimension}"`);
      p.push(`<map ${mAttrs.join(" ")}/>`);
    }
    p.push("</maps>");
  }
  if (cacheDefOpts?.dimensions && cacheDefOpts.dimensions.length > 0) {
    p.push(`<dimensions count="${cacheDefOpts.dimensions.length}">`);
    for (const d of cacheDefOpts.dimensions) {
      const dAttrs = [
        `name="${escapeXml(d.name)}"`,
        `uniqueName="${escapeXml(d.uniqueName)}"`,
        `caption="${escapeXml(d.caption)}"`
      ];
      if (d.measure) dAttrs.push('measure="1"');
      p.push(`<dimension ${dAttrs.join(" ")}/>`);
    }
    p.push("</dimensions>");
  }
  const cd = cacheDefOpts;
  const hasEntries = cd?.entries && cd.entries.length > 0;
  const hasSets = cd?.sets && cd.sets.length > 0;
  const hasSF = cd?.serverFormats && cd.serverFormats.length > 0;
  const hasQC = cd?.queryCache && cd.queryCache.length > 0;
  if (hasEntries || hasSets || hasSF || hasQC) {
    p.push("<tupleCache>");
    if (hasEntries) {
      const entParts = [`<entries count="${cd.entries.length}">`];
      for (const ent of cd.entries) {
        const olapAttrs = (ent.captionIndex !== void 0 ? ` cp="${ent.captionIndex}"` : "") + (ent.propertyIndex !== void 0 ? ` in="${ent.propertyIndex}"` : "") + (ent.underline ? ' un="1"' : "");
        if (ent.type === "m") entParts.push(`<m${olapAttrs}/>`);
        else if (ent.type === "e") entParts.push(`<e v="${escapeXml(String(ent.value ?? ""))}"${olapAttrs}/>`);
        else if (ent.value !== void 0) entParts.push(`<${ent.type} v="${ent.value}"${olapAttrs}/>`);
      }
      entParts.push("</entries>");
      p.push(entParts.join(""));
    }
    if (hasSets) {
      p.push(`<sets count="${cd.sets.length}">`);
      for (const s of cd.sets) {
        const sAttrs = [`maxRank="${s.maxRank}"`, `setDefinition="${escapeXml(s.setDefinition)}"`];
        if (s.count !== void 0) sAttrs.push(`count="${s.count}"`);
        if (s.sortType && s.sortType !== "none") sAttrs.push(`sortType="${s.sortType}"`);
        if (s.queryFailed) sAttrs.push('queryFailed="1"');
        const tplsXml = (tpls) => tpls && tpls.length > 0 ? `<tpls count="${tpls.length}">${tpls.map((tpl) => tpl.items && tpl.items.length > 0 ? `<tpl>${tpl.items.map((x) => `<x v="${x}"/>`).join("")}</tpl>` : "<tpl/>").join("")}</tpls>` : "";
        const sortByXml = s.sortByTuple && s.sortByTuple.length > 0 ? `<sortByTuple>${s.sortByTuple.map((tpl) => tpl.items && tpl.items.length > 0 ? `<tpl>${tpl.items.map((x) => `<x v="${x}"/>`).join("")}</tpl>` : "<tpl/>").join("")}</sortByTuple>` : "";
        const inner = tplsXml(s.tpls) + sortByXml;
        if (inner) p.push(`<set ${sAttrs.join(" ")}>${inner}</set>`);
        else p.push(`<set ${sAttrs.join(" ")}/>`);
      }
      p.push("</sets>");
    }
    if (hasSF) {
      p.push(`<serverFormats count="${cd.serverFormats.length}">`);
      for (const sf of cd.serverFormats) {
        const sfAttrs = [];
        if (sf.culture) sfAttrs.push(`culture="${escapeXml(sf.culture)}"`);
        if (sf.format) sfAttrs.push(`format="${escapeXml(sf.format)}"`);
        p.push(`<serverFormat ${sfAttrs.join(" ")}/>`);
      }
      p.push("</serverFormats>");
    }
    if (hasQC) {
      p.push(`<queryCache count="${cd.queryCache.length}">`);
      for (const q of cd.queryCache) {
        const qInner = q.tpls && q.tpls.length > 0 ? `<tpls count="${q.tpls.length}">${q.tpls.map((tpl) => tpl.items && tpl.items.length > 0 ? `<tpl>${tpl.items.map((x) => `<x v="${x}"/>`).join("")}</tpl>` : "<tpl/>").join("")}</tpls>` : "";
        if (qInner) p.push(`<query mdx="${escapeXml(q.mdx)}">${qInner}</query>`);
        else p.push(`<query mdx="${escapeXml(q.mdx)}"/>`);
      }
      p.push("</queryCache>");
    }
    p.push("</tupleCache>");
  }
  p.push("</pivotCacheDefinition>");
  return p.join("");
}
function stringifyPivotCacheRecords(sourceData) {
  const numericFields = sourceData.fieldNames.map((_, i) => isNumericField(sourceData.records, i));
  const fieldIndexMaps = sourceData.fieldNames.map((_, i) => {
    if (numericFields[i]) return /* @__PURE__ */ new Map();
    const unique = collectUniqueValues(sourceData.records, i);
    const map = /* @__PURE__ */ new Map();
    for (let j = 0; j < unique.length; j++) map.set(String(unique[j]), j);
    return map;
  });
  const p = [];
  p.push(`<pivotCacheRecords xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sourceData.records.length}">`);
  for (const row of sourceData.records) {
    p.push("<r>");
    for (let i = 0; i < row.length; i++) {
      const val = row[i];
      if (val === null) p.push("<m/>");
      else if (val instanceof Date) p.push(`<d v="${val.toISOString().replace(/\.\d{3}Z$/, "Z")}"/>`);
      else if (numericFields[i]) p.push(`<n v="${val}"/>`);
      else p.push(`<x v="${fieldIndexMaps[i]?.get(String(val)) ?? 0}"/>`);
    }
    p.push("</r>");
  }
  p.push("</pivotCacheRecords>");
  return p.join("");
}
var TotalsRowFunction = {
  NONE: "none",
  SUM: "sum",
  MIN: "min",
  MAX: "max",
  AVERAGE: "average",
  COUNT: "count",
  COUNT_NUMS: "countNumbers",
  STD_DEV: "standardDeviation",
  VAR: "variance",
  CUSTOM: "custom"
};
var tableDesc = {
  kind: "custom",
  stringify(o, _ctx) {
    const p = [];
    const rootAttrs = {
      id: o.id,
      name: o.name ?? o.displayName,
      displayName: o.displayName,
      ref: o.ref
    };
    if (o.comment) rootAttrs.comment = o.comment;
    if (o.tableType && o.tableType !== "worksheet") rootAttrs.tableType = o.tableType;
    if (o.headerRowCount !== void 0 && o.headerRowCount !== 1) rootAttrs.headerRowCount = o.headerRowCount;
    if (o.insertRow) rootAttrs.insertRow = 1;
    if (o.totalsRowCount !== void 0 && o.totalsRowCount > 0) rootAttrs.totalsRowCount = o.totalsRowCount;
    if (o.totalsRowShown === false) rootAttrs.totalsRowShown = 0;
    if (o.insertRowShift) rootAttrs.insertRowShift = 1;
    if (o.published) rootAttrs.published = 1;
    if (o.connectionId !== void 0) rootAttrs.connectionId = o.connectionId;
    if (o.headerRowDxfId !== void 0) rootAttrs.headerRowDxfId = o.headerRowDxfId;
    if (o.dataDxfId !== void 0) rootAttrs.dataDxfId = o.dataDxfId;
    if (o.totalsRowDxfId !== void 0) rootAttrs.totalsRowDxfId = o.totalsRowDxfId;
    if (o.headerRowBorderDxfId !== void 0) rootAttrs.headerRowBorderDxfId = o.headerRowBorderDxfId;
    if (o.tableBorderDxfId !== void 0) rootAttrs.tableBorderDxfId = o.tableBorderDxfId;
    if (o.totalsRowBorderDxfId !== void 0) rootAttrs.totalsRowBorderDxfId = o.totalsRowBorderDxfId;
    if (o.headerRowCellStyle) rootAttrs.headerRowCellStyle = o.headerRowCellStyle;
    if (o.dataCellStyle) rootAttrs.dataCellStyle = o.dataCellStyle;
    if (o.totalsRowCellStyle) rootAttrs.totalsRowCellStyle = o.totalsRowCellStyle;
    p.push(`<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="xr xr2" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision" xmlns:xr2="http://schemas.microsoft.com/office/spreadsheetml/2015/revision2"${attrs(rootAttrs)}>`);
    if (o.autoFilter !== void 0) p.push(stringifyAutoFilter(o.autoFilter));
    p.push(`<tableColumns count="${o.columns.length}">`);
    for (const [i, col] of o.columns.entries()) {
      const colAttrs = {
        id: i + 1,
        name: col.name
      };
      const inner = [];
      if (col.calculatedColumnFormula !== void 0) {
        const fAttrs = col.calculatedColumnFormulaArray ? ' array="1"' : "";
        inner.push(`<calculatedColumnFormula${fAttrs}>${escapeXml(col.calculatedColumnFormula)}</calculatedColumnFormula>`);
      }
      if (col.totalsRowFormula !== void 0) {
        const fAttrs = col.totalsRowFormulaArray ? ' array="1"' : "";
        inner.push(`<totalsRowFormula${fAttrs}>${escapeXml(col.totalsRowFormula)}</totalsRowFormula>`);
      }
      if (col.totalsRowFunction !== void 0 && col.totalsRowFunction !== TotalsRowFunction.NONE) colAttrs.totalsRowFunction = xsdTotalsRowFunction.to(col.totalsRowFunction);
      if (col.totalsRowLabel !== void 0) colAttrs.totalsRowLabel = col.totalsRowLabel;
      if (col.uniqueName) colAttrs.uniqueName = col.uniqueName;
      if (col.queryTableFieldId !== void 0) colAttrs.queryTableFieldId = col.queryTableFieldId;
      if (col.headerRowDxfId !== void 0) colAttrs.headerRowDxfId = col.headerRowDxfId;
      if (col.dataDxfId !== void 0) colAttrs.dataDxfId = col.dataDxfId;
      if (col.totalsRowDxfId !== void 0) colAttrs.totalsRowDxfId = col.totalsRowDxfId;
      if (col.headerRowCellStyle) colAttrs.headerRowCellStyle = col.headerRowCellStyle;
      if (col.dataCellStyle) colAttrs.dataCellStyle = col.dataCellStyle;
      if (col.totalsRowCellStyle) colAttrs.totalsRowCellStyle = col.totalsRowCellStyle;
      if (col.xmlColumnPr && typeof col.xmlColumnPr.mapId === "number") {
        const xp = col.xmlColumnPr;
        const xpAttrs = [`mapId="${xp.mapId}"`, `xpath="${escapeXml(xp.xpath)}"`];
        if (xp.denormalized) xpAttrs.push('denormalized="1"');
        xpAttrs.push(`xmlDataType="${escapeXml(xp.xmlDataType)}"`);
        inner.push(`<xmlColumnPr ${xpAttrs.join(" ")}/>`);
      }
      if (inner.length > 0) p.push(`<tableColumn${attrs(colAttrs)}>${inner.join("")}</tableColumn>`);
      else p.push(`<tableColumn${attrs(colAttrs)}/>`);
    }
    p.push("</tableColumns>");
    if (o.style) {
      const s = o.style;
      const styleAttrs = {};
      if (s.name !== void 0) styleAttrs.name = s.name;
      if (s.showFirstColumn !== void 0) styleAttrs.showFirstColumn = s.showFirstColumn ? 1 : 0;
      if (s.showLastColumn !== void 0) styleAttrs.showLastColumn = s.showLastColumn ? 1 : 0;
      if (s.showRowStripes !== void 0) styleAttrs.showRowStripes = s.showRowStripes ? 1 : 0;
      if (s.showColumnStripes !== void 0) styleAttrs.showColumnStripes = s.showColumnStripes ? 1 : 0;
      p.push(`<tableStyleInfo${attrs(styleAttrs)}/>`);
    }
    if (o.ext) p.push(`<extLst>${o.ext}</extLst>`);
    else if (o.altText !== void 0 || o.altTextSummary !== void 0) {
      const a = [];
      if (o.altText !== void 0) a.push(` altText="${escapeXml(o.altText)}"`);
      if (o.altTextSummary !== void 0) a.push(` altTextSummary="${escapeXml(o.altTextSummary)}"`);
      p.push(`<extLst><ext uri="{504A1905-F514-4f6f-8877-14C23A59335A}" xmlns:x14="http://schemas.microsoft.com/office/spreadsheetml/2009/9/main"><x14:table${a.join("")}/></ext></extLst>`);
    }
    p.push("</table>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const id = attrNum(el, "id");
    if (id !== void 0) result.id = id;
    if (attr(el, "name")) result.name = attr(el, "name");
    if (attr(el, "displayName")) result.displayName = attr(el, "displayName");
    if (attr(el, "comment")) result.comment = attr(el, "comment");
    if (attr(el, "ref")) result.ref = attr(el, "ref");
    const headerRowCount = attrNum(el, "headerRowCount");
    if (headerRowCount !== void 0) result.headerRowCount = headerRowCount;
    if (parseOnOff(attr(el, "insertRow"))) result.insertRow = true;
    const totalsRowCount = attrNum(el, "totalsRowCount");
    if (totalsRowCount !== void 0) result.totalsRowCount = totalsRowCount;
    if (String(attr(el, "totalsRowShown")) === "0") result.totalsRowShown = false;
    if (attr(el, "tableType")) result.tableType = attr(el, "tableType");
    if (parseOnOff(attr(el, "insertRowShift"))) result.insertRowShift = true;
    if (parseOnOff(attr(el, "published"))) result.published = true;
    const connectionId = attrNum(el, "connectionId");
    if (connectionId !== void 0) result.connectionId = connectionId;
    const afEl = findChild(el, "autoFilter");
    if (afEl) result.autoFilter = parseAutoFilter(afEl);
    const colsEl = findChild(el, "tableColumns");
    if (colsEl) {
      const columns = [];
      for (const colEl of colsEl.elements ?? []) {
        if (colEl.name !== "tableColumn") continue;
        const col = {};
        col.name = attr(colEl, "name") ?? "";
        if (attr(colEl, "totalsRowFunction")) col.totalsRowFunction = xsdTotalsRowFunction.from(attr(colEl, "totalsRowFunction") ?? "");
        if (attr(colEl, "totalsRowLabel")) col.totalsRowLabel = attr(colEl, "totalsRowLabel");
        const ccfEl = findChild(colEl, "calculatedColumnFormula");
        if (ccfEl) {
          col.calculatedColumnFormula = textOf(ccfEl);
          if (parseOnOff(attr(ccfEl, "array"))) col.calculatedColumnFormulaArray = true;
        }
        const trfEl = findChild(colEl, "totalsRowFormula");
        if (trfEl) {
          col.totalsRowFormula = textOf(trfEl);
          if (parseOnOff(attr(trfEl, "array"))) col.totalsRowFormulaArray = true;
        }
        if (attr(colEl, "uniqueName")) col.uniqueName = attr(colEl, "uniqueName");
        const qtfId = attrNum(colEl, "queryTableFieldId");
        if (qtfId !== void 0) col.queryTableFieldId = qtfId;
        const hrDxfId2 = attrNum(colEl, "headerRowDxfId");
        if (hrDxfId2 !== void 0) col.headerRowDxfId = hrDxfId2;
        const dDxfId2 = attrNum(colEl, "dataDxfId");
        if (dDxfId2 !== void 0) col.dataDxfId = dDxfId2;
        const trDxfId2 = attrNum(colEl, "totalsRowDxfId");
        if (trDxfId2 !== void 0) col.totalsRowDxfId = trDxfId2;
        if (attr(colEl, "headerRowCellStyle")) col.headerRowCellStyle = attr(colEl, "headerRowCellStyle");
        if (attr(colEl, "dataCellStyle")) col.dataCellStyle = attr(colEl, "dataCellStyle");
        if (attr(colEl, "totalsRowCellStyle")) col.totalsRowCellStyle = attr(colEl, "totalsRowCellStyle");
        const xcpEl = findChild(colEl, "xmlColumnPr");
        if (xcpEl) {
          col.xmlColumnPr = {
            mapId: attrNum(xcpEl, "mapId") ?? 0,
            xpath: attr(xcpEl, "xpath") ?? "",
            xmlDataType: attr(xcpEl, "xmlDataType") ?? ""
          };
          if (parseOnOff(attr(xcpEl, "denormalized"))) col.xmlColumnPr.denormalized = true;
        }
        columns.push(col);
      }
      result.columns = columns;
    }
    const siEl = findChild(el, "tableStyleInfo");
    if (siEl) {
      const style = {};
      if (attr(siEl, "name")) style.name = attr(siEl, "name");
      const firstColumn = parseOnOff(attr(siEl, "showFirstColumn"));
      if (firstColumn !== void 0) style.showFirstColumn = firstColumn;
      const lastColumn = parseOnOff(attr(siEl, "showLastColumn"));
      if (lastColumn !== void 0) style.showLastColumn = lastColumn;
      const rowStripes = parseOnOff(attr(siEl, "showRowStripes"));
      if (rowStripes !== void 0) style.showRowStripes = rowStripes;
      const columnStripes = parseOnOff(attr(siEl, "showColumnStripes"));
      if (columnStripes !== void 0) style.showColumnStripes = columnStripes;
      result.style = style;
    }
    const extLstEl = findChild(el, "extLst");
    if (extLstEl) {
      result.ext = (extLstEl.elements ?? []).map((e) => stringifyElement(e)).join("");
      for (const ext of extLstEl.elements ?? []) for (const child of ext.elements ?? []) {
        if (child.name !== "x14:table") continue;
        const altText = attr(child, "altText");
        if (altText !== void 0) result.altText = altText;
        const altTextSummary = attr(child, "altTextSummary");
        if (altTextSummary !== void 0) result.altTextSummary = altTextSummary;
      }
    }
    const hrDxfId = attrNum(el, "headerRowDxfId");
    if (hrDxfId !== void 0) result.headerRowDxfId = hrDxfId;
    const dDxfId = attrNum(el, "dataDxfId");
    if (dDxfId !== void 0) result.dataDxfId = dDxfId;
    const trDxfId = attrNum(el, "totalsRowDxfId");
    if (trDxfId !== void 0) result.totalsRowDxfId = trDxfId;
    const hrbDxfId = attrNum(el, "headerRowBorderDxfId");
    if (hrbDxfId !== void 0) result.headerRowBorderDxfId = hrbDxfId;
    const tbDxfId = attrNum(el, "tableBorderDxfId");
    if (tbDxfId !== void 0) result.tableBorderDxfId = tbDxfId;
    const trbDxfId = attrNum(el, "totalsRowBorderDxfId");
    if (trbDxfId !== void 0) result.totalsRowBorderDxfId = trbDxfId;
    if (attr(el, "headerRowCellStyle")) result.headerRowCellStyle = attr(el, "headerRowCellStyle");
    if (attr(el, "dataCellStyle")) result.dataCellStyle = attr(el, "dataCellStyle");
    if (attr(el, "totalsRowCellStyle")) result.totalsRowCellStyle = attr(el, "totalsRowCellStyle");
    return result;
  }
};
function stringifyWorkbook(opts) {
  const parts = [`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x15 xr xr6 xr10 xr2" xmlns:x15="http://schemas.microsoft.com/office/spreadsheetml/2010/11/main" xmlns:xr="http://schemas.microsoft.com/office/spreadsheetml/2014/revision" xmlns:xr6="http://schemas.microsoft.com/office/spreadsheetml/2016/revision6" xmlns:xr10="http://schemas.microsoft.com/office/spreadsheetml/2016/revision10" xmlns:xr2="http://schemas.microsoft.com/office/spreadsheetml/2015/revision2"${opts.conformance ? ` conformance="${opts.conformance}"` : ""}>`];
  const fv = opts.fileVersion;
  if (fv) {
    const fvAttrs = [];
    if (fv.appName) fvAttrs.push(`appName="${fv.appName}"`);
    if (fv.lastEdited !== void 0) fvAttrs.push(`lastEdited="${fv.lastEdited}"`);
    if (fv.lowestEdited !== void 0) fvAttrs.push(`lowestEdited="${fv.lowestEdited}"`);
    if (fv.rupBuild !== void 0) fvAttrs.push(`rupBuild="${fv.rupBuild}"`);
    parts.push(`<fileVersion ${fvAttrs.join(" ")}/>`);
  } else parts.push('<fileVersion appName="xl" lastEdited="7" lowestEdited="6" rupBuild="29929"/>');
  if (opts.fileSharing) {
    const fs = opts.fileSharing;
    const fsAttrs = [];
    if (fs.readOnlyRecommended) fsAttrs.push('readOnlyRecommended="1"');
    if (fs.userName) fsAttrs.push(`userName="${escapeXml(fs.userName)}"`);
    if (fs.reservationPassword) {
      fsAttrs.push(`reservationPassword="${escapeXml(fs.reservationPassword)}"`);
      if (fs.hashValue === void 0) {
        const derived = derivePasswordHash(fs.reservationPassword);
        fsAttrs.push(`algorithmName="${escapeXml(derived.algorithmName)}"`);
        fsAttrs.push(`hashValue="${escapeXml(derived.hashValue)}"`);
        fsAttrs.push(`saltValue="${escapeXml(derived.saltValue)}"`);
        fsAttrs.push(`spinCount="${derived.spinCount}"`);
      }
    }
    if (fs.algorithmName) fsAttrs.push(`algorithmName="${escapeXml(fs.algorithmName)}"`);
    if (fs.hashValue) fsAttrs.push(`hashValue="${escapeXml(fs.hashValue)}"`);
    if (fs.saltValue) fsAttrs.push(`saltValue="${escapeXml(fs.saltValue)}"`);
    if (fs.spinCount !== void 0) fsAttrs.push(`spinCount="${fs.spinCount}"`);
    if (fsAttrs.length > 0) parts.push(`<fileSharing ${fsAttrs.join(" ")}/>`);
  }
  if (opts.workbookPr) {
    const wbPr = opts.workbookPr;
    const wbPrAttrs = [];
    if (wbPr.date1904) wbPrAttrs.push('date1904="1"');
    if (wbPr.defaultThemeVersion !== void 0) wbPrAttrs.push(`defaultThemeVersion="${wbPr.defaultThemeVersion}"`);
    if (wbPr.showObjects) wbPrAttrs.push(`showObjects="${escapeXml(wbPr.showObjects)}"`);
    if (wbPr.hidePivotFieldList) wbPrAttrs.push('hidePivotFieldList="1"');
    if (wbPr.allowRefreshQuery) wbPrAttrs.push('allowRefreshQuery="1"');
    if (wbPr.filterPrivacy) wbPrAttrs.push('filterPrivacy="1"');
    if (wbPr.backupFile) wbPrAttrs.push('backupFile="1"');
    if (wbPr.codeName) wbPrAttrs.push(`codeName="${escapeXml(wbPr.codeName)}"`);
    if (wbPr.showBorderUnselectedTables) wbPrAttrs.push('showBorderUnselectedTables="1"');
    if (wbPr.promptedSolutions) wbPrAttrs.push('promptedSolutions="1"');
    if (wbPr.showInkAnnotation === false) wbPrAttrs.push('showInkAnnotation="0"');
    if (wbPr.saveExternalLinkValues === false) wbPrAttrs.push('saveExternalLinkValues="0"');
    if (wbPr.updateLinks) wbPrAttrs.push(`updateLinks="${escapeXml(wbPr.updateLinks)}"`);
    if (wbPr.showPivotChartFilter) wbPrAttrs.push('showPivotChartFilter="1"');
    if (wbPr.publishItems) wbPrAttrs.push('publishItems="1"');
    if (wbPr.checkCompatibility) wbPrAttrs.push('checkCompatibility="1"');
    if (wbPr.autoCompressPictures === false) wbPrAttrs.push('autoCompressPictures="0"');
    if (wbPr.refreshAllConnections) wbPrAttrs.push('refreshAllConnections="1"');
    parts.push(`<workbookPr${wbPrAttrs.length > 0 ? ` ${wbPrAttrs.join(" ")}` : ""}/>`);
  } else parts.push("<workbookPr/>");
  if (opts.absPath !== void 0) parts.push(`<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice Requires="x15"><x15ac:absPath url="${escapeXml(opts.absPath)}" xmlns:x15ac="http://schemas.microsoft.com/office/spreadsheetml/2010/11/ac"/></mc:Choice></mc:AlternateContent>`);
  if (opts.revisionPtr) {
    const rp = opts.revisionPtr;
    const rpAttrs = [];
    if (rp.revisionIdLastSave !== void 0) rpAttrs.push(`revIDLastSave="${rp.revisionIdLastSave}"`);
    if (rp.documentId !== void 0) rpAttrs.push(`documentId="${escapeXml(rp.documentId)}"`);
    if (rp.coauthVersionLast !== void 0) rpAttrs.push(`xr6:coauthVersionLast="${rp.coauthVersionLast}"`);
    if (rp.coauthVersionMax !== void 0) rpAttrs.push(`xr6:coauthVersionMax="${rp.coauthVersionMax}"`);
    if (rp.uidLastSave !== void 0) rpAttrs.push(`xr10:uidLastSave="${escapeXml(rp.uidLastSave)}"`);
    parts.push(`<xr:revisionPtr ${rpAttrs.join(" ")}/>`);
  }
  if (opts.protection) {
    const prot = opts.protection;
    const protAttrs = [];
    if (prot.lockStructure) protAttrs.push('lockStructure="1"');
    if (prot.lockWindows) protAttrs.push('lockWindows="1"');
    if (prot.lockRevision) protAttrs.push('lockRevision="1"');
    if (prot.workbookPassword) {
      protAttrs.push(`workbookPassword="${hashPassword(prot.workbookPassword)}"`);
      if (prot.workbookHashValue === void 0) {
        const wbDerived = derivePasswordHash(prot.workbookPassword);
        protAttrs.push(`workbookAlgorithmName="${escapeXml(wbDerived.algorithmName)}"`);
        protAttrs.push(`workbookHashValue="${escapeXml(wbDerived.hashValue)}"`);
        protAttrs.push(`workbookSaltValue="${escapeXml(wbDerived.saltValue)}"`);
        protAttrs.push(`workbookSpinCount="${wbDerived.spinCount}"`);
      }
    }
    if (prot.workbookAlgorithmName) protAttrs.push(`workbookAlgorithmName="${escapeXml(prot.workbookAlgorithmName)}"`);
    if (prot.workbookHashValue) protAttrs.push(`workbookHashValue="${escapeXml(prot.workbookHashValue)}"`);
    if (prot.workbookSaltValue) protAttrs.push(`workbookSaltValue="${escapeXml(prot.workbookSaltValue)}"`);
    if (prot.workbookSpinCount !== void 0) protAttrs.push(`workbookSpinCount="${prot.workbookSpinCount}"`);
    if (prot.revisionsPassword) {
      protAttrs.push(`revisionsPassword="${hashPassword(prot.revisionsPassword)}"`);
      if (prot.revisionsHashValue === void 0) {
        const revDerived = derivePasswordHash(prot.revisionsPassword);
        protAttrs.push(`revisionsAlgorithmName="${escapeXml(revDerived.algorithmName)}"`);
        protAttrs.push(`revisionsHashValue="${escapeXml(revDerived.hashValue)}"`);
        protAttrs.push(`revisionsSaltValue="${escapeXml(revDerived.saltValue)}"`);
        protAttrs.push(`revisionsSpinCount="${revDerived.spinCount}"`);
      }
    }
    if (prot.revisionsAlgorithmName) protAttrs.push(`revisionsAlgorithmName="${escapeXml(prot.revisionsAlgorithmName)}"`);
    if (prot.revisionsHashValue) protAttrs.push(`revisionsHashValue="${escapeXml(prot.revisionsHashValue)}"`);
    if (prot.revisionsSaltValue) protAttrs.push(`revisionsSaltValue="${escapeXml(prot.revisionsSaltValue)}"`);
    if (prot.revisionsSpinCount !== void 0) protAttrs.push(`revisionsSpinCount="${prot.revisionsSpinCount}"`);
    if (prot.workbookPasswordCharacterSet) protAttrs.push(`workbookPasswordCharacterSet="${escapeXml(prot.workbookPasswordCharacterSet)}"`);
    if (prot.revisionsPasswordCharacterSet) protAttrs.push(`revisionsPasswordCharacterSet="${escapeXml(prot.revisionsPasswordCharacterSet)}"`);
    if (protAttrs.length > 0) parts.push(`<workbookProtection ${protAttrs.join(" ")}/>`);
  }
  if (opts.bookView) {
    const bv = opts.bookView;
    const bvAttrs = [];
    if (bv.xWindow !== void 0) bvAttrs.push(`xWindow="${bv.xWindow}"`);
    else bvAttrs.push('xWindow="0"');
    if (bv.yWindow !== void 0) bvAttrs.push(`yWindow="${bv.yWindow}"`);
    else bvAttrs.push('yWindow="0"');
    if (bv.windowWidth !== void 0) bvAttrs.push(`windowWidth="${bv.windowWidth}"`);
    else bvAttrs.push('windowWidth="28800"');
    if (bv.windowHeight !== void 0) bvAttrs.push(`windowHeight="${bv.windowHeight}"`);
    else bvAttrs.push('windowHeight="12300"');
    if (bv.activeTab !== void 0) bvAttrs.push(`activeTab="${bv.activeTab}"`);
    if (bv.autoFilterDateGrouping === false) bvAttrs.push('autoFilterDateGrouping="0"');
    if (bv.firstSheet !== void 0) bvAttrs.push(`firstSheet="${bv.firstSheet}"`);
    if (bv.showHorizontalScroll === false) bvAttrs.push('showHorizontalScroll="0"');
    if (bv.showSheetTabs === false) bvAttrs.push('showSheetTabs="0"');
    if (bv.showVerticalScroll === false) bvAttrs.push('showVerticalScroll="0"');
    if (bv.tabRatio !== void 0) bvAttrs.push(`tabRatio="${bv.tabRatio}"`);
    if (bv.visibility && bv.visibility !== "visible") bvAttrs.push(`visibility="${bv.visibility}"`);
    parts.push(`<bookViews><workbookView ${bvAttrs.join(" ")}/></bookViews>`);
  } else parts.push('<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="12300"/></bookViews>');
  parts.push("<sheets>");
  for (const s of opts.sheets) {
    const stateAttr = s.state && s.state !== "visible" ? ` state="${s.state}"` : "";
    parts.push(`<sheet name="${escapeXml(s.name)}" sheetId="${s.sheetId}" r:id="${s.rId}"${stateAttr}/>`);
  }
  parts.push("</sheets>");
  const functionGroups = opts.functionGroups ?? [];
  if (functionGroups.length > 0) {
    const fgParts = [`<functionGroups builtInGroupCount="16">`];
    for (const name of functionGroups) fgParts.push(`<functionGroup name="${escapeXml(name)}"/>`);
    fgParts.push("</functionGroups>");
    parts.push(fgParts.join(""));
  }
  parts.push("<!--EXTERNAL_REFS-->");
  if (opts.definedNames && opts.definedNames.length > 0) {
    const dnParts = ["<definedNames>"];
    for (const dn of opts.definedNames) {
      const dnAttrs = [`name="${escapeXml(dn.name)}"`];
      if (dn.comment !== void 0) dnAttrs.push(`comment="${escapeXml(dn.comment)}"`);
      if (dn.customMenu !== void 0) dnAttrs.push(`customMenu="${escapeXml(dn.customMenu)}"`);
      if (dn.description !== void 0) dnAttrs.push(`description="${escapeXml(dn.description)}"`);
      if (dn.help !== void 0) dnAttrs.push(`help="${escapeXml(dn.help)}"`);
      if (dn.statusBar !== void 0) dnAttrs.push(`statusBar="${escapeXml(dn.statusBar)}"`);
      if (dn.localSheetId !== void 0) dnAttrs.push(`localSheetId="${dn.localSheetId}"`);
      if (dn.hidden) dnAttrs.push('hidden="1"');
      if (dn.function) dnAttrs.push('function="1"');
      if (dn.vbProcedure) dnAttrs.push('vbProcedure="1"');
      if (dn.xlm) dnAttrs.push('xlm="1"');
      if (dn.functionGroupId !== void 0) dnAttrs.push(`functionGroupId="${dn.functionGroupId}"`);
      if (dn.shortcutKey !== void 0) dnAttrs.push(`shortcutKey="${escapeXml(dn.shortcutKey)}"`);
      if (dn.publishToServer) dnAttrs.push('publishToServer="1"');
      if (dn.workbookParameter) dnAttrs.push('workbookParameter="1"');
      dnParts.push(`<definedName ${dnAttrs.join(" ")}>${escapeXml(dn.value)}</definedName>`);
    }
    dnParts.push("</definedNames>");
    parts.push(dnParts.join(""));
  }
  if (opts.calcPr) {
    const cp = opts.calcPr;
    const cpAttrs = [];
    cpAttrs.push(`calcId="${cp.calcId ?? 191029}"`);
    if (cp.calcMode) cpAttrs.push(`calcMode="${escapeXml(cp.calcMode)}"`);
    if (cp.fullCalcOnLoad) cpAttrs.push('fullCalcOnLoad="1"');
    if (cp.calcOnSave === false) cpAttrs.push('calcOnSave="0"');
    if (cp.forceFullCalc) cpAttrs.push('forceFullCalc="1"');
    if (cp.concurrentCalc === false) cpAttrs.push('concurrentCalc="0"');
    if (cp.concurrentManualCount !== void 0) cpAttrs.push(`concurrentManualCount="${cp.concurrentManualCount}"`);
    if (cp.iterate) cpAttrs.push('iterate="1"');
    if (cp.iterateCount !== void 0) cpAttrs.push(`iterateCount="${cp.iterateCount}"`);
    if (cp.iterateDelta !== void 0) cpAttrs.push(`iterateDelta="${cp.iterateDelta}"`);
    if (cp.refMode) cpAttrs.push(`refMode="${escapeXml(cp.refMode)}"`);
    if (cp.fullPrecision === false) cpAttrs.push('fullPrecision="0"');
    if (cp.calcCompleted) cpAttrs.push('calcCompleted="1"');
    parts.push(`<calcPr ${cpAttrs.join(" ")}/>`);
  } else parts.push('<calcPr calcId="191029" fullCalcOnLoad="1"/>');
  if (opts.oleSize) parts.push(`<oleSize ref="${escapeXml(opts.oleSize)}"/>`);
  if (opts.customViews && opts.customViews.length > 0) {
    parts.push("<customWorkbookViews>");
    for (const v of opts.customViews) {
      const vAttrs = [
        `name="${escapeXml(v.name)}"`,
        `guid="${escapeXml(v.guid)}"`,
        `windowWidth="${v.windowWidth}"`,
        `windowHeight="${v.windowHeight}"`,
        `activeSheetId="${v.activeSheetId}"`
      ];
      if (v.xWindow !== void 0) vAttrs.push(`xWindow="${v.xWindow}"`);
      if (v.yWindow !== void 0) vAttrs.push(`yWindow="${v.yWindow}"`);
      if (v.showFormulaBar === false) vAttrs.push('showFormulaBar="0"');
      if (v.showStatusbar === false) vAttrs.push('showStatusbar="0"');
      if (v.showHorizontalScroll === false) vAttrs.push('showHorizontalScroll="0"');
      if (v.showVerticalScroll === false) vAttrs.push('showVerticalScroll="0"');
      if (v.showSheetTabs === false) vAttrs.push('showSheetTabs="0"');
      if (v.tabRatio !== void 0) vAttrs.push(`tabRatio="${v.tabRatio}"`);
      if (v.showObjects) vAttrs.push(`showObjects="${v.showObjects}"`);
      if (v.includeHiddenRowCol === false) vAttrs.push('includeHiddenRowCol="0"');
      if (v.includePrintSettings === false) vAttrs.push('includePrintSettings="0"');
      if (v.personalView) vAttrs.push('personalView="1"');
      if (v.maximized) vAttrs.push('maximized="1"');
      if (v.minimized) vAttrs.push('minimized="1"');
      if (v.autoUpdate) vAttrs.push('autoUpdate="1"');
      if (v.mergeInterval !== void 0) vAttrs.push(`mergeInterval="${v.mergeInterval}"`);
      if (v.changesSavedWin) vAttrs.push('changesSavedWin="1"');
      if (v.onlySync) vAttrs.push('onlySync="1"');
      if (v.showComments) vAttrs.push(`showComments="${xsdComments.to(v.showComments)}"`);
      parts.push(`<customWorkbookView ${vAttrs.join(" ")}/>`);
    }
    parts.push("</customWorkbookViews>");
  }
  const pivotCaches = opts.pivotCaches ?? [];
  if (pivotCaches.length > 0) {
    parts.push("<pivotCaches>");
    for (const pc of pivotCaches) parts.push(`<pivotCache cacheId="${pc.cacheId}" r:id="${pc.rId}"/>`);
    parts.push("</pivotCaches>");
  }
  if (opts.smartTagPr) {
    const stp = opts.smartTagPr;
    const stpAttrs = [];
    if (stp.embed) stpAttrs.push('embed="1"');
    if (stp.show && stp.show !== "all") stpAttrs.push(`show="${stp.show}"`);
    if (stpAttrs.length > 0) parts.push(`<smartTagPr ${stpAttrs.join(" ")}/>`);
  }
  if (opts.smartTagTypes && opts.smartTagTypes.length > 0) {
    const sttParts = ["<smartTagTypes>"];
    for (const stt of opts.smartTagTypes) {
      const sttAttrs = [];
      if (stt.namespaceUri) sttAttrs.push(`namespaceUri="${escapeXml(stt.namespaceUri)}"`);
      if (stt.name) sttAttrs.push(`name="${escapeXml(stt.name)}"`);
      if (stt.url) sttAttrs.push(`url="${escapeXml(stt.url)}"`);
      sttParts.push(`<smartTagType ${sttAttrs.join(" ")}/>`);
    }
    sttParts.push("</smartTagTypes>");
    parts.push(sttParts.join(""));
  }
  if (opts.webPublishing) {
    const wp = opts.webPublishing;
    const wpAttrs = [];
    if (wp.css === false) wpAttrs.push('css="0"');
    if (wp.thicket === false) wpAttrs.push('thicket="0"');
    if (wp.longFileNames === false) wpAttrs.push('longFileNames="0"');
    if (wp.vml) wpAttrs.push('vml="1"');
    if (wp.allowPng) wpAttrs.push('allowPng="1"');
    if (wp.targetScreenSize && wp.targetScreenSize !== "800x600") wpAttrs.push(`targetScreenSize="${wp.targetScreenSize}"`);
    if (wp.dpi !== void 0 && wp.dpi !== 96) wpAttrs.push(`dpi="${wp.dpi}"`);
    if (wp.codePage !== void 0) wpAttrs.push(`codePage="${wp.codePage}"`);
    if (wp.characterSet) wpAttrs.push(`characterSet="${escapeXml(wp.characterSet)}"`);
    parts.push(`<webPublishing ${wpAttrs.join(" ")}/>`);
  }
  if (opts.fileRecoveryPr) {
    const frp = opts.fileRecoveryPr;
    const frpAttrs = [];
    if (frp.autoRecover === false) frpAttrs.push('autoRecover="0"');
    if (frp.crashSave) frpAttrs.push('crashSave="1"');
    if (frp.dataExtractLoad) frpAttrs.push('dataExtractLoad="1"');
    if (frp.repairLoad) frpAttrs.push('repairLoad="1"');
    if (frpAttrs.length > 0) parts.push(`<fileRecoveryPr ${frpAttrs.join(" ")}/>`);
  }
  if (opts.webPublishObjects && opts.webPublishObjects.length > 0) {
    const wpoParts = [`<webPublishObjects count="${opts.webPublishObjects.length}">`];
    for (const wpo of opts.webPublishObjects) {
      const wpoAttrs = [
        `id="${wpo.id}"`,
        `divId="${escapeXml(wpo.divId)}"`,
        `destinationFile="${escapeXml(wpo.destinationFile)}"`
      ];
      if (wpo.sourceObject) wpoAttrs.push(`sourceObject="${escapeXml(wpo.sourceObject)}"`);
      if (wpo.title) wpoAttrs.push(`title="${escapeXml(wpo.title)}"`);
      if (wpo.autoRepublish) wpoAttrs.push('autoRepublish="1"');
      wpoParts.push(`<webPublishObject ${wpoAttrs.join(" ")}/>`);
    }
    wpoParts.push("</webPublishObjects>");
    parts.push(wpoParts.join(""));
  }
  if (opts.extensions?.length) {
    const exts = opts.extensions.map((ext) => {
      const ns = Object.entries(ext.namespaces ?? {}).map(([name, value]) => ` ${name}="${escapeXml(value)}"`).join("");
      return `<ext uri="${escapeXml(ext.uri)}"${ns}>${ext.content ?? ""}</ext>`;
    }).join("");
    parts.push(`<extLst>${exts}</extLst>`);
  }
  parts.push("</workbook>");
  return parts.join("");
}
function buildTablePartsXml(tableParts) {
  if (tableParts.length === 0) return "";
  const p = [`<tableParts count="${tableParts.length}">`];
  for (const tp of tableParts) p.push(`<tablePart r:id="${tp.rId}"/>`);
  p.push("</tableParts>");
  return p.join("");
}
function buildExternalReferencesXml(refs) {
  if (refs.length === 0) return "";
  const p = ["<externalReferences>"];
  for (const ref of refs) p.push(`<externalReference r:id="${ref.rId}"/>`);
  p.push("</externalReferences>");
  return p.join("");
}
var workbookDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    return stringifyWorkbook(opts);
  },
  parse(el, _ctx) {
    const result = {};
    const fileVersionEl = findChild(el, "fileVersion");
    if (fileVersionEl) {
      const fv = {};
      const appName = attr(fileVersionEl, "appName");
      if (appName) fv.appName = appName;
      const lastEdited = attrNum(fileVersionEl, "lastEdited");
      if (lastEdited !== void 0) fv.lastEdited = lastEdited;
      const lowestEdited = attrNum(fileVersionEl, "lowestEdited");
      if (lowestEdited !== void 0) fv.lowestEdited = lowestEdited;
      const rupBuild = attrNum(fileVersionEl, "rupBuild");
      if (rupBuild !== void 0) fv.rupBuild = rupBuild;
      result.fileVersion = fv;
    }
    const sheetsEl = findChild(el, "sheets");
    if (sheetsEl) {
      const sheets = [];
      for (const s of sheetsEl.elements ?? []) {
        if (s.name !== "sheet") continue;
        const name = attr(s, "name") ?? "";
        const sheetId = attrNum(s, "sheetId") ?? 0;
        const rId = s.attributes?.["r:id"] ?? "";
        const state = attr(s, "state");
        sheets.push({
          name,
          sheetId,
          rId,
          state
        });
      }
      result.sheets = sheets;
    }
    const pivotCachesEl = findChild(el, "pivotCaches");
    if (pivotCachesEl) {
      const caches = [];
      for (const pc of pivotCachesEl.elements ?? []) {
        if (pc.name !== "pivotCache") continue;
        caches.push({
          cacheId: attrNum(pc, "cacheId") ?? 0,
          rId: pc.attributes?.["r:id"] ?? ""
        });
      }
      result.pivotCaches = caches;
    }
    const protEl = findChild(el, "workbookProtection");
    if (protEl?.attributes) {
      const prot = {};
      if (parseOnOff(attr(protEl, "lockStructure"))) prot.lockStructure = true;
      if (parseOnOff(attr(protEl, "lockWindows"))) prot.lockWindows = true;
      if (parseOnOff(attr(protEl, "lockRevision"))) prot.lockRevision = true;
      if (attr(protEl, "workbookAlgorithmName")) prot.workbookAlgorithmName = attr(protEl, "workbookAlgorithmName");
      if (attr(protEl, "workbookHashValue")) prot.workbookHashValue = attr(protEl, "workbookHashValue");
      if (attr(protEl, "workbookSaltValue")) prot.workbookSaltValue = attr(protEl, "workbookSaltValue");
      if (attr(protEl, "workbookSpinCount")) prot.workbookSpinCount = attrNum(protEl, "workbookSpinCount");
      if (attr(protEl, "revisionsAlgorithmName")) prot.revisionsAlgorithmName = attr(protEl, "revisionsAlgorithmName");
      if (attr(protEl, "revisionsHashValue")) prot.revisionsHashValue = attr(protEl, "revisionsHashValue");
      if (attr(protEl, "revisionsSaltValue")) prot.revisionsSaltValue = attr(protEl, "revisionsSaltValue");
      if (attr(protEl, "revisionsSpinCount")) prot.revisionsSpinCount = attrNum(protEl, "revisionsSpinCount");
      if (attr(protEl, "workbookPasswordCharacterSet")) prot.workbookPasswordCharacterSet = attr(protEl, "workbookPasswordCharacterSet");
      if (attr(protEl, "revisionsPasswordCharacterSet")) prot.revisionsPasswordCharacterSet = attr(protEl, "revisionsPasswordCharacterSet");
      result.protection = prot;
    }
    const bookViewsEl = findChild(el, "bookViews");
    if (bookViewsEl) {
      const bvEl = findChild(bookViewsEl, "workbookView");
      if (bvEl?.attributes) {
        const bv = {};
        const xw = attrNum(bvEl, "xWindow");
        if (xw !== void 0) bv.xWindow = xw;
        const yw = attrNum(bvEl, "yWindow");
        if (yw !== void 0) bv.yWindow = yw;
        const ww = attrNum(bvEl, "windowWidth");
        if (ww !== void 0) bv.windowWidth = ww;
        const wh = attrNum(bvEl, "windowHeight");
        if (wh !== void 0) bv.windowHeight = wh;
        const at = attrNum(bvEl, "activeTab");
        if (at !== void 0) bv.activeTab = at;
        if (String(attr(bvEl, "autoFilterDateGrouping")) === "0") bv.autoFilterDateGrouping = false;
        const fs = attrNum(bvEl, "firstSheet");
        if (fs !== void 0) bv.firstSheet = fs;
        if (String(attr(bvEl, "showHorizontalScroll")) === "0") bv.showHorizontalScroll = false;
        if (String(attr(bvEl, "showVerticalScroll")) === "0") bv.showVerticalScroll = false;
        if (String(attr(bvEl, "showSheetTabs")) === "0") bv.showSheetTabs = false;
        const tr = attrNum(bvEl, "tabRatio");
        if (tr !== void 0) bv.tabRatio = tr;
        const vis = attr(bvEl, "visibility");
        if (vis !== void 0) bv.visibility = vis;
        result.bookView = bv;
      }
    }
    const calcPrEl = findChild(el, "calcPr");
    if (calcPrEl?.attributes) {
      const calc = {};
      const calcId = attrNum(calcPrEl, "calcId");
      if (calcId !== void 0) calc.calcId = calcId;
      if (attr(calcPrEl, "calcMode")) calc.calcMode = attr(calcPrEl, "calcMode");
      if (parseOnOff(attr(calcPrEl, "fullCalcOnLoad"))) calc.fullCalcOnLoad = true;
      if (String(attr(calcPrEl, "concurrentCalc")) === "0") calc.concurrentCalc = false;
      if (attr(calcPrEl, "refMode")) calc.refMode = attr(calcPrEl, "refMode");
      if (String(attr(calcPrEl, "calcOnSave")) === "0") calc.calcOnSave = false;
      if (parseOnOff(attr(calcPrEl, "forceFullCalc"))) calc.forceFullCalc = true;
      const cmc = attrNum(calcPrEl, "concurrentManualCount");
      if (cmc !== void 0) calc.concurrentManualCount = cmc;
      if (parseOnOff(attr(calcPrEl, "iterate"))) calc.iterate = true;
      const ic = attrNum(calcPrEl, "iterateCount");
      if (ic !== void 0) calc.iterateCount = ic;
      const id = attrNum(calcPrEl, "iterateDelta");
      if (id !== void 0) calc.iterateDelta = id;
      if (String(attr(calcPrEl, "fullPrecision")) === "0") calc.fullPrecision = false;
      if (parseOnOff(attr(calcPrEl, "calcCompleted"))) calc.calcCompleted = true;
      result.calcPr = calc;
    }
    const oleSizeEl = findChild(el, "oleSize");
    if (oleSizeEl) {
      const ref = attr(oleSizeEl, "ref");
      if (ref) result.oleSize = ref;
    }
    const customViewsEl = findChild(el, "customWorkbookViews");
    if (customViewsEl) {
      const views = [];
      for (const v of customViewsEl.elements ?? []) {
        if (v.name !== "customWorkbookView") continue;
        const view = {
          name: attr(v, "name") ?? "",
          guid: attr(v, "guid") ?? "",
          windowWidth: attrNum(v, "windowWidth") ?? 0,
          windowHeight: attrNum(v, "windowHeight") ?? 0,
          activeSheetId: attrNum(v, "activeSheetId") ?? 1
        };
        const xw = attrNum(v, "xWindow");
        if (xw !== void 0) view.xWindow = xw;
        const yw = attrNum(v, "yWindow");
        if (yw !== void 0) view.yWindow = yw;
        if (String(attr(v, "showFormulaBar")) === "0") view.showFormulaBar = false;
        if (String(attr(v, "showStatusbar")) === "0") view.showStatusbar = false;
        if (String(attr(v, "showHorizontalScroll")) === "0") view.showHorizontalScroll = false;
        if (String(attr(v, "showVerticalScroll")) === "0") view.showVerticalScroll = false;
        if (String(attr(v, "showSheetTabs")) === "0") view.showSheetTabs = false;
        const tabRatio = attrNum(v, "tabRatio");
        if (tabRatio !== void 0) view.tabRatio = tabRatio;
        const so = attr(v, "showObjects");
        if (so) view.showObjects = so;
        if (String(attr(v, "includeHiddenRowCol")) === "0") view.includeHiddenRowCol = false;
        if (String(attr(v, "includePrintSettings")) === "0") view.includePrintSettings = false;
        if (parseOnOff(attr(v, "personalView"))) view.personalView = true;
        if (parseOnOff(attr(v, "maximized"))) view.maximized = true;
        if (parseOnOff(attr(v, "minimized"))) view.minimized = true;
        if (parseOnOff(attr(v, "autoUpdate"))) view.autoUpdate = true;
        const mi = attrNum(v, "mergeInterval");
        if (mi !== void 0) view.mergeInterval = mi;
        if (parseOnOff(attr(v, "changesSavedWin"))) view.changesSavedWin = true;
        if (parseOnOff(attr(v, "onlySync"))) view.onlySync = true;
        const sc = attr(v, "showComments");
        if (sc) view.showComments = xsdComments.from(sc);
        views.push(view);
      }
      if (views.length > 0) result.customViews = views;
    }
    const fileSharingEl = findChild(el, "fileSharing");
    if (fileSharingEl?.attributes) {
      const fs = {};
      if (parseOnOff(attr(fileSharingEl, "readOnlyRecommended"))) fs.readOnlyRecommended = true;
      if (attr(fileSharingEl, "userName")) fs.userName = attr(fileSharingEl, "userName");
      if (attr(fileSharingEl, "reservationPassword")) fs.reservationPassword = attr(fileSharingEl, "reservationPassword");
      if (attr(fileSharingEl, "algorithmName")) fs.algorithmName = attr(fileSharingEl, "algorithmName");
      if (attr(fileSharingEl, "hashValue")) fs.hashValue = attr(fileSharingEl, "hashValue");
      if (attr(fileSharingEl, "saltValue")) fs.saltValue = attr(fileSharingEl, "saltValue");
      const sc = attrNum(fileSharingEl, "spinCount");
      if (sc !== void 0) fs.spinCount = sc;
      result.fileSharing = fs;
    }
    const webPublishingEl = findChild(el, "webPublishing");
    if (webPublishingEl?.attributes) {
      const wp = {};
      if (String(attr(webPublishingEl, "css")) === "0") wp.css = false;
      if (String(attr(webPublishingEl, "thicket")) === "0") wp.thicket = false;
      if (String(attr(webPublishingEl, "longFileNames")) === "0") wp.longFileNames = false;
      if (parseOnOff(attr(webPublishingEl, "vml"))) wp.vml = true;
      if (parseOnOff(attr(webPublishingEl, "allowPng"))) wp.allowPng = true;
      if (attr(webPublishingEl, "targetScreenSize")) wp.targetScreenSize = attr(webPublishingEl, "targetScreenSize");
      const dpi = attrNum(webPublishingEl, "dpi");
      if (dpi !== void 0) wp.dpi = dpi;
      const codePage = attrNum(webPublishingEl, "codePage");
      if (codePage !== void 0) wp.codePage = codePage;
      if (attr(webPublishingEl, "characterSet")) wp.characterSet = attr(webPublishingEl, "characterSet");
      result.webPublishing = wp;
    }
    const fileRecoveryEl = findChild(el, "fileRecoveryPr");
    if (fileRecoveryEl?.attributes) {
      const frp = {};
      if (String(attr(fileRecoveryEl, "autoRecover")) === "0") frp.autoRecover = false;
      if (parseOnOff(attr(fileRecoveryEl, "crashSave"))) frp.crashSave = true;
      if (parseOnOff(attr(fileRecoveryEl, "dataExtractLoad"))) frp.dataExtractLoad = true;
      if (parseOnOff(attr(fileRecoveryEl, "repairLoad"))) frp.repairLoad = true;
      result.fileRecoveryPr = frp;
    }
    const wbPrEl = findChild(el, "workbookPr");
    if (wbPrEl?.attributes) {
      const wbPr = {};
      if (parseOnOff(attr(wbPrEl, "date1904"))) wbPr.date1904 = true;
      const dtv = attrNum(wbPrEl, "defaultThemeVersion");
      if (dtv !== void 0) wbPr.defaultThemeVersion = dtv;
      if (attr(wbPrEl, "showObjects")) wbPr.showObjects = attr(wbPrEl, "showObjects");
      if (parseOnOff(attr(wbPrEl, "hidePivotFieldList"))) wbPr.hidePivotFieldList = true;
      if (parseOnOff(attr(wbPrEl, "allowRefreshQuery"))) wbPr.allowRefreshQuery = true;
      if (parseOnOff(attr(wbPrEl, "filterPrivacy"))) wbPr.filterPrivacy = true;
      if (parseOnOff(attr(wbPrEl, "backupFile"))) wbPr.backupFile = true;
      if (attr(wbPrEl, "codeName")) wbPr.codeName = attr(wbPrEl, "codeName");
      if (parseOnOff(attr(wbPrEl, "showBorderUnselectedTables"))) wbPr.showBorderUnselectedTables = true;
      if (parseOnOff(attr(wbPrEl, "promptedSolutions"))) wbPr.promptedSolutions = true;
      if (String(attr(wbPrEl, "showInkAnnotation")) === "0") wbPr.showInkAnnotation = false;
      if (String(attr(wbPrEl, "saveExternalLinkValues")) === "0") wbPr.saveExternalLinkValues = false;
      if (attr(wbPrEl, "updateLinks")) wbPr.updateLinks = attr(wbPrEl, "updateLinks");
      if (parseOnOff(attr(wbPrEl, "showPivotChartFilter"))) wbPr.showPivotChartFilter = true;
      if (parseOnOff(attr(wbPrEl, "publishItems"))) wbPr.publishItems = true;
      if (parseOnOff(attr(wbPrEl, "checkCompatibility"))) wbPr.checkCompatibility = true;
      if (String(attr(wbPrEl, "autoCompressPictures")) === "0") wbPr.autoCompressPictures = false;
      if (parseOnOff(attr(wbPrEl, "refreshAllConnections"))) wbPr.refreshAllConnections = true;
      result.workbookPr = wbPr;
    }
    const acEl = findChild(el, "mc:AlternateContent");
    if (acEl) {
      const choice = findChild(acEl, "mc:Choice");
      const absPathEl = choice ? findChild(choice, "x15ac:absPath") ?? findChild(choice, "x15:absPath") : void 0;
      const url = absPathEl ? attr(absPathEl, "url") : void 0;
      if (url !== void 0) result.absPath = url;
    }
    const rpEl = findChild(el, "xr:revisionPtr");
    if (rpEl) {
      const rp = {};
      const revId = attrNum(rpEl, "revIDLastSave");
      if (revId !== void 0) rp.revisionIdLastSave = revId;
      if (attr(rpEl, "documentId")) rp.documentId = attr(rpEl, "documentId");
      const cvLast = attrNum(rpEl, "xr6:coauthVersionLast");
      if (cvLast !== void 0) rp.coauthVersionLast = cvLast;
      const cvMax = attrNum(rpEl, "xr6:coauthVersionMax");
      if (cvMax !== void 0) rp.coauthVersionMax = cvMax;
      if (attr(rpEl, "xr10:uidLastSave")) rp.uidLastSave = attr(rpEl, "xr10:uidLastSave");
      result.revisionPtr = rp;
    }
    const extLstEl = findChild(el, "extLst");
    if (extLstEl) {
      const extensions = [];
      for (const ext of extLstEl.elements ?? []) {
        if (ext.name !== "ext") continue;
        const uri = attr(ext, "uri");
        if (!uri) continue;
        const namespaces = {};
        for (const [name, value] of Object.entries(ext.attributes ?? {})) if (name.startsWith("xmlns:") && typeof value === "string") namespaces[name] = value;
        const content = (ext.elements ?? []).map((e) => stringifyElement(e)).join("");
        extensions.push({
          uri,
          ...Object.keys(namespaces).length > 0 ? { namespaces } : {},
          ...content ? { content } : {}
        });
      }
      if (extensions.length > 0) result.extensions = extensions;
    }
    const fgEl = findChild(el, "functionGroups");
    if (fgEl) {
      const names = [];
      for (const fg of fgEl.elements ?? []) if (fg.name === "functionGroup" && attr(fg, "name")) names.push(attr(fg, "name"));
      if (names.length > 0) result.functionGroups = names;
    }
    const wpoEl = findChild(el, "webPublishObjects");
    if (wpoEl) {
      const objs = [];
      for (const wo of wpoEl.elements ?? []) {
        if (wo.name !== "webPublishObject") continue;
        const id = attrNum(wo, "id");
        const divId = attr(wo, "divId");
        const destinationFile = attr(wo, "destinationFile");
        if (id === void 0 || divId === void 0 || destinationFile === void 0) continue;
        const obj = {
          id,
          divId,
          destinationFile
        };
        if (attr(wo, "sourceObject")) obj.sourceObject = attr(wo, "sourceObject");
        if (attr(wo, "title")) obj.title = attr(wo, "title");
        if (parseOnOff(attr(wo, "autoRepublish"))) obj.autoRepublish = true;
        objs.push(obj);
      }
      if (objs.length > 0) result.webPublishObjects = objs;
    }
    const definedNamesEl = findChild(el, "definedNames");
    if (definedNamesEl) {
      const names = [];
      for (const d of definedNamesEl.elements ?? []) {
        if (d.name !== "definedName") continue;
        const value = (d.elements ?? []).map((e) => e.text ?? "").join("");
        const dn = {
          name: attr(d, "name") ?? "",
          value
        };
        if (attr(d, "comment") !== void 0) dn.comment = attr(d, "comment");
        if (attr(d, "customMenu") !== void 0) dn.customMenu = attr(d, "customMenu");
        if (attr(d, "description") !== void 0) dn.description = attr(d, "description");
        if (attr(d, "help") !== void 0) dn.help = attr(d, "help");
        if (attr(d, "statusBar") !== void 0) dn.statusBar = attr(d, "statusBar");
        const localSheetId = attrNum(d, "localSheetId");
        if (localSheetId !== void 0) dn.localSheetId = localSheetId;
        if (parseOnOff(attr(d, "hidden"))) dn.hidden = true;
        if (parseOnOff(attr(d, "function"))) dn.function = true;
        if (parseOnOff(attr(d, "vbProcedure"))) dn.vbProcedure = true;
        if (parseOnOff(attr(d, "xlm"))) dn.xlm = true;
        const functionGroupId = attrNum(d, "functionGroupId");
        if (functionGroupId !== void 0) dn.functionGroupId = functionGroupId;
        if (attr(d, "shortcutKey") !== void 0) dn.shortcutKey = attr(d, "shortcutKey");
        if (parseOnOff(attr(d, "publishToServer"))) dn.publishToServer = true;
        if (parseOnOff(attr(d, "workbookParameter"))) dn.workbookParameter = true;
        names.push(dn);
      }
      if (names.length > 0) result.definedNames = names;
    }
    const smartTagPrEl = findChild(el, "smartTagPr");
    if (smartTagPrEl?.attributes) {
      const stp = {};
      if (parseOnOff(attr(smartTagPrEl, "embed"))) stp.embed = true;
      const show = attr(smartTagPrEl, "show");
      if (show && show !== "all") stp.show = show;
      result.smartTagPr = stp;
    }
    const smartTagTypesEl = findChild(el, "smartTagTypes");
    if (smartTagTypesEl) {
      const types = [];
      for (const t of smartTagTypesEl.elements ?? []) {
        if (t.name !== "smartTagType") continue;
        const type = {};
        const ns = attr(t, "namespaceUri");
        if (ns) type.namespaceUri = ns;
        const n = attr(t, "name");
        if (n) type.name = n;
        const u = attr(t, "url");
        if (u) type.url = u;
        types.push(type);
      }
      if (types.length > 0) result.smartTagTypes = types;
    }
    if (el.attributes?.["conformance"]) result.conformance = attr(el, "conformance");
    return result;
  }
};
var dialogsheetDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<dialogsheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'];
    if (opts.tabColor || opts.published !== void 0 || opts.codeName) {
      const prChildren = [];
      if (opts.tabColor) prChildren.push(`<tabColor${attrs({ rgb: opts.tabColor })}/>`);
      const prAttrs = [];
      if (opts.published === false) prAttrs.push(' published="0"');
      if (opts.codeName) prAttrs.push(` codeName="${escapeXml(opts.codeName)}"`);
      p.push(`<sheetPr${prAttrs.join("")}>${prChildren.join("")}</sheetPr>`);
    }
    if (opts.sheetProtection) p.push(stringifySheetProtectionXml(opts.sheetProtection));
    if (opts.printOptions) p.push(stringifyPrintOptionsXml(opts.printOptions));
    if (opts.pageMargins) {
      const pm = opts.pageMargins;
      p.push(`<pageMargins${attrs({
        left: convertToInch(pm.left ?? 0.7),
        right: convertToInch(pm.right ?? 0.7),
        top: convertToInch(pm.top ?? 0.75),
        bottom: convertToInch(pm.bottom ?? 0.75),
        header: convertToInch(pm.header ?? 0.3),
        footer: convertToInch(pm.footer ?? 0.3)
      })}/>`);
    }
    if (opts.pageSetup) p.push(stringifyPageSetupXml(opts.pageSetup));
    if (opts.headerFooter) {
      const hfXml = stringifyHeaderFooterXml(opts.headerFooter);
      if (hfXml) p.push(hfXml);
    }
    if (opts.drawingRId) p.push(`<drawing r:id="${escapeXml(opts.drawingRId)}"/>`);
    if (opts.legacyDrawingRId) p.push(`<legacyDrawing r:id="${escapeXml(opts.legacyDrawingRId)}"/>`);
    if (opts.extLst) p.push(opts.extLst);
    p.push("</dialogsheet>");
    return p.join("");
  },
  parse(el, _ctx) {
    const result = {};
    const sheetPrEl = findChild(el, "sheetPr");
    if (sheetPrEl) {
      if (String(attr(sheetPrEl, "published")) === "0") result.published = false;
      if (attr(sheetPrEl, "codeName")) result.codeName = attr(sheetPrEl, "codeName");
      const tcEl = findChild(sheetPrEl, "tabColor");
      if (tcEl && attr(tcEl, "rgb")) result.tabColor = attr(tcEl, "rgb");
    }
    const spEl = findChild(el, "sheetProtection");
    if (spEl?.attributes) result.sheetProtection = parseSheetProtectionEl(spEl);
    const pmEl = findChild(el, "pageMargins");
    if (pmEl) {
      const pm = {};
      const ml = attrNum(pmEl, "left");
      if (ml !== void 0) pm.left = ml;
      const mr = attrNum(pmEl, "right");
      if (mr !== void 0) pm.right = mr;
      const mt2 = attrNum(pmEl, "top");
      if (mt2 !== void 0) pm.top = mt2;
      const mb = attrNum(pmEl, "bottom");
      if (mb !== void 0) pm.bottom = mb;
      const mh = attrNum(pmEl, "header");
      if (mh !== void 0) pm.header = mh;
      const mf = attrNum(pmEl, "footer");
      if (mf !== void 0) pm.footer = mf;
      result.pageMargins = pm;
    }
    const psEl = findChild(el, "pageSetup");
    if (psEl) result.pageSetup = parsePageSetupEl(psEl);
    const poEl = findChild(el, "printOptions");
    if (poEl) {
      const po = {};
      if (parseOnOff(attr(poEl, "horizontalCentered"))) po.horizontalCentered = true;
      if (parseOnOff(attr(poEl, "verticalCentered"))) po.verticalCentered = true;
      if (parseOnOff(attr(poEl, "headings"))) po.headings = true;
      if (parseOnOff(attr(poEl, "gridLines"))) po.gridLines = true;
      if (String(attr(poEl, "gridLinesSet")) === "0") po.gridLinesSet = false;
      result.printOptions = po;
    }
    const hfEl = findChild(el, "headerFooter");
    if (hfEl) result.headerFooter = parseHeaderFooterEl(hfEl);
    const drEl = findChild(el, "drawing");
    if (drEl) {
      const rId = drEl.attributes?.["r:id"];
      if (rId) result.drawingRId = rId;
    }
    const ldEl = findChild(el, "legacyDrawing");
    if (ldEl) {
      const rId = ldEl.attributes?.["r:id"];
      if (rId) result.legacyDrawingRId = rId;
    }
    const extEl = findChild(el, "extLst");
    if (extEl) result.extLst = stringifyElement(extEl);
    return result;
  }
};
var mapInfoDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = [`<MapInfo xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" SelectionNamespaces="${escapeXml(opts.selectionNamespaces)}">`];
    for (const s of opts.schemas) {
      const attrs2 = [`ID="${escapeXml(s.id)}"`];
      if (s.schemaRef !== void 0) attrs2.push(`SchemaRef="${escapeXml(s.schemaRef)}"`);
      if (s.namespace !== void 0) attrs2.push(`Namespace="${escapeXml(s.namespace)}"`);
      if (s.schemaLanguage !== void 0) attrs2.push(`SchemaLanguage="${escapeXml(s.schemaLanguage)}"`);
      if (s.content) p.push(`<Schema ${attrs2.join(" ")}>${s.content}</Schema>`);
      else p.push(`<Schema ${attrs2.join(" ")}/>`);
    }
    for (const m of opts.maps) {
      const attrs2 = [
        `ID="${m.id}"`,
        `Name="${escapeXml(m.name)}"`,
        `RootElement="${escapeXml(m.rootElement)}"`,
        `SchemaID="${escapeXml(m.schemaId)}"`,
        `ShowImportExportValidationErrors="${m.showImportExportValidationErrors ? 1 : 0}"`,
        `AutoFit="${m.autoFit ? 1 : 0}"`,
        `Append="${m.append ? 1 : 0}"`,
        `PreserveSortAFLayout="${m.preserveSortAFLayout ? 1 : 0}"`,
        `PreserveFormat="${m.preserveFormat ? 1 : 0}"`
      ];
      if (m.dataBinding) {
        const d = m.dataBinding;
        const dAttrs = [];
        if (d.dataBindingName !== void 0) dAttrs.push(`DataBindingName="${escapeXml(d.dataBindingName)}"`);
        if (d.fileBinding) dAttrs.push('FileBinding="1"');
        if (d.connectionId !== void 0) dAttrs.push(`ConnectionID="${d.connectionId}"`);
        if (d.fileBindingName !== void 0) dAttrs.push(`FileBindingName="${escapeXml(d.fileBindingName)}"`);
        dAttrs.push(`DataBindingLoadMode="${d.dataBindingLoadMode}"`);
        p.push(`<Map ${attrs2.join(" ")}><DataBinding ${dAttrs.join(" ")}/></Map>`);
      } else p.push(`<Map ${attrs2.join(" ")}/>`);
    }
    p.push("</MapInfo>");
    return p.join("");
  },
  parse(el, _ctx) {
    const schemas = [];
    const maps = [];
    for (const child of el.elements ?? []) if (child.name === "Schema") {
      const s = { id: attr(child, "ID") ?? "" };
      if (attr(child, "SchemaRef") !== void 0) s.schemaRef = attr(child, "SchemaRef");
      if (attr(child, "Namespace") !== void 0) s.namespace = attr(child, "Namespace");
      if (attr(child, "SchemaLanguage") !== void 0) s.schemaLanguage = attr(child, "SchemaLanguage");
      const inner = (child.elements ?? []).map((c) => stringifyElement(c)).join("");
      if (inner) s.content = inner;
      schemas.push(s);
    } else if (child.name === "Map") {
      const m = {
        id: attrNum(child, "ID") ?? 0,
        name: attr(child, "Name") ?? "",
        rootElement: attr(child, "RootElement") ?? "",
        schemaId: attr(child, "SchemaID") ?? ""
      };
      if (parseOnOff(attr(child, "ShowImportExportValidationErrors"))) m.showImportExportValidationErrors = true;
      if (parseOnOff(attr(child, "AutoFit"))) m.autoFit = true;
      if (parseOnOff(attr(child, "Append"))) m.append = true;
      if (parseOnOff(attr(child, "PreserveSortAFLayout"))) m.preserveSortAFLayout = true;
      if (parseOnOff(attr(child, "PreserveFormat"))) m.preserveFormat = true;
      const dEl = findChild(child, "DataBinding");
      if (dEl) {
        const d = { dataBindingLoadMode: 0 };
        if (attr(dEl, "DataBindingName") !== void 0) d.dataBindingName = attr(dEl, "DataBindingName");
        if (parseOnOff(attr(dEl, "FileBinding"))) d.fileBinding = true;
        const cid = attrNum(dEl, "ConnectionID");
        if (cid !== void 0) d.connectionId = cid;
        if (attr(dEl, "FileBindingName") !== void 0) d.fileBindingName = attr(dEl, "FileBindingName");
        const mode = attrNum(dEl, "DataBindingLoadMode");
        if (mode !== void 0) d.dataBindingLoadMode = mode;
        m.dataBinding = d;
      }
      maps.push(m);
    }
    return {
      selectionNamespaces: attr(el, "SelectionNamespaces") ?? "",
      schemas,
      maps
    };
  }
};
var singleXmlCellsDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    const p = ['<singleXmlCells xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    for (const c of opts.cells) {
      const pr = c.xmlCellPr;
      const prAttrs = [`id="${pr.id}"`];
      if (pr.uniqueName !== void 0) prAttrs.push(`uniqueName="${escapeXml(pr.uniqueName)}"`);
      if (typeof pr.xmlPr.mapId !== "number") continue;
      p.push(`<singleXmlCell id="${c.id}" r="${escapeXml(c.reference)}" connectionId="${c.connectionId}"><xmlCellPr ${prAttrs.join(" ")}><xmlPr mapId="${pr.xmlPr.mapId}" xpath="${escapeXml(pr.xmlPr.xpath)}" xmlDataType="${escapeXml(pr.xmlPr.xmlDataType)}"/></xmlCellPr></singleXmlCell>`);
    }
    p.push("</singleXmlCells>");
    return p.join("");
  },
  parse(el, _ctx) {
    const cells = [];
    for (const cEl of el.elements ?? []) {
      if (cEl.name !== "singleXmlCell") continue;
      const prEl = findChild(cEl, "xmlCellPr");
      if (!prEl) continue;
      const xmlPrEl = findChild(prEl, "xmlPr");
      if (!xmlPrEl) continue;
      const pr = { id: attrNum(prEl, "id") ?? 0 };
      if (attr(prEl, "uniqueName") !== void 0) pr.uniqueName = attr(prEl, "uniqueName");
      pr.xmlPr = {
        mapId: attrNum(xmlPrEl, "mapId") ?? 0,
        xpath: attr(xmlPrEl, "xpath") ?? "",
        xmlDataType: attr(xmlPrEl, "xmlDataType") ?? ""
      };
      cells.push({
        id: attrNum(cEl, "id") ?? 0,
        reference: attr(cEl, "r") ?? "",
        connectionId: attrNum(cEl, "connectionId") ?? 0,
        xmlCellPr: pr
      });
    }
    return { cells };
  }
};
function parseNestedChildren(el) {
  const children2 = [];
  for (const child of el.elements ?? []) {
    if (child.type !== "element") continue;
    if (child.name === "undo") {
      const undo = {
        index: Number(attr(child, "index") ?? "0"),
        expression: attr(child, "exp") ?? "ref",
        undoRange: attr(child, "dr") ?? ""
      };
      readBool(child, "ref3D", (v) => undo.ref3D = v);
      readBool(child, "array", (v) => undo.array = v);
      readBool(child, "v", (v) => undo.value = v);
      readBool(child, "nf", (v) => undo.numberFormat = v);
      readBool(child, "cs", (v) => undo.conditionalStyle = v);
      readStr(child, "dn", (v) => undo.definedName = v);
      readStr(child, "r", (v) => undo.reference = v);
      readNum(child, "sId", (v) => undo.sId = v);
      children2.push({
        kind: "undo",
        data: undo
      });
    } else if (child.name === "rcc") {
      const nested = parseEntry(child);
      if (nested?.type === "cellChange") children2.push({
        kind: "cellChange",
        data: nested.data
      });
    } else if (child.name === "rfmt") {
      const nested = parseEntry(child);
      if (nested?.type === "formatting") children2.push({
        kind: "formatting",
        data: nested.data
      });
    }
  }
  return children2;
}
function firstChildXml(el, name) {
  const child = findChild(el ?? void 0, name);
  return child ? stringifyElement(child) : void 0;
}
function parseBool(el, name) {
  const v = attr(el, name);
  if (v === void 0) return void 0;
  return parseOnOff(v) ?? false;
}
function parseEntry(el) {
  switch (el.name) {
    case "rrc": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        sheetId: Number(attr(el, "sId") ?? "0"),
        ref: attr(el, "ref") ?? "",
        action: attr(el, "action") ?? "insertRow"
      };
      const endOfList = parseBool(el, "eol");
      if (endOfList) d.endOfList = endOfList;
      const edge = parseBool(el, "edge");
      if (edge) d.edge = edge;
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      const children2 = parseNestedChildren(el);
      if (children2.length > 0) d.children = children2;
      return {
        type: "rowColumn",
        data: d
      };
    }
    case "rm": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        source: attr(el, "source") ?? "",
        destination: attr(el, "destination") ?? ""
      };
      const sourceSheetId = attr(el, "sourceSheetId");
      if (sourceSheetId !== void 0) d.sourceSheetId = Number(sourceSheetId);
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      const children2 = parseNestedChildren(el);
      if (children2.length > 0) d.children = children2;
      return {
        type: "move",
        data: d
      };
    }
    case "rcv":
      return {
        type: "customView",
        data: {
          guid: attr(el, "guid") ?? "",
          action: attr(el, "action") ?? "add"
        }
      };
    case "rsnm": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        oldName: attr(el, "oldName") ?? "",
        newName: attr(el, "newName") ?? ""
      };
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      return {
        type: "sheetRename",
        data: d
      };
    }
    case "ris": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        name: attr(el, "name") ?? "",
        sheetPosition: Number(attr(el, "sheetPosition") ?? "0")
      };
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      return {
        type: "insertSheet",
        data: d
      };
    }
    case "rcc": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        sheetId: Number(attr(el, "sId") ?? "0"),
        newCellXml: firstChildXml(el, "nc") ?? ""
      };
      const hasOldDxf = parseBool(el, "odxf");
      if (hasOldDxf) d.hasOldDxf = hasOldDxf;
      const xfDxf = parseBool(el, "xfDxf");
      if (xfDxf) d.xfDxf = xfDxf;
      const style = parseBool(el, "s");
      if (style) d.style = style;
      const hasDxf = parseBool(el, "dxf");
      if (hasDxf) d.hasDxf = hasDxf;
      const numFmtId = attr(el, "numFmtId");
      if (numFmtId !== void 0) d.numFmtId = Number(numFmtId);
      const quotePrefix = parseBool(el, "quotePrefix");
      if (quotePrefix) d.quotePrefix = quotePrefix;
      const oldQuotePrefix = parseBool(el, "oldQuotePrefix");
      if (oldQuotePrefix) d.oldQuotePrefix = oldQuotePrefix;
      const phonetic = parseBool(el, "ph");
      if (phonetic) d.phonetic = phonetic;
      const oldPhonetic = parseBool(el, "oldPh");
      if (oldPhonetic) d.oldPhonetic = oldPhonetic;
      const endOfList = parseBool(el, "endOfListFormulaUpdate");
      if (endOfList) d.endOfListFormulaUpdate = endOfList;
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      const oc = firstChildXml(el, "oc");
      if (oc) d.oldCellXml = oc;
      const odxf = firstChildXml(el, "odxf");
      if (odxf) d.oldDxfXml = odxf;
      const ndxf = firstChildXml(el, "ndxf");
      if (ndxf) d.newDxfXml = ndxf;
      return {
        type: "cellChange",
        data: d
      };
    }
    case "rfmt": {
      const d = {
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        sqref: attr(el, "sqref") ?? ""
      };
      const xfDxf = parseBool(el, "xfDxf");
      if (xfDxf) d.xfDxf = xfDxf;
      const style = parseBool(el, "s");
      if (style) d.style = style;
      const start = attr(el, "start");
      if (start !== void 0) d.start = Number(start);
      const length = attr(el, "length");
      if (length !== void 0) d.length = Number(length);
      const dxfXml = firstChildXml(el, "dxf");
      if (dxfXml) d.dxfXml = dxfXml;
      return {
        type: "formatting",
        data: d
      };
    }
    case "raf": {
      const d = {
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        ref: attr(el, "ref") ?? ""
      };
      const autoAttrs = Object.entries(el.attributes ?? {}).filter(([k]) => k !== "sheetId" && k !== "ref").map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`).join("");
      if (autoAttrs) d.autoFormatXml = autoAttrs;
      return {
        type: "autoFormatting",
        data: d
      };
    }
    case "rdn": {
      const d = {
        rId: Number(attr(el, "rId") ?? "0"),
        name: attr(el, "name") ?? ""
      };
      const localSheetId = attr(el, "localSheetId");
      if (localSheetId !== void 0) d.localSheetId = Number(localSheetId);
      readBool(el, "customView", (v) => d.customView = v);
      readBool(el, "function", (v) => d.function = v);
      readBool(el, "oldFunction", (v) => d.oldFunction = v);
      readNum(el, "functionGroupId", (v) => d.functionGroupId = v);
      readNum(el, "oldFunctionGroupId", (v) => d.oldFunctionGroupId = v);
      readNum(el, "shortcutKey", (v) => d.shortcutKey = v);
      readNum(el, "oldShortcutKey", (v) => d.oldShortcutKey = v);
      readBool(el, "hidden", (v) => d.hidden = v);
      readBool(el, "oldHidden", (v) => d.oldHidden = v);
      readStr(el, "customMenu", (v) => d.customMenu = v);
      readStr(el, "oldCustomMenu", (v) => d.oldCustomMenu = v);
      readStr(el, "description", (v) => d.description = v);
      readStr(el, "oldDescription", (v) => d.oldDescription = v);
      readStr(el, "help", (v) => d.help = v);
      readStr(el, "oldHelp", (v) => d.oldHelp = v);
      readStr(el, "statusBar", (v) => d.statusBar = v);
      readStr(el, "oldStatusBar", (v) => d.oldStatusBar = v);
      readStr(el, "comment", (v) => d.comment = v);
      readStr(el, "oldComment", (v) => d.oldComment = v);
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      const formula = findChild(el, "formula");
      if (formula) d.formula = textOf(formula) ?? "";
      const oldFormula = findChild(el, "oldFormula");
      if (oldFormula) d.oldFormula = textOf(oldFormula) ?? "";
      return {
        type: "definedName",
        data: d
      };
    }
    case "rcmt": {
      const d = {
        sheetId: Number(attr(el, "sheetId") ?? "0"),
        cell: attr(el, "cell") ?? "",
        guid: attr(el, "guid") ?? "",
        author: attr(el, "author") ?? ""
      };
      const action = attr(el, "action");
      if (action) d.action = action;
      readBool(el, "alwaysShow", (v) => d.alwaysShow = v);
      readBool(el, "old", (v) => d.old = v);
      readBool(el, "hiddenRow", (v) => d.hiddenRow = v);
      readBool(el, "hiddenColumn", (v) => d.hiddenColumn = v);
      readNum(el, "oldLength", (v) => d.oldLength = v);
      readNum(el, "newLength", (v) => d.newLength = v);
      return {
        type: "comment",
        data: d
      };
    }
    case "rqt":
      return {
        type: "queryTableField",
        data: {
          sheetId: Number(attr(el, "sheetId") ?? "0"),
          ref: attr(el, "ref") ?? "",
          fieldId: Number(attr(el, "fieldId") ?? "0")
        }
      };
    case "rcft": {
      const d = { rId: Number(attr(el, "rId") ?? "0") };
      const undo = parseBool(el, "ua");
      if (undo) d.undo = undo;
      const rejected = parseBool(el, "ra");
      if (rejected) d.rejected = rejected;
      const sheetId = attr(el, "sheetId");
      if (sheetId !== void 0) d.sheetId = Number(sheetId);
      return {
        type: "conflict",
        data: d
      };
    }
    default:
      return;
  }
}
function readBool(el, name, set) {
  const raw = attr(el, name);
  if (parseOnOff(raw)) set(true);
}
function readNum(el, name, set) {
  const raw = attr(el, name);
  if (raw !== void 0) set(Number(raw));
}
function readStr(el, name, set) {
  const raw = attr(el, name);
  if (raw !== void 0) set(raw);
}
var S_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
var R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
function agRevData(data) {
  let s = ` rId="${data.rId}"`;
  if (data.undo) s += ` ua="1"`;
  if (data.rejected) s += ` ra="1"`;
  return s;
}
function stringifyUndo(d) {
  let a = ` index="${d.index}" exp="${d.expression}" dr="${escapeXml(d.undoRange)}"`;
  if (d.ref3D) a += ` ref3D="1"`;
  if (d.array) a += ` array="1"`;
  if (d.value) a += ` v="1"`;
  if (d.numberFormat) a += ` nf="1"`;
  if (d.conditionalStyle) a += ` cs="1"`;
  if (d.definedName !== void 0) a += ` dn="${escapeXml(d.definedName)}"`;
  if (d.reference !== void 0) a += ` r="${escapeXml(d.reference)}"`;
  if (d.sId !== void 0) a += ` sId="${d.sId}"`;
  return `<undo${a}/>`;
}
function stringifyNestedChildren(children2) {
  if (!children2) return "";
  return children2.map((child) => {
    switch (child.kind) {
      case "undo":
        return stringifyUndo(child.data);
      case "cellChange":
        return stringifyEntry({
          type: "cellChange",
          data: child.data
        });
      case "formatting":
        return stringifyEntry({
          type: "formatting",
          data: child.data
        });
    }
  }).join("");
}
function stringifyEntry(entry) {
  switch (entry.type) {
    case "rowColumn": {
      const d = entry.data;
      let a = agRevData(d) + ` sId="${d.sheetId}" ref="${escapeXml(d.ref)}" action="${d.action}"`;
      if (d.endOfList) a += ` eol="1"`;
      if (d.edge) a += ` edge="1"`;
      return `<rrc${a}>${stringifyNestedChildren(d.children)}</rrc>`;
    }
    case "move": {
      const d = entry.data;
      let a = agRevData(d) + ` sheetId="${d.sheetId}" source="${escapeXml(d.source)}" destination="${escapeXml(d.destination)}"`;
      if (d.sourceSheetId !== void 0) a += ` sourceSheetId="${d.sourceSheetId}"`;
      return `<rm${a}>${stringifyNestedChildren(d.children)}</rm>`;
    }
    case "customView": {
      const d = entry.data;
      return `<rcv guid="${escapeXml(d.guid)}" action="${d.action}"/>`;
    }
    case "sheetRename": {
      const d = entry.data;
      return `<rsnm${agRevData(d)} sheetId="${d.sheetId}" oldName="${escapeXml(d.oldName)}" newName="${escapeXml(d.newName)}"/>`;
    }
    case "insertSheet": {
      const d = entry.data;
      return `<ris${agRevData(d)} sheetId="${d.sheetId}" name="${escapeXml(d.name)}" sheetPosition="${d.sheetPosition}"/>`;
    }
    case "cellChange": {
      const d = entry.data;
      let a = agRevData(d) + ` sId="${d.sheetId}"`;
      if (d.hasOldDxf) a += ` odxf="1"`;
      if (d.xfDxf) a += ` xfDxf="1"`;
      if (d.style) a += ` s="1"`;
      if (d.hasDxf) a += ` dxf="1"`;
      if (d.numFmtId !== void 0) a += ` numFmtId="${d.numFmtId}"`;
      if (d.quotePrefix) a += ` quotePrefix="1"`;
      if (d.oldQuotePrefix) a += ` oldQuotePrefix="1"`;
      if (d.phonetic) a += ` ph="1"`;
      if (d.oldPhonetic) a += ` oldPh="1"`;
      if (d.endOfListFormulaUpdate) a += ` endOfListFormulaUpdate="1"`;
      if (!d.newCellXml) return "";
      const children2 = [
        d.oldCellXml ?? "",
        d.newCellXml,
        d.oldDxfXml ?? "",
        d.newDxfXml ?? ""
      ].filter(Boolean).join("");
      return `<rcc${a}>${children2}</rcc>`;
    }
    case "formatting": {
      const d = entry.data;
      let a = ` sheetId="${d.sheetId}" sqref="${escapeXml(d.sqref)}"`;
      if (d.xfDxf) a += ` xfDxf="1"`;
      if (d.style) a += ` s="1"`;
      if (d.start !== void 0) a += ` start="${d.start}"`;
      if (d.length !== void 0) a += ` length="${d.length}"`;
      return `<rfmt${a}>${d.dxfXml ?? ""}</rfmt>`;
    }
    case "autoFormatting": {
      const d = entry.data;
      return `<raf sheetId="${d.sheetId}" ref="${escapeXml(d.ref)}"${d.autoFormatXml ?? ""}/>`;
    }
    case "definedName": {
      const d = entry.data;
      let a = agRevData(d) + ` name="${escapeXml(d.name)}"`;
      if (d.localSheetId !== void 0) a += ` localSheetId="${d.localSheetId}"`;
      if (d.customView) a += ` customView="1"`;
      if (d.function) a += ` function="1"`;
      if (d.oldFunction) a += ` oldFunction="1"`;
      if (d.functionGroupId !== void 0) a += ` functionGroupId="${d.functionGroupId}"`;
      if (d.oldFunctionGroupId !== void 0) a += ` oldFunctionGroupId="${d.oldFunctionGroupId}"`;
      if (d.shortcutKey !== void 0) a += ` shortcutKey="${d.shortcutKey}"`;
      if (d.oldShortcutKey !== void 0) a += ` oldShortcutKey="${d.oldShortcutKey}"`;
      if (d.hidden) a += ` hidden="1"`;
      if (d.oldHidden) a += ` oldHidden="1"`;
      const xstring = (v, attr2) => v !== void 0 ? ` ${attr2}="${escapeXml(v)}"` : "";
      a += xstring(d.customMenu, "customMenu") + xstring(d.oldCustomMenu, "oldCustomMenu");
      a += xstring(d.description, "description") + xstring(d.oldDescription, "oldDescription");
      a += xstring(d.help, "help") + xstring(d.oldHelp, "oldHelp");
      a += xstring(d.statusBar, "statusBar") + xstring(d.oldStatusBar, "oldStatusBar");
      a += xstring(d.comment, "comment") + xstring(d.oldComment, "oldComment");
      const children2 = [d.formula !== void 0 ? `<formula>${escapeXml(d.formula)}</formula>` : "", d.oldFormula !== void 0 ? `<oldFormula>${escapeXml(d.oldFormula)}</oldFormula>` : ""].filter(Boolean).join("");
      return `<rdn${a}>${children2}</rdn>`;
    }
    case "comment": {
      const d = entry.data;
      let a = ` sheetId="${d.sheetId}" cell="${escapeXml(d.cell)}" guid="${escapeXml(d.guid)}" action="${d.action ?? "add"}" author="${escapeXml(d.author)}"`;
      if (d.alwaysShow) a += ` alwaysShow="1"`;
      if (d.old) a += ` old="1"`;
      if (d.hiddenRow) a += ` hiddenRow="1"`;
      if (d.hiddenColumn) a += ` hiddenColumn="1"`;
      if (d.oldLength !== void 0) a += ` oldLength="${d.oldLength}"`;
      if (d.newLength !== void 0) a += ` newLength="${d.newLength}"`;
      return `<rcmt${a}/>`;
    }
    case "queryTableField": {
      const d = entry.data;
      if (d.sheetId === void 0 || d.ref === void 0 || d.fieldId === void 0) return "";
      return `<rqt sheetId="${d.sheetId}" ref="${escapeXml(d.ref)}" fieldId="${d.fieldId}"/>`;
    }
    case "conflict": {
      const d = entry.data;
      if (d.rId === void 0) return "";
      let a = agRevData(d);
      if (d.sheetId !== void 0) a += ` sheetId="${d.sheetId}"`;
      return `<rcft${a}/>`;
    }
  }
}
function stringifyHeader(h) {
  const sheetIds = h.sheetIds.map((id) => `<sheetId val="${id}"/>`).join("");
  const reviewedXml = h.reviewed && h.reviewed.length > 0 ? `<reviewedList count="${h.reviewed.length}">${h.reviewed.map((r) => `<reviewed rId="${r}"/>`).join("")}</reviewedList>` : "";
  let attrs2 = ` guid="${escapeXml(h.guid)}" dateTime="${escapeXml(h.dateTime)}" maxSheetId="${h.maxSheetId}" userName="${escapeXml(h.userName)}" r:id="${escapeXml(h.rId)}"`;
  if (h.minRId !== void 0) attrs2 += ` minRId="${h.minRId}"`;
  if (h.maxRId !== void 0) attrs2 += ` maxRId="${h.maxRId}"`;
  return `<header${attrs2}><sheetIdMap count="${h.sheetIds.length}">${sheetIds}</sheetIdMap>${reviewedXml}</header>`;
}
function parseHeader(el) {
  const guid = attr(el, "guid") ?? "";
  const dateTime = attr(el, "dateTime") ?? "";
  const userName = attr(el, "userName") ?? "";
  const rId = String(el.attributes?.["r:id"] ?? el.attributes?.["id"] ?? "");
  const maxSheetId = Number(attr(el, "maxSheetId") ?? "0");
  const sheetIdMap = findChild(el, "sheetIdMap");
  const result = {
    guid,
    dateTime,
    userName,
    rId,
    maxSheetId,
    sheetIds: children(sheetIdMap, "sheetId").map((s) => Number(attr(s, "val") ?? "0"))
  };
  const reviewedList = findChild(el, "reviewedList");
  if (reviewedList) {
    const reviewed = children(reviewedList, "reviewed").map((r) => Number(attr(r, "rId") ?? "0"));
    if (reviewed.length > 0) result.reviewed = reviewed;
  }
  const minRId = attr(el, "minRId");
  if (minRId !== void 0) result.minRId = Number(minRId);
  const maxRId = attr(el, "maxRId");
  if (maxRId !== void 0) result.maxRId = Number(maxRId);
  return result;
}
var revisionHeadersDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (opts.headers.length === 0) return void 0;
    let attrs2 = ` xmlns="${S_NS}" xmlns:r="${R_NS}" guid="${escapeXml(opts.guid)}"`;
    if (opts.lastGuid) attrs2 += ` lastGuid="${escapeXml(opts.lastGuid)}"`;
    if (opts.shared !== void 0) attrs2 += ` shared="${opts.shared ? 1 : 0}"`;
    if (opts.diskRevisions !== void 0) attrs2 += ` diskRevisions="${opts.diskRevisions ? 1 : 0}"`;
    if (opts.history !== void 0) attrs2 += ` history="${opts.history ? 1 : 0}"`;
    if (opts.trackRevisions !== void 0) attrs2 += ` trackRevisions="${opts.trackRevisions ? 1 : 0}"`;
    if (opts.exclusive !== void 0) attrs2 += ` exclusive="${opts.exclusive ? 1 : 0}"`;
    if (opts.revisionId !== void 0) attrs2 += ` revisionId="${opts.revisionId}"`;
    if (opts.version !== void 0) attrs2 += ` version="${opts.version}"`;
    if (opts.keepChangeHistory !== void 0) attrs2 += ` keepChangeHistory="${opts.keepChangeHistory ? 1 : 0}"`;
    if (opts.protected !== void 0) attrs2 += ` protected="${opts.protected ? 1 : 0}"`;
    if (opts.preserveHistory !== void 0) attrs2 += ` preserveHistory="${opts.preserveHistory}"`;
    return `<headers${attrs2}>${opts.headers.map(stringifyHeader).join("")}</headers>`;
  },
  parse(el, _ctx) {
    const result = {
      guid: attr(el, "guid") ?? "",
      headers: children(el, "header").map(parseHeader)
    };
    const lastGuid = attr(el, "lastGuid");
    if (lastGuid !== void 0) result.lastGuid = lastGuid;
    readBool(el, "shared", (v) => result.shared = v);
    readBool(el, "diskRevisions", (v) => result.diskRevisions = v);
    readBool(el, "history", (v) => result.history = v);
    readBool(el, "trackRevisions", (v) => result.trackRevisions = v);
    readBool(el, "exclusive", (v) => result.exclusive = v);
    readNum(el, "revisionId", (v) => result.revisionId = v);
    readNum(el, "version", (v) => result.version = v);
    readBool(el, "keepChangeHistory", (v) => result.keepChangeHistory = v);
    readBool(el, "protected", (v) => result.protected = v);
    readNum(el, "preserveHistory", (v) => result.preserveHistory = v);
    return result;
  }
};
var usersDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (!opts.users || opts.users.length === 0) return void 0;
    const users = opts.users.map((u) => `<userInfo guid="${escapeXml(u.guid)}" name="${escapeXml(u.name)}" id="${u.id}" dateTime="${escapeXml(u.dateTime)}"/>`).join("");
    return `<users xmlns="${S_NS}" count="${opts.users.length}">${users}</users>`;
  },
  parse(el, _ctx) {
    const users = children(el, "userInfo").map((u) => ({
      guid: attr(u, "guid") ?? "",
      name: attr(u, "name") ?? "",
      id: Number(attr(u, "id") ?? "0"),
      dateTime: attr(u, "dateTime") ?? ""
    }));
    const result = {};
    if (users.length > 0) result.users = users;
    return result;
  }
};
var revisionLogDesc = {
  kind: "custom",
  stringify(opts, _ctx) {
    if (opts.revisions.length === 0) return void 0;
    return `<revisions xmlns="${S_NS}">${opts.revisions.map(stringifyEntry).filter(Boolean).join("")}</revisions>`;
  },
  parse(el, _ctx) {
    const revisions = [];
    for (const child of el.elements ?? []) {
      if (child.type !== "element") continue;
      const entry = parseEntry(child);
      if (entry) revisions.push(entry);
    }
    return { revisions };
  }
};
var SML_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function buildVolTypesXml(volTypes) {
  if (volTypes.length === 0) return "";
  const parts = [`<volTypes xmlns="${SML_NS}" count="${volTypes.length}">`];
  for (const vt of volTypes) {
    const vtType = vt.type ?? "realTimeData";
    const mains = vt.mains ?? [];
    if (mains.length > 0) {
      const mainParts = [];
      for (const m of mains) {
        const tpParts = [];
        for (const topic of m.topics ?? []) {
          const tpInner = [`<v>${escapeXml(topic.value)}</v>`];
          for (const stp of topic.stringTopics ?? []) tpInner.push(`<stp>${escapeXml(stp)}</stp>`);
          for (const tr of topic.refs ?? []) tpInner.push(`<tr r="${escapeXml(tr.reference)}" s="${tr.sheetIndex}"/>`);
          const tpAttr = topic.valueType && topic.valueType !== "n" ? ` t="${escapeXml(topic.valueType)}"` : "";
          tpParts.push(`<tp${tpAttr}>${tpInner.join("")}</tp>`);
        }
        mainParts.push(`<main first="${escapeXml(m.first)}">${tpParts.join("")}</main>`);
      }
      parts.push(`<volType type="${vtType}">${mainParts.join("")}</volType>`);
    } else parts.push(`<volType type="${vtType}"/>`);
  }
  parts.push("</volTypes>");
  return parts.join("");
}
function parseVolTypesEl(el) {
  const volTypes = [];
  for (const vt of el.elements ?? []) {
    if (vt.name !== "volType") continue;
    const volType = {};
    const typeVal = attr(vt, "type");
    if (typeVal) volType.type = typeVal;
    const mains = [];
    for (const m of vt.elements ?? []) {
      if (m.name !== "main") continue;
      const main = { first: attr(m, "first") ?? "" };
      const topics = [];
      for (const tp of m.elements ?? []) {
        if (tp.name !== "tp") continue;
        const vEl = findChild(tp, "v");
        const topic = { value: String(vEl?.elements?.[0]?.text ?? "") };
        const tVal = attr(tp, "t");
        if (tVal) topic.valueType = tVal;
        const stps = [];
        const refs = [];
        for (const inner of tp.elements ?? []) {
          if (inner.name === "stp") stps.push(String(inner.elements?.[0]?.text ?? ""));
          if (inner.name === "tr") {
            const ref = {
              reference: attr(inner, "r") ?? "",
              sheetIndex: attrNum(inner, "s") ?? 0
            };
            refs.push(ref);
          }
        }
        if (stps.length > 0) topic.stringTopics = stps;
        if (refs.length > 0) topic.refs = refs;
        topics.push(topic);
      }
      if (topics.length > 0) main.topics = topics;
      mains.push(main);
    }
    if (mains.length > 0) volType.mains = mains;
    volTypes.push(volType);
  }
  return volTypes;
}
var XlsxWriteContext = class {
  sharedStrings = new SharedStrings();
  styles = new Styles();
  media = new Media();
  charts = new ChartCollection();
  workbookRels = new Relationships();
  pivotCacheRefs = [];
  _hyperlinks = /* @__PURE__ */ new Map();
  addRelationship(type, target, _mode) {
    return `rId${this.workbookRels.add(type, target)}`;
  }
  addMedia(data, type) {
    return `{${this.media.addMedia(data, type, (fileName) => ({
      fileName,
      type,
      data,
      width: 0,
      height: 0
    })).fileName}}`;
  }
  addHyperlink(key, target) {
    if (target.slide !== void 0) throw new Error("xlsx text hyperlinks cannot target slides \u2014 use url instead");
    this._hyperlinks.set(key, {
      key,
      url: target.url ?? "",
      tooltip: target.tooltip
    });
  }
  /**
  * Register a differential format and return its dxfId.
  */
  registerDxf(opts) {
    return this.styles.registerDxf(opts);
  }
  /** DrawingML text hyperlinks registered by drawing shape runs (placeholder key → entry). */
  get hyperlinks() {
    return [...this._hyperlinks.values()];
  }
};
var XlsxReadContext = class {
  xlsx;
  /**
  * Parsed shared-string entries for resolving cell values. Rich-text entries
  * flow through as RichTextOptions objects so cells keep their structure
  * (cell.value accepts both shapes).
  */
  sharedStrings;
  /**
  * Path of the part currently being parsed. rId numbering is per-part, so a
  * descriptor resolving a relationship mid-parse (a theme blip fill's
  * r:embed) must hit that part's own .rels, not the workbook's.
  */
  currentPart = "xl/workbook.xml";
  partRels = /* @__PURE__ */ new Map();
  constructor(xlsx, sharedStrings) {
    this.xlsx = xlsx;
    this.sharedStrings = sharedStrings ?? [];
    this.loadPartRels();
  }
  /** Index every `x/_rels/y.xml.rels` as y → (rId → resolved target path). */
  loadPartRels() {
    for (const relsPath of this.xlsx.doc.keys()) {
      const idx = relsPath.lastIndexOf("/_rels/");
      if (idx < 0 || !relsPath.endsWith(".rels")) continue;
      const partPath = `${relsPath.slice(0, idx)}/${relsPath.slice(idx + 7, -5)}`;
      const relsEl = this.xlsx.doc.get(relsPath);
      if (!relsEl?.elements) continue;
      const byId = /* @__PURE__ */ new Map();
      for (const child of relsEl.elements) {
        if (child.name !== "Relationship") continue;
        const id = child.attributes?.["Id"];
        const target = child.attributes?.["Target"];
        if (id && target) byId.set(id, resolveRelationshipTarget(partPath, target));
      }
      this.partRels.set(partPath, byId);
    }
  }
  /**
  * Run `fn` with `currentPart` temporarily set to `partPath`, restoring the
  * previous value afterwards — a sub-part parse (the theme) resolves its
  * relationship ids against that part's own rels.
  */
  withPart(partPath, fn) {
    const prev = this.currentPart;
    this.currentPart = partPath;
    try {
      return fn();
    } finally {
      this.currentPart = prev;
    }
  }
  resolveRelationship(rId) {
    const scoped = this.partRels.get(this.currentPart)?.get(rId);
    if (scoped !== void 0) return scoped;
    const wbRels = this.xlsx.doc.get("xl/_rels/workbook.xml.rels");
    if (!wbRels?.elements) return void 0;
    for (const child of wbRels.elements) {
      if (child.name !== "Relationship") continue;
      if (child.attributes?.["Id"] === rId) {
        const target = child.attributes["Target"];
        if (!target) return void 0;
        return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
      }
    }
  }
  /**
  * Resolve a relationship rId from a worksheet-level rels file.
  * Worksheet rels paths: `xl/worksheets/sheet1.xml` → `xl/worksheets/_rels/sheet1.xml.rels`
  */
  resolveWorksheetRel(wsPath, rId) {
    return this.partRels.get(wsPath)?.get(rId);
  }
  /**
  * Get all relationships from a worksheet rels file matching a type fragment.
  * e.g. `getWorksheetRelsByType(path, "/comments")` returns all comment relationships.
  */
  getWorksheetRelsByType(wsPath, typeFragment) {
    const relsPath = partPathToRelsPath(wsPath);
    const rels = this.xlsx.doc.get(relsPath);
    if (!rels?.elements) return [];
    const result = [];
    for (const child of rels.elements) {
      if (child.name !== "Relationship") continue;
      const type = child.attributes?.["Type"];
      if (!type || !type.includes(typeFragment)) continue;
      const rId = child.attributes?.["Id"];
      const target = child.attributes?.["Target"];
      if (rId && target) result.push({
        rId,
        target: resolveRelationshipTarget(wsPath, target)
      });
    }
    return result;
  }
  getPart(path) {
    return this.xlsx.doc.get(path);
  }
  getRaw(path) {
    return this.xlsx.doc.getRaw(path);
  }
};
function sortByNumber(paths) {
  return paths.sort((a, b) => {
    return parseInt(a.match(/(\d+)/)?.[1] ?? "0", 10) - parseInt(b.match(/(\d+)/)?.[1] ?? "0", 10);
  });
}
var WORKSHEET_PARSE_OPTIONS = { deferElements: ["sheetData"] };
function parseXlsx(data) {
  const uint8 = toUint8Array(data);
  const doc = parseArchive(uint8);
  const workbook = doc.get("xl/workbook.xml");
  const styles = doc.get("xl/styles.xml");
  const sharedStrings = doc.get("xl/sharedStrings.xml");
  const worksheets = [];
  const charts = [];
  const drawings = [];
  const media = [];
  let theme;
  const wbRels = doc.get("xl/_rels/workbook.xml.rels");
  if (wbRels) for (const child of wbRels.elements ?? []) {
    if (child.name !== "Relationship") continue;
    const type = attr(child, "Type") ?? "";
    const target = attr(child, "Target") ?? "";
    if (!target) continue;
    if (type.includes("/worksheet")) worksheets.push(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
    else if (type.includes("/theme")) theme = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
  }
  sortByNumber(worksheets);
  drawings.push(...doc.keys("xl/drawings/").filter((k) => k.endsWith(".xml")));
  charts.push(...doc.keys("xl/charts/").filter((k) => k.endsWith(".xml")));
  media.push(...doc.keys("xl/media/"));
  sortByNumber(drawings);
  sortByNumber(charts);
  let coreProps;
  let appProps;
  let customProps;
  const rootRels = doc.get("_rels/.rels");
  if (rootRels) for (const child of rootRels.elements ?? []) {
    if (child.name !== "Relationship") continue;
    const type = attr(child, "Type") ?? "";
    const target = attr(child, "Target") ?? "";
    const relType = type.toLowerCase().replaceAll("-", "");
    if (relType.includes("/coreproperties")) coreProps = target;
    else if (relType.includes("/extendedproperties")) appProps = target;
    else if (relType.includes("/customproperties")) customProps = target;
  }
  return {
    doc,
    workbook,
    worksheets,
    styles,
    sharedStrings,
    theme,
    partRefs: {
      worksheets,
      charts,
      media,
      drawings
    },
    coreProps,
    appProps,
    customProps
  };
}
function parseWorkbook(data) {
  const uint8 = toUint8Array(data);
  if (isEncryptedContainer(uint8)) return { encrypted: { data: uint8 } };
  const xlsx = parseXlsx(uint8);
  const opts = {};
  if (xlsx.coreProps) {
    const corePropsEl = xlsx.doc.get(xlsx.coreProps);
    if (corePropsEl) {
      const cp = parseCorePropsElement(corePropsEl);
      Object.assign(opts, cp);
    }
  }
  if (xlsx.appProps) {
    const appPropsEl = xlsx.doc.get(xlsx.appProps);
    if (appPropsEl) {
      const ap = appPropertiesDesc.parse(appPropsEl, {});
      if (ap && Object.keys(ap).length > 0) opts.appProperties = ap;
    }
  }
  if (xlsx.customProps) {
    const customPropsEl = xlsx.doc.get(xlsx.customProps);
    if (customPropsEl) {
      const cp = customPropertiesDesc.parse(customPropsEl, {});
      if (cp.properties?.length) opts.customProperties = cp.properties;
    }
  }
  let sstEntries = [];
  if (xlsx.sharedStrings) sstEntries = sharedStringsDesc.parse(xlsx.sharedStrings, {}).entries;
  if (sstEntries.length > 0) opts.sharedStrings = sstEntries;
  const readContext = new XlsxReadContext(xlsx, sstEntries);
  const pivotCacheByPath = /* @__PURE__ */ new Map();
  for (const key of xlsx.doc.keys("xl/pivotCache/")) {
    if (!key.includes("pivotCacheDefinition")) continue;
    const pcdEl = xlsx.doc.get(key);
    if (!pcdEl) continue;
    pivotCacheByPath.set(key, pivotCacheDefDesc.parse(pcdEl, readContext));
  }
  const pivotCacheRefs = [];
  const wbPivotCaches = xlsx.workbook ? findChild(xlsx.workbook, "pivotCaches") : void 0;
  for (const pc of wbPivotCaches?.elements ?? []) {
    if (pc.name !== "pivotCache") continue;
    const cacheId = attr(pc, "cacheId");
    const rId = attr(pc, "r:id");
    if (cacheId === void 0 || rId === void 0) continue;
    pivotCacheRefs.push({
      cacheId: Number(cacheId),
      rId
    });
  }
  if (pivotCacheRefs.length > 0) opts.pivotCacheRefs = pivotCacheRefs;
  if (xlsx.styles) {
    const parsedStyles = stylesDesc.parse(xlsx.styles, readContext);
    if (parsedStyles.dxfs) opts.dxfs = parsedStyles.dxfs;
    opts.fonts = parsedStyles.fonts ?? [];
    opts.fills = parsedStyles.fills ?? [];
    opts.borders = parsedStyles.borders ?? [];
    opts.cellXfs = parsedStyles.cellXfs ?? [];
    if (parsedStyles.numFmts) opts.numFmts = parsedStyles.numFmts;
    if (parsedStyles.colors) opts.colors = parsedStyles.colors;
    if (parsedStyles.customCellStyles !== void 0) opts.cellStyles = parsedStyles.customCellStyles;
    if (parsedStyles.cellStyleXfs !== void 0) opts.cellStyleXfs = parsedStyles.cellStyleXfs;
    if (parsedStyles.styleExtensions) opts.styleExtensions = parsedStyles.styleExtensions;
    if (parsedStyles.tableStylesInfo) opts.tableStyles = parsedStyles.tableStylesInfo.tableStyles ?? [];
  }
  if (xlsx.theme) {
    const themeEl = xlsx.doc.get(xlsx.theme);
    if (themeEl) {
      const themeOptions = readContext.withPart(xlsx.theme, () => themeDesc.parse(themeEl, readContext));
      if (themeOptions) opts.theme = themeOptions;
    }
  }
  let sheetNames = [];
  let sheetIds = [];
  let sheetStates = [];
  if (xlsx.workbook) {
    const wbData = workbookDesc.parse(xlsx.workbook, readContext);
    if (wbData.sheets) {
      sheetNames = wbData.sheets.map((s) => s.name);
      sheetIds = wbData.sheets.map((s) => s.sheetId);
      sheetStates = wbData.sheets.map((s) => s.state);
    }
    if (wbData.protection) opts.workbookProtection = wbData.protection;
    if (wbData.bookView) opts.bookView = wbData.bookView;
    if (wbData.calcPr) opts.calcPr = wbData.calcPr;
    if (wbData.oleSize) opts.oleSize = wbData.oleSize;
    if (wbData.customViews) opts.customWorkbookViews = wbData.customViews;
    if (wbData.fileRecoveryPr) opts.fileRecoveryPr = wbData.fileRecoveryPr;
    if (wbData.functionGroups) opts.functionGroups = wbData.functionGroups;
    if (wbData.webPublishing) opts.webPublishing = wbData.webPublishing;
    if (wbData.fileSharing) opts.fileSharing = wbData.fileSharing;
    if (wbData.workbookPr) opts.workbookPr = wbData.workbookPr;
    if (wbData.webPublishObjects) opts.webPublishObjects = wbData.webPublishObjects;
    if (wbData.definedNames) opts.definedNames = wbData.definedNames;
    if (wbData.absPath !== void 0) opts.absPath = wbData.absPath;
    if (wbData.revisionPtr) opts.revisionPtr = wbData.revisionPtr;
    if (wbData.extensions) opts.extensions = wbData.extensions;
  }
  const worksheets = [];
  for (const [i, wsPath] of xlsx.worksheets.entries()) {
    const wsEl = xlsx.doc.get(wsPath, WORKSHEET_PARSE_OPTIONS);
    if (!wsEl) continue;
    const wsOpts = worksheetDesc.parse(wsEl, readContext);
    if (sheetNames[i]) wsOpts.name = sheetNames[i];
    if (sheetIds[i] !== void 0) wsOpts.sheetId = sheetIds[i];
    if (sheetStates[i]) wsOpts.state = sheetStates[i];
    const commentRels = readContext.getWorksheetRelsByType(wsPath, "/comments");
    for (const cr of commentRels) {
      const commentEl = xlsx.doc.get(cr.target);
      if (!commentEl) continue;
      const commentData = commentsDesc.parse(commentEl, readContext);
      if (commentData.comments) {
        wsOpts.comments = commentData.comments;
        break;
      }
    }
    const vmlRels = readContext.getWorksheetRelsByType(wsPath, "/vmlDrawing");
    for (const vr of vmlRels) {
      const vmlEl = xlsx.doc.get(vr.target);
      if (!vmlEl) continue;
      mergeNoteAnchors(wsOpts.comments, vmlNotesDesc.parse(vmlEl, readContext));
      break;
    }
    const drawingRels = readContext.getWorksheetRelsByType(wsPath, "/drawing");
    for (const dr of drawingRels) {
      const drawingEl = xlsx.doc.get(dr.target);
      if (!drawingEl) continue;
      const drawingRelById = /* @__PURE__ */ new Map();
      const drawingRelsEl = xlsx.doc.get(partPathToRelsPath(dr.target));
      for (const rel of drawingRelsEl?.elements ?? []) {
        if (rel.name !== "Relationship") continue;
        const id = rel.attributes?.["Id"];
        const target = rel.attributes?.["Target"];
        if (id === void 0 || target === void 0) continue;
        const mode = rel.attributes?.["TargetMode"] !== void 0 ? String(rel.attributes["TargetMode"]) : void 0;
        drawingRelById.set(String(id), {
          target: String(target),
          mode
        });
      }
      const drawingData = drawingDesc.parse(drawingEl, {
        resolveRelationship: (rid) => {
          const rel = drawingRelById.get(rid);
          if (!rel) return readContext.resolveRelationship(rid);
          return rel.mode === "External" ? rel.target : resolveRelationshipTarget(dr.target, rel.target);
        },
        getPart: (path) => readContext.getPart(path),
        getRaw: (path) => readContext.getRaw(path)
      });
      if (drawingData.images) {
        const images = [];
        for (const image of drawingData.images) {
          const linkRel = image.linkRId ? drawingRelById.get(image.linkRId) : void 0;
          const sourceUrl = linkRel?.mode === "External" ? linkRel.target : void 0;
          const mediaPath = image.rId ? readContext.resolveWorksheetRel(dr.target, image.rId) : void 0;
          const raw = mediaPath ? xlsx.doc.getRaw(mediaPath) : void 0;
          const ext = mediaPath?.split(".").pop();
          if (!raw || ext !== "png" && ext !== "jpeg" && ext !== "jpg" && ext !== "wmf" && ext !== "emf") {
            if (sourceUrl !== void 0) {
              const linkExt = sourceUrl.split(".").pop()?.toLowerCase() ?? "";
              images.push({
                type: linkExt === "wmf" ? "wmf" : linkExt === "emf" ? "emf" : linkExt === "jpg" || linkExt === "jpeg" ? "jpg" : "png",
                sourceUrl,
                ...pickAnchorOptions(image),
                name: image.name,
                description: image.description,
                title: image.title,
                hidden: image.hidden,
                ...image.spPr ? { spPr: image.spPr } : {},
                ...image.blackWhiteMode ? { blackWhiteMode: image.blackWhiteMode } : {},
                ...image.sourceRectangle ? { sourceRectangle: image.sourceRectangle } : {},
                ...image.preferRelativeResize !== void 0 ? { preferRelativeResize: image.preferRelativeResize } : {},
                ...image.blipEffects ? { blipEffects: image.blipEffects } : {},
                ...image.useLocalDpi !== void 0 ? { useLocalDpi: image.useLocalDpi } : {},
                ...image.blipExt !== void 0 ? { blipExt: image.blipExt } : {},
                ...image.locking ? { locking: image.locking } : {},
                ...image.hyperlink ? { hyperlink: image.hyperlink } : {},
                ...image.zOrder !== void 0 ? { zOrder: image.zOrder } : {},
                ...image.shapeId !== void 0 ? { shapeId: image.shapeId } : {}
              });
            }
            continue;
          }
          const type = ext === "png" ? "png" : ext === "wmf" ? "wmf" : ext === "emf" ? "emf" : "jpg";
          images.push({
            data: raw,
            type,
            ...sourceUrl !== void 0 ? { sourceUrl } : {},
            ...pickAnchorOptions(image),
            name: image.name,
            description: image.description,
            title: image.title,
            hidden: image.hidden,
            ...image.spPr ? { spPr: image.spPr } : {},
            ...image.blackWhiteMode ? { blackWhiteMode: image.blackWhiteMode } : {},
            ...image.sourceRectangle ? { sourceRectangle: image.sourceRectangle } : {},
            ...image.preferRelativeResize !== void 0 ? { preferRelativeResize: image.preferRelativeResize } : {},
            ...image.blipEffects ? { blipEffects: image.blipEffects } : {},
            ...image.useLocalDpi !== void 0 ? { useLocalDpi: image.useLocalDpi } : {},
            ...image.blipExt !== void 0 ? { blipExt: image.blipExt } : {},
            ...image.locking ? { locking: image.locking } : {},
            ...image.hyperlink ? { hyperlink: image.hyperlink } : {},
            ...image.zOrder !== void 0 ? { zOrder: image.zOrder } : {},
            ...image.shapeId !== void 0 ? { shapeId: image.shapeId } : {}
          });
        }
        if (images.length > 0) wsOpts.images = images;
      }
      if (drawingData.charts) {
        const charts = [];
        for (const anchor of drawingData.charts) {
          const chartPath = readContext.resolveWorksheetRel(dr.target, anchor.rId);
          const chartEl = chartPath ? xlsx.doc.get(chartPath) : void 0;
          if (!chartEl) continue;
          const chartSpace = chartSpaceDesc.parse(chartEl, readContext);
          const chartCnvPr = pickNonVisualDrawingProperties(anchor);
          delete chartCnvPr.title;
          charts.push({
            ...chartSpace,
            ...pickAnchorOptions(anchor),
            ...chartCnvPr,
            ...anchor.frameLocks ? { frameLocks: anchor.frameLocks } : {},
            ...anchor.macro !== void 0 ? { macro: anchor.macro } : {},
            ...anchor.hyperlink ? { hyperlink: anchor.hyperlink } : {},
            ...anchor.zOrder !== void 0 ? { zOrder: anchor.zOrder } : {},
            ...anchor.shapeId !== void 0 ? { shapeId: anchor.shapeId } : {}
          });
        }
        if (charts.length > 0) wsOpts.charts = charts;
      }
      if (drawingData.smartArts) {
        const smartArts = [];
        for (const anchor of drawingData.smartArts) {
          const dataPath = readContext.resolveWorksheetRel(dr.target, anchor.dataRId);
          const layoutPath = readContext.resolveWorksheetRel(dr.target, anchor.layoutRId);
          const quickStylePath = readContext.resolveWorksheetRel(dr.target, anchor.quickStyleRId);
          const colorsPath = readContext.resolveWorksheetRel(dr.target, anchor.colorsRId);
          if (!dataPath || !layoutPath || !quickStylePath || !colorsPath) continue;
          smartArts.push({
            ...pickAnchorOptions(anchor),
            ...pickNonVisualDrawingProperties(anchor),
            dataPath,
            layoutPath,
            quickStylePath,
            colorsPath,
            ...anchor.frameLocks ? { frameLocks: anchor.frameLocks } : {},
            ...anchor.macro !== void 0 ? { macro: anchor.macro } : {},
            ...anchor.zOrder !== void 0 ? { zOrder: anchor.zOrder } : {},
            ...anchor.shapeId !== void 0 ? { shapeId: anchor.shapeId } : {}
          });
        }
        if (smartArts.length > 0) wsOpts.smartArts = smartArts;
      }
      if (drawingData.shapes) wsOpts.shapes = drawingData.shapes;
      if (drawingData.connectors) wsOpts.connectors = drawingData.connectors;
      if (drawingData.groups) wsOpts.groups = drawingData.groups;
      break;
    }
    const bgRels = readContext.getWorksheetRelsByType(wsPath, "/image");
    for (const bg of bgRels) {
      const raw = xlsx.doc.getRaw(bg.target);
      const ext = bg.target.split(".").pop();
      if (!raw || ext !== "png" && ext !== "jpeg" && ext !== "jpg") continue;
      wsOpts.backgroundImage = {
        data: raw,
        type: ext === "png" ? "png" : "jpg"
      };
      break;
    }
    const tableRels = readContext.getWorksheetRelsByType(wsPath, "/table");
    if (tableRels.length > 0) {
      const tables = [];
      for (const tr of tableRels) {
        const tableEl = xlsx.doc.get(tr.target);
        if (!tableEl) continue;
        if (tableEl.name !== "table") continue;
        const tableData = tableDesc.parse(tableEl, readContext);
        tables.push(tableData);
      }
      if (tables.length > 0) wsOpts.tables = tables;
    }
    const queryTableRels = readContext.getWorksheetRelsByType(wsPath, "/queryTable");
    if (queryTableRels.length > 0) {
      const queryTables = [];
      for (const qtr of queryTableRels) {
        const qtEl = xlsx.doc.get(qtr.target);
        if (!qtEl) continue;
        queryTables.push(queryTableDesc.parse(qtEl, readContext));
      }
      if (queryTables.length > 0) wsOpts.queryTables = queryTables;
    }
    const singleXmlCellRels = readContext.getWorksheetRelsByType(wsPath, "/tableSingleCells");
    if (singleXmlCellRels.length > 0) {
      const singleXmlCells = [];
      for (const sxr of singleXmlCellRels) {
        const sxEl = xlsx.doc.get(sxr.target);
        if (!sxEl) continue;
        singleXmlCells.push(...singleXmlCellsDesc.parse(sxEl, readContext).cells);
      }
      if (singleXmlCells.length > 0) wsOpts.singleXmlCells = singleXmlCells;
    }
    const hyperlinks = wsOpts.hyperlinks;
    if (hyperlinks) {
      for (const hl of hyperlinks) if (hl.url !== void 0) {
        const resolved = readContext.resolveWorksheetRel(wsPath, hl.url);
        if (resolved) hl.url = resolved;
      }
    }
    worksheets.push(wsOpts);
  }
  opts.worksheets = worksheets;
  const chartsheetPaths = sortByNumber(xlsx.doc.keys("xl/chartsheets/").filter((k) => k.endsWith(".xml")));
  if (chartsheetPaths.length > 0) {
    const chartsheets = [];
    for (const [i, csPath] of chartsheetPaths.entries()) {
      const csEl = xlsx.doc.get(csPath);
      if (!csEl) continue;
      const csData = chartsheetDesc.parse(csEl, readContext);
      if (sheetNames[worksheets.length + i]) csData.name = sheetNames[worksheets.length + i];
      if (sheetIds[worksheets.length + i] !== void 0) csData.sheetId = sheetIds[worksheets.length + i];
      if (sheetStates[worksheets.length + i]) csData.state = sheetStates[worksheets.length + i];
      const csDrawingRels = readContext.getWorksheetRelsByType(csPath, "/drawing");
      outer: for (const dr of csDrawingRels) {
        const drawingEl = xlsx.doc.get(dr.target);
        if (!drawingEl) continue;
        const drawingData = drawingDesc.parse(drawingEl, readContext);
        for (const anchor of drawingData.charts ?? []) {
          const chartPath = readContext.resolveWorksheetRel(dr.target, anchor.rId);
          const chartEl = chartPath ? xlsx.doc.get(chartPath) : void 0;
          if (!chartEl) continue;
          csData.chart = chartSpaceDesc.parse(chartEl, readContext);
          if (anchor.macro !== void 0) csData.macro = anchor.macro;
          if (anchor.frameLocks) csData.frameLocks = anchor.frameLocks;
          if (anchor.absoluteX !== void 0) csData.absoluteX = convertToEmu(anchor.absoluteX);
          if (anchor.absoluteY !== void 0) csData.absoluteY = convertToEmu(anchor.absoluteY);
          if (anchor.extentCx !== void 0) csData.extentCx = convertToEmu(anchor.extentCx);
          if (anchor.extentCy !== void 0) csData.extentCy = convertToEmu(anchor.extentCy);
          if (anchor.shapeId !== void 0) csData.shapeId = anchor.shapeId;
          break outer;
        }
      }
      chartsheets.push(csData);
    }
    if (chartsheets.length > 0) opts.chartsheets = chartsheets;
  }
  const dialogsheetPaths = xlsx.doc.keys("xl/dialogSheets/").filter((k) => k.endsWith(".xml"));
  if (dialogsheetPaths.length > 0) {
    const dialogsheets = [];
    for (const dsPath of dialogsheetPaths) {
      const dsEl = xlsx.doc.get(dsPath);
      if (!dsEl) continue;
      const dsData = dialogsheetDesc.parse(dsEl, readContext);
      dialogsheets.push(dsData);
    }
    if (dialogsheets.length > 0) opts.dialogsheets = dialogsheets;
  }
  if (pivotCacheByPath.size > 0) opts.pivotCaches = [...pivotCacheByPath.values()];
  const pivotCacheRecPaths = xlsx.doc.keys("xl/pivotCache/").filter((k) => k.includes("pivotCacheRecords"));
  if (pivotCacheRecPaths.length > 0) {
    const pivotCacheRecords = [];
    for (const pcrPath of pivotCacheRecPaths) {
      const pcrEl = xlsx.doc.get(pcrPath);
      if (!pcrEl) continue;
      const pcrData = pivotCacheRecordsDesc.parse(pcrEl, readContext);
      pivotCacheRecords.push(pcrData);
    }
    if (pivotCacheRecords.length > 0) opts.pivotCacheRecords = pivotCacheRecords;
  }
  const calcChainEl = xlsx.doc.get("xl/calcChain.xml");
  if (calcChainEl) {
    const calcData = calcChainDesc.parse(calcChainEl, readContext);
    if (calcData.cells) opts.calcChain = calcData.cells;
  }
  const connectionsEl = xlsx.doc.get("xl/connections.xml");
  if (connectionsEl) {
    const connData = connectionsDesc.parse(connectionsEl, readContext);
    if (connData.connections.length > 0) opts.connections = connData.connections;
  }
  const metadataEl = xlsx.doc.get("xl/metadata.xml");
  if (metadataEl) opts.metadata = metadataDesc.parse(metadataEl, readContext);
  const xmlMapsEl = xlsx.doc.get("xl/xmlMaps.xml");
  if (xmlMapsEl) opts.xmlMaps = mapInfoDesc.parse(xmlMapsEl, readContext);
  const volTypesEl = xlsx.doc.get("xl/volTypes.xml");
  if (volTypesEl) {
    const volTypes = parseVolTypesEl(volTypesEl);
    if (volTypes.length > 0) opts.volTypes = volTypes;
  }
  const extLinkPaths = xlsx.doc.keys("xl/externalLinks/").filter((k) => k.endsWith(".xml"));
  if (extLinkPaths.length > 0) {
    const externalLinks = [];
    for (const elPath of extLinkPaths) {
      const elEl = xlsx.doc.get(elPath);
      if (!elEl) continue;
      const elData = externalLinkDesc.parse(elEl, readContext);
      if (elData.externalBook) {
        const relsPath = partPathToRelsPath(elPath);
        const relsEl = xlsx.doc.get(relsPath);
        if (relsEl) for (const child of relsEl.elements ?? []) {
          if (child.name !== "Relationship") continue;
          if (!(attr(child, "Type") ?? "").includes("/externalLinkPath")) continue;
          const target = attr(child, "Target");
          if (target) {
            elData.externalBook.target = target;
            break;
          }
        }
      }
      externalLinks.push(elData);
    }
    if (externalLinks.length > 0) opts.externalLinks = externalLinks;
  }
  const wbRelsEl2 = xlsx.doc.get("xl/_rels/workbook.xml.rels");
  let revHeadersTarget;
  let usersTarget;
  if (wbRelsEl2) for (const child of wbRelsEl2.elements ?? []) {
    if (child.name !== "Relationship") continue;
    const type = attr(child, "Type") ?? "";
    const target = attr(child, "Target") ?? "";
    if (type.includes("/revisionHeaders")) revHeadersTarget = target;
    else if (type.includes("/users")) usersTarget = target;
  }
  if (revHeadersTarget) {
    const headersPath = revHeadersTarget.startsWith("/") ? revHeadersTarget.slice(1) : `xl/${revHeadersTarget}`;
    const headersEl = xlsx.doc.get(headersPath);
    if (headersEl) {
      const headers = revisionHeadersDesc.parse(headersEl, readContext);
      const logs = [];
      const revHeadersRelsEl = xlsx.doc.get(partPathToRelsPath(headersPath));
      if (revHeadersRelsEl) for (const child of revHeadersRelsEl.elements ?? []) {
        if (child.name !== "Relationship") continue;
        if (!(attr(child, "Type") ?? "").includes("/revisionLog")) continue;
        const t = attr(child, "Target");
        if (!t) continue;
        const logEl = xlsx.doc.get(t.startsWith("/") ? t.slice(1) : `xl/${t}`);
        if (logEl) logs.push(revisionLogDesc.parse(logEl, readContext));
      }
      const revisionLog = {
        headers,
        logs
      };
      if (usersTarget) {
        const usersEl = xlsx.doc.get(usersTarget.startsWith("/") ? usersTarget.slice(1) : `xl/${usersTarget}`);
        if (usersEl) {
          const users = usersDesc.parse(usersEl, readContext);
          if (users.users) revisionLog.users = users;
        }
      }
      opts.revisionLog = revisionLog;
    }
  }
  const rebuilt = [
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    ...xlsx.styles ? ["xl/styles.xml"] : [],
    ...xlsx.coreProps ? [xlsx.coreProps] : [],
    ...xlsx.appProps ? [xlsx.appProps] : [],
    ...xlsx.customProps ? [xlsx.customProps] : [],
    ...xlsx.worksheets,
    ...chartsheetPaths,
    ...dialogsheetPaths
  ];
  const { parts: passthroughParts, relationships: passthroughRels } = collectPassthroughParts(xlsx.doc, rebuilt);
  if (passthroughParts.length > 0) opts.rawParts = passthroughParts;
  if (passthroughRels.length > 0) opts.passthroughRelationships = passthroughRels;
  const sourceContentTypes = xlsx.doc.get("[Content_Types].xml");
  if (sourceContentTypes) {
    const ct = contentTypesDesc.parse(sourceContentTypes, {});
    if (ct) opts.contentTypes = ct;
  }
  return opts;
}
var encoder$1 = new TextEncoder();
var XML_DECL = OOXML_XML_DECLARATION;
var IMAGE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image";
function bindMediaPlaceholders(xml, media, rels) {
  const names = new Set(media.array.map((m) => m.fileName));
  let usesMedia = false;
  for (const name of names) if (xml.includes(`{${name}}`)) {
    usesMedia = true;
    break;
  }
  if (!usesMedia) return xml;
  const ridByName = /* @__PURE__ */ new Map();
  return xml.replace(/\{([^{}]+)\}/g, (whole, name) => {
    let rid = ridByName.get(name);
    if (rid === void 0) {
      if (!names.has(name)) return whole;
      rid = `rId${rels.add(IMAGE_REL, `../media/${name}`)}`;
      ridByName.set(name, rid);
    }
    return rid;
  });
}
var XLSX_CONTENT_TYPE_RESOLVER$1 = resolverFromRegistry(XLSX_PARTS);
var XLSX_MEDIA_CONTENT_TYPES = {
  ...IMAGE_MEDIA_CONTENT_TYPES,
  vml: "application/vnd.openxmlformats-officedocument.vmlDrawing"
};
var encoder2 = new TextEncoder();
function compileWorkbook(options, overrides = [], mediaLevel = 0) {
  const ctx = new XlsxWriteContext();
  const mapping = {};
  if (options.sharedStrings) ctx.sharedStrings.loadEntries(options.sharedStrings);
  const worksheetConfigs = options.worksheets ?? [];
  const chartsheetConfigs = options.chartsheets ?? [];
  const dialogsheetConfigs = options.dialogsheets ?? [];
  const hasCustomProperties = !!options.customProperties && options.customProperties.length > 0;
  mapping["Properties"] = {
    data: XML_DECL + buildCorePropertiesXmlString(options),
    path: "docProps/core.xml"
  };
  mapping["AppProperties"] = {
    data: XML_DECL + (appPropertiesDesc.stringify(options.appProperties ?? {}, ctx) ?? ""),
    path: "docProps/app.xml"
  };
  if (hasCustomProperties) mapping["CustomProperties"] = {
    data: XML_DECL + (customPropertiesDesc.stringify({ properties: options.customProperties ?? [] }, ctx) ?? ""),
    path: "docProps/custom.xml"
  };
  const fileRels = buildRootRelationships("xl/workbook.xml", hasCustomProperties, options.passthroughRelationships);
  mapping["FileRelationships"] = {
    data: XML_DECL + fileRels.serialize(),
    path: "_rels/.rels"
  };
  if (options.dxfs !== void 0) ctx.styles.setDxfs(options.dxfs);
  if (options.fonts !== void 0) ctx.styles.adopt({
    fonts: options.fonts,
    fills: options.fills ?? [],
    borders: options.borders ?? [],
    cellXfs: options.cellXfs ?? [],
    numFmts: options.numFmts
  });
  if (options.colors) ctx.styles.setColors(options.colors);
  if (options.tableStyles) ctx.styles.setTableStyles(options.tableStyles);
  if (options.cellStyles !== void 0) ctx.styles.setCustomCellStyles(options.cellStyles);
  if (options.cellStyleXfs !== void 0) ctx.styles.setCellStyleXfs(options.cellStyleXfs);
  if (options.styleExtensions) ctx.styles.setExtensions(options.styleExtensions);
  buildWorkbookRelationships(ctx.workbookRels, worksheetConfigs.length, chartsheetConfigs.length, dialogsheetConfigs.length);
  const sheets = [];
  let sheetId = 1;
  const nextSheetId = (explicit) => {
    const id = explicit ?? sheetId;
    if (id >= sheetId) sheetId = id + 1;
    return id;
  };
  let rId = 1;
  for (const ws of worksheetConfigs) sheets.push({
    name: ws.name ?? `Sheet${sheetId}`,
    sheetId: nextSheetId(ws.sheetId),
    state: ws.state,
    rId: `rId${rId++}`
  });
  for (const cs of chartsheetConfigs) sheets.push({
    name: cs.name ?? `Chart${sheetId}`,
    sheetId: nextSheetId(cs.sheetId),
    state: cs.state,
    rId: `rId${rId++}`
  });
  for (const ds of dialogsheetConfigs) sheets.push({
    name: ds.name ?? `Dialog${sheetId}`,
    sheetId: nextSheetId(ds.sheetId),
    state: ds.state,
    rId: `rId${rId++}`
  });
  const wsContext = {
    sharedStrings: ctx.sharedStrings,
    styles: ctx.styles
  };
  const state = {
    globalMediaIdx: 0,
    globalChartIdx: 0,
    globalPivotIdx: 0,
    globalPivotCacheIdx: 0,
    globalTableIdx: 0,
    globalQueryTableIdx: 0,
    globalSingleXmlCellsIdx: 0,
    pivotCacheDataMap: /* @__PURE__ */ new Map(),
    calcCells: [],
    allTableParts: []
  };
  for (const [i, wsOpts] of worksheetConfigs.entries()) compileWorksheetPart(wsOpts, i, worksheetConfigs, ctx, mapping, wsContext, state, options.passthroughRelationships);
  compileChartsheets(chartsheetConfigs, ctx, mapping, options.passthroughRelationships);
  compileDialogsheets(dialogsheetConfigs, ctx, mapping);
  let rtPivotRefs;
  if (options.pivotCacheRefs && options.pivotCacheRefs.length > 0) {
    rtPivotRefs = [];
    for (const ref of options.pivotCacheRefs) {
      const rel = (options.passthroughRelationships ?? []).find((r) => r.source === "xl/workbook.xml" && r.rId === ref.rId);
      if (!rel) continue;
      let rid = ctx.workbookRels.idOf(rel.relationshipType, rel.target);
      if (rid === void 0) {
        ctx.workbookRels.add(rel.relationshipType, rel.target);
        rid = ctx.workbookRels.idOf(rel.relationshipType, rel.target);
      }
      if (rid) rtPivotRefs.push({
        cacheId: ref.cacheId,
        rId: rid
      });
    }
  }
  let wbXml = workbookDesc.stringify({
    sheets,
    pivotCaches: ctx.pivotCacheRefs.length > 0 ? ctx.pivotCacheRefs : rtPivotRefs ?? [],
    protection: options.workbookProtection,
    customViews: options.customWorkbookViews,
    fileRecoveryPr: options.fileRecoveryPr,
    functionGroups: options.functionGroups,
    webPublishing: options.webPublishing,
    fileSharing: options.fileSharing,
    webPublishObjects: options.webPublishObjects,
    definedNames: options.definedNames,
    workbookPr: options.workbookPr,
    calcPr: options.calcPr,
    oleSize: options.oleSize,
    bookView: options.bookView,
    ...options.absPath !== void 0 ? { absPath: options.absPath } : {},
    ...options.revisionPtr ? { revisionPtr: options.revisionPtr } : {},
    ...options.extensions ? { extensions: options.extensions } : {}
  }, ctx) ?? "";
  if (options.connections && options.connections.length > 0) {
    const cRid = ctx.workbookRels.nextRelationshipId;
    ctx.workbookRels.addRelationship(cRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/connections", "connections.xml");
    mapping["Connections"] = {
      data: XML_DECL + connectionsDesc.stringify({ connections: options.connections }, ctx),
      path: "xl/connections.xml"
    };
  }
  if (options.metadata && hasMetadataContent(options.metadata)) {
    const mRid = ctx.workbookRels.nextRelationshipId;
    ctx.workbookRels.addRelationship(mRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sheetMetadata", "metadata.xml");
    mapping["Metadata"] = {
      data: XML_DECL + metadataDesc.stringify(options.metadata, ctx),
      path: "xl/metadata.xml"
    };
  }
  if (options.xmlMaps) {
    const xRid = ctx.workbookRels.nextRelationshipId;
    ctx.workbookRels.addRelationship(xRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/xmlMaps", "xmlMaps.xml");
    mapping["XmlMaps"] = {
      data: XML_DECL + mapInfoDesc.stringify(options.xmlMaps, ctx),
      path: "xl/xmlMaps.xml"
    };
  }
  if (options.volTypes && options.volTypes.length > 0) {
    const vRid = ctx.workbookRels.nextRelationshipId;
    ctx.workbookRels.addRelationship(vRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/volTypes", "volTypes.xml");
    mapping["VolTypes"] = {
      data: XML_DECL + buildVolTypesXml(options.volTypes),
      path: "xl/volTypes.xml"
    };
  }
  const extLinks = options.externalLinks ?? [];
  if (extLinks.length > 0) {
    const extRefs = [];
    for (let ei = 0; ei < extLinks.length; ei++) {
      const elIdx = ei + 1;
      const elRid = ctx.workbookRels.nextRelationshipId;
      ctx.workbookRels.addRelationship(elRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink", `externalLinks/externalLink${elIdx}.xml`);
      const elOpts = extLinks[ei];
      if (!elOpts) continue;
      let bookRId;
      if (elOpts.externalBook?.target) {
        const elRels = new Relationships();
        elRels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLinkPath", elOpts.externalBook.target, TargetModeType.EXTERNAL);
        bookRId = "rId1";
        mapping[`ExternalLinkRels${elIdx}`] = {
          data: XML_DECL + elRels.serialize(),
          path: `xl/externalLinks/_rels/externalLink${elIdx}.xml.rels`
        };
      }
      mapping[`ExternalLink${elIdx}`] = {
        data: XML_DECL + externalLinkDesc.stringify({
          ...elOpts,
          bookRId
        }, ctx),
        path: `xl/externalLinks/externalLink${elIdx}.xml`
      };
      extRefs.push({ rId: `rId${elRid}` });
    }
    const extRefsXml = buildExternalReferencesXml(extRefs);
    wbXml = wbXml.replace("<!--EXTERNAL_REFS-->", extRefsXml);
  } else wbXml = wbXml.replace("<!--EXTERNAL_REFS-->", "");
  mapping["Workbook"] = {
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${wbXml}`,
    path: "xl/workbook.xml"
  };
  if (ctx.sharedStrings.count > 0) {
    ctx.workbookRels.addRelationship(ctx.workbookRels.nextRelationshipId, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings", "sharedStrings.xml");
    mapping["SharedStrings"] = {
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${sharedStringsDesc.stringify(ctx.sharedStrings.toDescriptorOptions(), ctx)}`,
      path: "xl/sharedStrings.xml"
    };
  }
  mapping["Styles"] = {
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${stylesDesc.stringify({ styles: ctx.styles }, ctx)}`,
    path: "xl/styles.xml"
  };
  const themeRels = new Relationships();
  const themeXml = options.theme ? bindMediaPlaceholders(buildThemeXml(options.theme, ctx), ctx.media, themeRels) : createThemeXml();
  mapping["Theme"] = {
    data: XML_DECL + themeXml,
    path: "xl/theme/theme1.xml"
  };
  if (themeRels.relationshipCount > 0) mapping["ThemeRels"] = {
    data: XML_DECL + themeRels.serialize(),
    path: "xl/theme/_rels/theme1.xml.rels"
  };
  for (const [i, chartData] of ctx.charts.array.entries()) mapping[`Chart${i}`] = {
    data: XML_DECL + chartData.chartSpaceXml,
    path: `xl/charts/chart${i + 1}.xml`
  };
  const calcChainCells = options.calcChain ?? state.calcCells;
  const srcReferencesCalcChain = (options.passthroughRelationships ?? []).some((r) => r.source === "xl/workbook.xml" && r.relationshipType.endsWith("/calcChain"));
  if (calcChainCells.length > 0 && !(srcReferencesCalcChain && options.calcChain === void 0)) {
    mapping["CalcChain"] = {
      data: calcChainDesc.stringify({ cells: calcChainCells }, ctx) ?? "",
      path: "xl/calcChain.xml"
    };
    const calcChainRid = ctx.workbookRels.nextRelationshipId;
    ctx.workbookRels.addRelationship(calcChainRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/calcChain", "calcChain.xml");
  }
  if (options.revisionLog) compileRevisionLogs(options.revisionLog, ctx, mapping);
  for (const rel of options.passthroughRelationships ?? []) {
    if (rel.source !== "xl/workbook.xml") continue;
    if (ctx.workbookRels.hasRelationship(rel.relationshipType, rel.target)) continue;
    ctx.workbookRels.add(rel.relationshipType, rel.target);
  }
  mapping["WorkbookRelationships"] = {
    data: XML_DECL + ctx.workbookRels.serialize(),
    path: "xl/_rels/workbook.xml.rels"
  };
  const mediaFiles = [];
  for (const img of ctx.media.array) mediaFiles.push({
    data: img.data,
    path: `xl/media/${img.fileName}`
  });
  const files = compileMapping(mapping, overrides, mediaFiles, mediaLevel);
  const passthroughSkipped = /* @__PURE__ */ new Set();
  for (const part of options.rawParts ?? []) {
    if (files[part.path] !== void 0) {
      passthroughSkipped.add(part.path);
      continue;
    }
    files[part.path] = toUint8Array(part.data);
  }
  const contentTypesInput = deriveContentTypes(Object.keys(files), {
    resolve: XLSX_CONTENT_TYPE_RESOLVER$1,
    mediaContentTypes: XLSX_MEDIA_CONTENT_TYPES,
    source: options.contentTypes,
    verbatimPaths: new Set((options.rawParts ?? []).map((p) => p.path))
  });
  const coveredExt = new Set(contentTypesInput.defaults.map((d) => d.extension.toLowerCase()));
  for (const part of options.rawParts ?? []) {
    if (part.contentType === void 0 || passthroughSkipped.has(part.path)) continue;
    const dot = part.path.lastIndexOf(".");
    const ext = dot > part.path.lastIndexOf("/") ? part.path.slice(dot + 1).toLowerCase() : void 0;
    if (ext && coveredExt.has(ext)) continue;
    contentTypesInput.overrides.push({
      partName: `/${part.path}`,
      contentType: part.contentType
    });
  }
  files["[Content_Types].xml"] = encoder2.encode(XML_DECL + (contentTypesDesc.stringify(contentTypesInput, ctx) ?? ""));
  dropDanglingPassthroughRels(files, options.passthroughRelationships);
  return files;
}
function compileWorksheetPart(wsOpts, i, worksheetConfigs, ctx, mapping, wsContext, state, passthroughRelationships) {
  const imgOpts = wsOpts.images ?? [];
  const chartOpts = wsOpts.charts ?? [];
  const smartArtOpts = wsOpts.smartArts ?? [];
  const shapeOpts = wsOpts.shapes ?? [];
  const connectorOpts = wsOpts.connectors ?? [];
  const groupOpts = wsOpts.groups ?? [];
  const hlOpts = wsOpts.hyperlinks ?? [];
  const sheetName = wsOpts.name ?? `Sheet${i + 1}`;
  let sheetXml = stringifyWorksheet(wsOpts, wsContext);
  const sheetIdx = wsOpts.sheetId ?? i + 1;
  const wsRows = wsOpts.rows ?? [];
  for (let ri = 0; ri < wsRows.length; ri++) {
    const rowOpts = wsRows[ri];
    const rowNumber = rowOpts.rowNumber ?? ri + 1;
    const cells = rowOpts.cells;
    if (!cells) continue;
    for (let ci = 0; ci < cells.length; ci++) {
      const cell = cells[ci];
      if (!cell.formula) continue;
      const ref = cell.reference ?? columnToLetter(ci + 1) + rowNumber;
      state.calcCells.push({
        reference: ref,
        sheetIndex: sheetIdx,
        array: typeof cell.formula === "object" && cell.formula.type === "array"
      });
    }
  }
  const hasMedia = imgOpts.length > 0 || chartOpts.length > 0 || smartArtOpts.length > 0 || shapeOpts.length > 0 || connectorOpts.length > 0 || groupOpts.length > 0;
  const hasExternalHyperlinks = hlOpts.some((h) => h.url !== void 0);
  const commentOpts = wsOpts.comments ?? [];
  const hasComments = commentOpts.length > 0;
  const pivotOpts = wsOpts.pivotTables ?? [];
  const hasPivots = pivotOpts.length > 0;
  const tableOpts = wsOpts.tables ?? [];
  const hasTables = tableOpts.length > 0;
  const queryTableOpts = wsOpts.queryTables ?? [];
  const hasQueryTables = queryTableOpts.length > 0;
  const singleXmlCellOpts = wsOpts.singleXmlCells ?? [];
  const bgImg = wsOpts.backgroundImage;
  let wsRels;
  let nextRid = 0;
  if (hasMedia || hasExternalHyperlinks || hasComments || hasPivots || hasTables || hasQueryTables || singleXmlCellOpts.length > 0 || bgImg) wsRels = new Relationships();
  if (hasExternalHyperlinks) for (const hl of hlOpts) {
    if (hl.url === void 0) continue;
    const rid = ++nextRid;
    wsRels.addRelationship(rid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", hl.url, "External");
  }
  if (hasMedia) {
    const drawingImages = [];
    const drawingCharts = [];
    const drawingSmartArts = [];
    const drawingRels = new Relationships();
    let rid = 1;
    for (const img of imgOpts) {
      let embedRid;
      let linkRid;
      if (img.data !== void 0) {
        const ext = img.type === "jpg" ? "jpeg" : img.type;
        const rawBytes = toUint8Array(img.data, { encoding: "base64" });
        const target = `../media/${ctx.media.addMedia(rawBytes, ext, (fileName) => ({
          fileName,
          type: ext,
          data: rawBytes,
          width: 0,
          height: 0
        })).fileName}`;
        embedRid = drawingRels.idOf(IMAGE_REL, target);
        if (embedRid === void 0) {
          drawingRels.addRelationship(rid, IMAGE_REL, target);
          embedRid = `rId${rid}`;
          rid++;
        }
        state.globalMediaIdx++;
      }
      if (img.sourceUrl !== void 0) {
        drawingRels.addRelationship(rid, IMAGE_REL, img.sourceUrl, "External");
        linkRid = `rId${rid}`;
        rid++;
      }
      drawingImages.push({
        ...pickAnchorOptions(img),
        rId: embedRid ?? "",
        ...linkRid ? { linkRId: linkRid } : {},
        ...pickNonVisualDrawingProperties(img),
        ...img.spPr ? { spPr: img.spPr } : {},
        ...img.blackWhiteMode ? { blackWhiteMode: img.blackWhiteMode } : {},
        ...img.sourceRectangle ? { sourceRectangle: img.sourceRectangle } : {},
        ...img.preferRelativeResize !== void 0 ? { preferRelativeResize: img.preferRelativeResize } : {},
        ...img.blipEffects ? { blipEffects: img.blipEffects } : {},
        ...img.useLocalDpi !== void 0 ? { useLocalDpi: img.useLocalDpi } : {},
        ...img.blipExt !== void 0 ? { blipExt: img.blipExt } : {},
        ...img.locking ? { locking: img.locking } : {},
        ...img.hyperlink ? { hyperlink: img.hyperlink } : {},
        ...img.zOrder !== void 0 ? { zOrder: img.zOrder } : {},
        ...img.shapeId !== void 0 ? { shapeId: img.shapeId } : {}
      });
    }
    for (const chart of chartOpts) {
      const chartKey = `chart_${state.globalChartIdx}`;
      ctx.charts.addChart(chartKey, {
        key: chartKey,
        chartSpaceXml: chartSpaceDesc.stringify(chart, ctx) ?? ""
      });
      drawingRels.addRelationship(rid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart", `../charts/chart${state.globalChartIdx + 1}.xml`);
      const chartCnvPr = pickNonVisualDrawingProperties({
        ...chart,
        title: void 0,
        ext: void 0
      });
      drawingCharts.push({
        ...pickAnchorOptions(chart),
        ...chartCnvPr,
        rId: `rId${rid}`,
        ...chart.frameLocks ? { frameLocks: chart.frameLocks } : {},
        ...chart.macro !== void 0 ? { macro: chart.macro } : {},
        ...chart.hyperlink ? { hyperlink: chart.hyperlink } : {},
        ...chart.zOrder !== void 0 ? { zOrder: chart.zOrder } : {},
        ...chart.shapeId !== void 0 ? { shapeId: chart.shapeId } : {}
      });
      rid++;
      state.globalChartIdx++;
    }
    for (const sa of smartArtOpts) {
      const relTarget = (path) => path.startsWith("xl/") ? `../${path.slice(3)}` : path;
      const addDiagRel = (relType, path) => {
        const target = relTarget(path);
        const existing = drawingRels.idOf(relType, target);
        if (existing !== void 0) return existing;
        drawingRels.addRelationship(rid, relType, target);
        return `rId${rid++}`;
      };
      const relBase = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
      drawingSmartArts.push({
        ...pickAnchorOptions(sa),
        ...pickNonVisualDrawingProperties(sa),
        dataRId: addDiagRel(`${relBase}/diagramData`, sa.dataPath),
        layoutRId: addDiagRel(`${relBase}/diagramLayout`, sa.layoutPath),
        quickStyleRId: addDiagRel(`${relBase}/diagramQuickStyle`, sa.quickStylePath),
        colorsRId: addDiagRel(`${relBase}/diagramColors`, sa.colorsPath),
        ...sa.frameLocks ? { frameLocks: sa.frameLocks } : {},
        ...sa.macro !== void 0 ? { macro: sa.macro } : {},
        ...sa.zOrder !== void 0 ? { zOrder: sa.zOrder } : {},
        ...sa.shapeId !== void 0 ? { shapeId: sa.shapeId } : {}
      });
    }
    const hyperlinkBase = ctx.hyperlinks.length;
    let resolvedDrawingXml = drawingDesc.stringify({
      images: drawingImages,
      charts: drawingCharts,
      smartArts: drawingSmartArts,
      shapes: shapeOpts,
      connectors: connectorOpts,
      groups: groupOpts
    }, ctx);
    const hlinkRidByUrl = /* @__PURE__ */ new Map();
    for (const h of ctx.hyperlinks.slice(hyperlinkBase)) {
      let hlinkRid = hlinkRidByUrl.get(h.url);
      if (hlinkRid === void 0) {
        drawingRels.addRelationship(rid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", h.url, "External");
        hlinkRid = rid;
        hlinkRidByUrl.set(h.url, hlinkRid);
        rid++;
      }
      resolvedDrawingXml = resolvedDrawingXml.split(`r:id="{hlink:${h.key}}"`).join(`r:id="rId${hlinkRid}"`);
    }
    resolvedDrawingXml = bindMediaPlaceholders(resolvedDrawingXml, ctx.media, drawingRels);
    const drawingIdx = i + 1;
    mapping[`Drawing${i}`] = {
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${resolvedDrawingXml}`,
      path: `xl/drawings/drawing${drawingIdx}.xml`
    };
    mapping[`DrawingRels${i}`] = {
      data: XML_DECL + drawingRels.serialize(),
      path: `xl/drawings/_rels/drawing${drawingIdx}.xml.rels`
    };
    const drawingRid = ++nextRid;
    sheetXml = editSheetTailMarker(sheetXml, "<!--DRAWING-->", `<drawing r:id="rId${drawingRid}"/>`);
    wsRels.addRelationship(drawingRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing", `../drawings/drawing${drawingIdx}.xml`);
  }
  if (hasComments) {
    const commentsIdx = i + 1;
    const commentsXml = commentsDesc.stringify({ comments: commentOpts }, ctx);
    mapping[`Comments${i}`] = {
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${commentsXml}`,
      path: `xl/comments${commentsIdx}.xml`
    };
    const vmlXml = vmlNotesDesc.stringify({ comments: commentOpts }, ctx);
    mapping[`VmlDrawing${i}`] = {
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${vmlXml}`,
      path: `xl/drawings/vmlDrawing${commentsIdx}.vml`
    };
    const commentsRid = ++nextRid;
    wsRels.addRelationship(commentsRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments", `../comments${commentsIdx}.xml`);
    const vmlRid = ++nextRid;
    wsRels.addRelationship(vmlRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing", `../drawings/vmlDrawing${commentsIdx}.vml`);
    sheetXml = editSheetTailMarker(sheetXml, "<!--LEGACY_DRAWING-->", `<legacyDrawing r:id="rId${vmlRid}"/>`);
  }
  if (bgImg) {
    const ext = bgImg.type === "jpg" ? "jpeg" : bgImg.type;
    const rawBytes = toUint8Array(bgImg.data, { encoding: "base64" });
    const entry = ctx.media.addMedia(rawBytes, ext, (fileName) => ({
      fileName,
      type: ext,
      data: rawBytes,
      width: 0,
      height: 0
    }));
    state.globalMediaIdx++;
    const bgRid = ++nextRid;
    wsRels.addRelationship(bgRid, IMAGE_REL, `../media/${entry.fileName}`);
    sheetXml = editSheetTailMarker(sheetXml, "<!--BACKGROUND_PICTURE-->", `<picture r:id="rId${bgRid}"/>`);
  }
  const wsPath = `xl/worksheets/sheet${i + 1}.xml`;
  const resolvePassthroughRid = (typeFragment, originalRid) => {
    if (!wsRels) return originalRid;
    const rel = (passthroughRelationships ?? []).find((r) => r.source === wsPath && r.rId === originalRid && r.relationshipType.endsWith(typeFragment));
    if (!rel) return originalRid;
    const existing = wsRels.idOf(rel.relationshipType, rel.target);
    if (existing) return existing;
    if (wsRels.hasId(originalRid)) {
      const n = ++nextRid;
      wsRels.addRelationship(n, rel.relationshipType, rel.target);
      return `rId${n}`;
    }
    wsRels.addRelationship(originalRid, rel.relationshipType, rel.target);
    return originalRid;
  };
  if (wsOpts.drawingRid) {
    const rid = escapeXml(resolvePassthroughRid("/drawing", wsOpts.drawingRid));
    sheetXml = editSheetTailMarker(sheetXml, "<!--DRAWING-->", `<drawing r:id="${rid}"/>`);
  }
  if (wsOpts.legacyDrawingRid) {
    const rid = escapeXml(resolvePassthroughRid("/vmlDrawing", wsOpts.legacyDrawingRid));
    sheetXml = editSheetTailMarker(sheetXml, "<!--LEGACY_DRAWING-->", `<legacyDrawing r:id="${rid}"/>`);
  }
  if (hasPivots) for (const pt of pivotOpts) {
    state.globalPivotIdx++;
    const pivotIdx = state.globalPivotIdx;
    const sourceSheet = pt.sourceSheet ?? sheetName;
    const sourceWsIdx = findWorksheetIndex(worksheetConfigs, sourceSheet);
    if (sourceWsIdx === -1) continue;
    const sourceWs = worksheetConfigs[sourceWsIdx];
    if (!sourceWs) continue;
    const sourceData = extractPivotSourceData(sourceWs.rows ?? [], pt.source);
    const cacheKey = `${sourceSheet}:${pt.source}`;
    let cacheId;
    let cacheIdx;
    const existing = state.pivotCacheDataMap.get(cacheKey);
    if (existing) {
      cacheId = existing.cacheId;
      cacheIdx = existing.cacheIdx;
    } else {
      state.globalPivotCacheIdx++;
      cacheIdx = state.globalPivotCacheIdx;
      cacheId = cacheIdx;
      state.pivotCacheDataMap.set(cacheKey, {
        cacheId,
        cacheIdx
      });
      const cacheDefRels = new Relationships();
      cacheDefRels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheRecords", "pivotCacheRecords1.xml");
      const cacheDefXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + pivotCacheDefDesc.stringify({
        sourceRef: pt.source.split(":")[0] ? pt.source : "A1",
        sourceSheet,
        sourceData,
        recordsRid: "rId1"
      }, ctx);
      mapping[`PivotCacheDef${cacheIdx}`] = {
        data: cacheDefXml,
        path: `xl/pivotCache/pivotCacheDefinition${cacheIdx}.xml`
      };
      mapping[`PivotCacheDefRels${cacheIdx}`] = {
        data: XML_DECL + cacheDefRels.serialize(),
        path: `xl/pivotCache/_rels/pivotCacheDefinition${cacheIdx}.xml.rels`
      };
      const cacheRecordsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + pivotCacheRecordsDesc.stringify({ sourceData }, ctx);
      mapping[`PivotCacheRecords${cacheIdx}`] = {
        data: cacheRecordsXml,
        path: `xl/pivotCache/pivotCacheRecords${cacheIdx}.xml`
      };
      const wbPivotRid = ctx.workbookRels.nextRelationshipId;
      ctx.workbookRels.addRelationship(wbPivotRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheDefinition", `pivotCache/pivotCacheDefinition${cacheIdx}.xml`);
      ctx.pivotCacheRefs.push({
        cacheId,
        rId: `rId${wbPivotRid}`
      });
    }
    const pivotTableXml = XML_DECL + pivotTableDesc.stringify({
      options: pt,
      sourceData,
      cacheId
    }, ctx);
    mapping[`PivotTable${pivotIdx}`] = {
      data: pivotTableXml,
      path: `xl/pivotTables/pivotTable${pivotIdx}.xml`
    };
    const ptRels = new Relationships();
    ptRels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheDefinition", `../pivotCache/pivotCacheDefinition${cacheIdx}.xml`);
    mapping[`PivotTableRels${pivotIdx}`] = {
      data: XML_DECL + ptRels.serialize(),
      path: `xl/pivotTables/_rels/pivotTable${pivotIdx}.xml.rels`
    };
    const ptRid = ++nextRid;
    wsRels.addRelationship(ptRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotTable", `../pivotTables/pivotTable${pivotIdx}.xml`);
  }
  const wsTableParts = [];
  if (hasTables) for (const tbl of tableOpts) {
    state.globalTableIdx++;
    const tableIdx = state.globalTableIdx;
    if (!tbl.columns?.length) continue;
    const tableXmlStr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + tableDesc.stringify({
      ...tbl,
      id: tbl.id ?? tableIdx
    }, ctx);
    mapping[`Table${tableIdx}`] = {
      data: tableXmlStr,
      path: `xl/tables/table${tableIdx}.xml`
    };
    const tblRid = ++nextRid;
    wsRels.addRelationship(tblRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/table", `../tables/table${tableIdx}.xml`);
    wsTableParts.push({ rId: `rId${tblRid}` });
    state.allTableParts.push({ rId: `rId${tblRid}` });
  }
  if (hasQueryTables) for (const qt of queryTableOpts) {
    state.globalQueryTableIdx++;
    mapping[`QueryTable${state.globalQueryTableIdx}`] = {
      data: XML_DECL + queryTableDesc.stringify(qt, ctx),
      path: `xl/queryTables/queryTable${state.globalQueryTableIdx}.xml`
    };
    const qtRid = ++nextRid;
    wsRels.addRelationship(qtRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/queryTable", `../queryTables/queryTable${state.globalQueryTableIdx}.xml`);
  }
  if (singleXmlCellOpts.length > 0) {
    state.globalSingleXmlCellsIdx++;
    mapping[`TableSingleCells${state.globalSingleXmlCellsIdx}`] = {
      data: XML_DECL + singleXmlCellsDesc.stringify({ cells: singleXmlCellOpts }, ctx),
      path: `xl/tables/tableSingleCells${state.globalSingleXmlCellsIdx}.xml`
    };
    const sxcRid = ++nextRid;
    wsRels.addRelationship(sxcRid, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableSingleCells", `../tables/tableSingleCells${state.globalSingleXmlCellsIdx}.xml`);
  }
  if (hasPivots) {
    const rendered = renderPivotSheetData(pivotOpts, worksheetConfigs, ctx.sharedStrings, sheetName);
    if (rendered.sheetData.length > 0) {
      sheetXml = sheetXml.replace(/<sheetData\/>|<sheetData><\/sheetData>/, rendered.sheetData);
      if (!sheetXml.includes("<dimension")) sheetXml = sheetXml.replace("<sheetViews", `<dimension ref="${rendered.dimensionRef}"/><sheetViews`);
    }
  }
  if (wsTableParts.length > 0) sheetXml = editSheetTailMarker(sheetXml, "<!--TABLE_PARTS-->", buildTablePartsXml(wsTableParts));
  sheetXml = stripWorksheetPlaceholders(sheetXml);
  if (wsRels) {
    if (wsOpts.pageSetup?.printerSettingsRId) {
      const src = wsOpts.pageSetup.printerSettingsRId;
      const rid = resolvePassthroughRid("/printerSettings", src);
      if (rid !== src) sheetXml = sheetXml.replace(new RegExp(`(<pageSetup[^>]*r:id=")${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(")`), `$1${rid}$2`);
    }
    if (wsOpts.pivotSelection?.rId) {
      const src = wsOpts.pivotSelection.rId;
      const rid = resolvePassthroughRid("/pivotTable", src);
      if (rid !== src) sheetXml = sheetXml.replace(new RegExp(`(<pivotSelection[^>]*r:id=")${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(")`), `$1${rid}$2`);
    }
    for (const rel of passthroughRelationships ?? []) {
      if (rel.source !== wsPath) continue;
      if (wsRels.hasRelationship(rel.relationshipType, rel.target)) continue;
      const n = ++nextRid;
      wsRels.addRelationship(n, rel.relationshipType, rel.target);
    }
  }
  if (wsRels) mapping[`WorksheetRels${i}`] = {
    data: XML_DECL + wsRels.serialize(),
    path: `xl/worksheets/_rels/sheet${i + 1}.xml.rels`
  };
  mapping[`Worksheet${i}`] = {
    data: sheetXml,
    path: `xl/worksheets/sheet${i + 1}.xml`
  };
}
var CHARTSHEET_DEFAULT_CX = 9308969;
var CHARTSHEET_DEFAULT_CY = 6096e3;
function compileChartsheets(chartsheetConfigs, ctx, mapping, passthroughRelationships) {
  for (const [i, csOpts] of chartsheetConfigs.entries()) {
    const chartDef = csOpts.chart;
    if (!chartDef) continue;
    const csChartGlobalIdx = ctx.charts.array.length;
    const csChartKey = `cs_chart_${csChartGlobalIdx}`;
    ctx.charts.addChart(csChartKey, {
      key: csChartKey,
      chartSpaceXml: chartSpaceDesc.stringify(chartDef, ctx) ?? ""
    });
    const csRels = new Relationships();
    const csDrawingIdx = i + 1;
    csRels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing", `../drawings/drawing${csDrawingIdx}.xml`);
    let csNextRid = 2;
    for (const rel of passthroughRelationships ?? []) {
      if (rel.source !== `xl/chartsheets/sheet${i + 1}.xml`) continue;
      if (csRels.hasRelationship(rel.relationshipType, rel.target)) continue;
      csRels.addRelationship(csNextRid++, rel.relationshipType, rel.target);
    }
    const csDrawingRels = new Relationships();
    csDrawingRels.addRelationship(1, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart", `../charts/chart${csChartGlobalIdx + 1}.xml`);
    const frame = graphicFrameXml(csOpts.shapeId ?? 1, void 0, `Chart ${i + 1}`, "rId1", 0, 0, ctx, {
      frameLocks: csOpts.frameLocks,
      macro: csOpts.macro
    });
    const anchor = wrapAnchor({
      anchorType: "absolute",
      col: 1,
      row: 1,
      absoluteX: csOpts.absoluteX ?? 0,
      absoluteY: csOpts.absoluteY ?? 0,
      extentCx: csOpts.extentCx ?? CHARTSHEET_DEFAULT_CX,
      extentCy: csOpts.extentCy ?? CHARTSHEET_DEFAULT_CY
    }, `${frame}<xdr:clientData/>`);
    const csDrawingXml = `<xdr:wsDr xmlns:xdr="${XDR_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS$1}">${anchor}</xdr:wsDr>`;
    mapping[`ChartsheetDrawing${i}`] = {
      data: csDrawingXml,
      path: `xl/drawings/drawing${csDrawingIdx}.xml`
    };
    mapping[`ChartsheetDrawingRels${i}`] = {
      data: XML_DECL + csDrawingRels.serialize(),
      path: `xl/drawings/_rels/drawing${csDrawingIdx}.xml.rels`
    };
    mapping[`ChartsheetRels${i}`] = {
      data: XML_DECL + csRels.serialize(),
      path: `xl/chartsheets/_rels/sheet${i + 1}.xml.rels`
    };
    let csPageSetup = csOpts.pageSetup;
    if (csPageSetup?.printerSettingsRId) {
      const srcRid = csPageSetup.printerSettingsRId;
      const rel = (passthroughRelationships ?? []).find((r) => r.source === `xl/chartsheets/sheet${i + 1}.xml` && r.rId === srcRid && r.relationshipType.endsWith("/printerSettings"));
      const rid = rel ? csRels.idOf(rel.relationshipType, rel.target) ?? srcRid : srcRid;
      if (rid !== srcRid) csPageSetup = {
        ...csPageSetup,
        printerSettingsRId: rid
      };
    }
    mapping[`Chartsheet${i}`] = {
      data: XML_DECL + chartsheetDesc.stringify({
        ...csOpts,
        drawingRId: "rId1",
        pageSetup: csPageSetup
      }, ctx),
      path: `xl/chartsheets/sheet${i + 1}.xml`
    };
  }
}
function compileDialogsheets(dialogsheetConfigs, ctx, mapping) {
  for (const [i, dsOpts] of dialogsheetConfigs.entries()) mapping[`Dialogsheet${i}`] = {
    data: XML_DECL + dialogsheetDesc.stringify(dsOpts, ctx),
    path: `xl/dialogSheets/sheet${i + 1}.xml`
  };
}
function compileRevisionLogs(rl, ctx, mapping) {
  const REV_HEADERS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/revisionHeaders";
  const REV_LOG_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/revisionLog";
  const USERS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/users";
  mapping["RevisionHeaders"] = {
    data: XML_DECL + (revisionHeadersDesc.stringify(rl.headers, ctx) ?? ""),
    path: "xl/revisionHeaders.xml"
  };
  ctx.workbookRels.addRelationship(ctx.workbookRels.nextRelationshipId, REV_HEADERS_REL, "revisionHeaders.xml");
  const revHeadersRels = new Relationships();
  for (const [i, log] of rl.logs.entries()) {
    mapping[`RevisionLog${i}`] = {
      data: XML_DECL + (revisionLogDesc.stringify(log, ctx) ?? ""),
      path: `xl/revisions/revision${i + 1}.xml`
    };
    revHeadersRels.addRelationship(i + 1, REV_LOG_REL, `revisions/revision${i + 1}.xml`);
  }
  mapping["RevisionHeadersRels"] = {
    data: XML_DECL + revHeadersRels.serialize(),
    path: "xl/_rels/revisionHeaders.xml.rels"
  };
  if (rl.users) {
    const usersXml = usersDesc.stringify(rl.users, ctx);
    if (usersXml) {
      mapping["Users"] = {
        data: XML_DECL + usersXml,
        path: "xl/users.xml"
      };
      ctx.workbookRels.addRelationship(ctx.workbookRels.nextRelationshipId, USERS_REL, "users.xml");
    }
  }
}
function buildWorkbookRelationships(rels, wsCount, csCount, dsCount = 0) {
  let rid = 1;
  for (let i = 0; i < wsCount; i++) rels.addRelationship(rid++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet", `worksheets/sheet${i + 1}.xml`);
  for (let i = 0; i < csCount; i++) rels.addRelationship(rid++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/chartsheet", `chartsheets/sheet${i + 1}.xml`);
  for (let i = 0; i < dsCount; i++) rels.addRelationship(rid++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/dialogsheet", `dialogSheets/sheet${i + 1}.xml`);
  rels.addRelationship(rid++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles", "styles.xml");
  rels.addRelationship(rid++, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme", "theme/theme1.xml");
}
function hasMetadataContent(metadata) {
  return (metadata.types?.length ?? 0) > 0 || (metadata.strings?.length ?? 0) > 0 || (metadata.mdx?.length ?? 0) > 0 || (metadata.futureMetadata?.length ?? 0) > 0 || (metadata.cellMetadata?.length ?? 0) > 0 || (metadata.valueMetadata?.length ?? 0) > 0;
}
function extractPivotSourceData(rows, sourceRef) {
  const parts = sourceRef.split(":");
  const startMatch = parts[0]?.match(/^([A-Z]+)(\d+)$/);
  const endMatch = parts[1]?.match(/^([A-Z]+)(\d+)$/);
  if (!startMatch) return {
    fieldNames: [],
    records: []
  };
  const startRow = parseInt(startMatch[2] ?? "1", 10) - 1;
  const endRow = endMatch ? parseInt(endMatch[2] ?? "1", 10) - 1 : startRow;
  const startCol = letterToColumn(startMatch[1] ?? "A") - 1;
  const endCol = endMatch ? letterToColumn(endMatch[1] ?? "A") - 1 : startCol;
  const colCount = endCol - startCol + 1;
  const headerRow = rows[startRow];
  const fieldNames = [];
  if (headerRow?.cells) for (let c = startCol; c <= endCol && c < headerRow.cells.length; c++) {
    const hv = headerRow.cells[c]?.value;
    fieldNames.push(typeof hv === "string" ? hv : typeof hv === "number" || typeof hv === "boolean" ? String(hv) : `Col${c}`);
  }
  const records = [];
  for (let r = startRow + 1; r <= endRow; r++) {
    const row = rows[r];
    if (!row?.cells) continue;
    const record = [];
    for (let c = startCol; c <= endCol; c++) {
      const val = row.cells[c]?.value;
      if (typeof val === "number") record.push(val);
      else if (val instanceof Date) record.push(val.getTime());
      else record.push(typeof val === "string" ? val : typeof val === "boolean" ? String(val) : "");
    }
    if (record.length === colCount) records.push(record);
  }
  return {
    fieldNames,
    records
  };
}
function findWorksheetIndex(configs, name) {
  for (let i = 0; i < configs.length; i++) if ((configs[i].name ?? `Sheet${i + 1}`) === name) return i;
  return -1;
}
function renderPivotSheetData(pivotOpts, worksheetConfigs, sharedStrings, currentSheetName) {
  const rowCells = /* @__PURE__ */ new Map();
  let maxRow = 0;
  let maxCol = 0;
  let minRow = Infinity;
  let minCol = Infinity;
  for (const pt of pivotOpts) {
    const locMatch = (pt.location ?? "A3").match(/^([A-Z]+)(\d+)$/);
    if (!locMatch) continue;
    const startCol = letterToColumn(locMatch[1] ?? "A") - 1;
    const startRow = parseInt(locMatch[2] ?? "1", 10);
    const rowFieldNames = pt.rows;
    const dataFields = pt.data;
    const sourceWsIdx = findWorksheetIndex(worksheetConfigs, pt.sourceSheet ?? currentSheetName);
    if (sourceWsIdx === -1) continue;
    const sourceData = extractPivotSourceData(worksheetConfigs[sourceWsIdx]?.rows ?? [], pt.source);
    if (sourceData.fieldNames.length === 0) continue;
    const fields = sourceData.fieldNames;
    const rowFieldIndices = rowFieldNames.map((n) => fields.indexOf(n));
    const dataFieldIndices = dataFields.map((df) => fields.indexOf(df.field));
    if (rowFieldIndices.some((idx) => idx === -1)) continue;
    if (dataFieldIndices.some((idx) => idx === -1)) continue;
    const groupMap = /* @__PURE__ */ new Map();
    for (const record of sourceData.records) {
      const groupKey = rowFieldIndices.map((fi) => String(record[fi])).join("|");
      let group = groupMap.get(groupKey);
      if (!group) {
        group = {
          keys: rowFieldIndices.map((fi) => {
            const v = record[fi];
            return typeof v === "string" || typeof v === "number" ? v : String(v ?? "");
          }),
          values: dataFieldIndices.map(() => [])
        };
        groupMap.set(groupKey, group);
      }
      for (const [di, fi] of dataFieldIndices.entries()) {
        const val = record[fi];
        if (typeof val === "number") group.values[di]?.push(val);
      }
    }
    const colFieldIndices = (pt.columns ?? []).map((n) => fields.indexOf(n));
    const addCells = (rowIdx, cells) => {
      let arr = rowCells.get(rowIdx);
      if (!arr) {
        arr = [];
        rowCells.set(rowIdx, arr);
      }
      for (const c of cells) arr.push(c);
      minRow = Math.min(minRow, rowIdx);
      maxRow = Math.max(maxRow, rowIdx);
    };
    if (colFieldIndices.length > 0 && !colFieldIndices.some((idx) => idx === -1)) {
      const colUniqueVals = collectUniqueValues(sourceData.records, colFieldIndices[0] ?? 0).map((v) => typeof v === "string" || typeof v === "number" ? String(v) : String(v ?? ""));
      const crossTabMap = /* @__PURE__ */ new Map();
      for (const record of sourceData.records) {
        const rowKey = rowFieldIndices.map((fi) => String(record[fi])).join("|");
        const colKey = colFieldIndices.map((fi) => String(record[fi])).join("|");
        let entry = crossTabMap.get(rowKey);
        if (!entry) {
          entry = {
            rowKeys: rowFieldIndices.map((fi) => {
              const v = record[fi];
              return typeof v === "string" || typeof v === "number" ? v : String(v ?? "");
            }),
            colData: /* @__PURE__ */ new Map(),
            rowTotals: dataFieldIndices.map(() => [])
          };
          crossTabMap.set(rowKey, entry);
        }
        let colValues = entry.colData.get(colKey);
        if (!colValues) {
          colValues = dataFieldIndices.map(() => []);
          entry.colData.set(colKey, colValues);
        }
        for (const [di, fi] of dataFieldIndices.entries()) {
          const val = record[fi];
          if (typeof val === "number") {
            colValues[di]?.push(val);
            entry.rowTotals[di]?.push(val);
          }
        }
      }
      const numColVals = colUniqueVals.length;
      const endCol = startCol + (rowFieldNames.length + numColVals + 1) - 1;
      minCol = Math.min(minCol, startCol);
      maxCol = Math.max(maxCol, endCol);
      const headerCells = [];
      for (const rfName of rowFieldNames) {
        const cellRef = colIndexToLetter(startCol + headerCells.length) + startRow;
        const strIdx = sharedStrings.register(rfName);
        headerCells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
      }
      for (const cv of colUniqueVals) {
        const cellRef = colIndexToLetter(startCol + headerCells.length) + startRow;
        const strIdx = sharedStrings.register(cv);
        headerCells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
      }
      {
        const cellRef = colIndexToLetter(startCol + headerCells.length) + startRow;
        const df0 = dataFields[0];
        const subtotal = df0.summarize ?? "sum";
        const dfName = df0.name ?? `${subtotal === "sum" ? "Sum" : subtotal} of ${df0.field}`;
        const strIdx = sharedStrings.register(dfName);
        headerCells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
      }
      addCells(startRow, headerCells);
      let currentRow = startRow + 1;
      for (const [, entry] of crossTabMap) {
        const cells = [];
        for (const [ri, rowKey] of entry.rowKeys.entries()) {
          const cellRef = colIndexToLetter(startCol + ri) + currentRow;
          const strIdx = sharedStrings.register(String(rowKey));
          cells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
        }
        for (const [ci, colKey] of colUniqueVals.entries()) {
          const colValues = entry.colData.get(colKey);
          const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + ci)) + currentRow;
          const subtotal = dataFields[0].summarize ?? "sum";
          const result = colValues ? aggregate(colValues[0] ?? [], subtotal) : 0;
          cells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
        }
        {
          const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + numColVals)) + currentRow;
          const subtotal = dataFields[0].summarize ?? "sum";
          const result = aggregate(entry.rowTotals[0] ?? [], subtotal);
          cells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
        }
        addCells(currentRow, cells);
        currentRow++;
      }
      const gtCells = [];
      const gtStrIdx = sharedStrings.register("Grand Total");
      gtCells.push(`<c r="${colIndexToLetter(startCol)}${currentRow}" t="s"><v>${gtStrIdx}</v></c>`);
      for (const [ci, colKey] of colUniqueVals.entries()) {
        const subtotal = dataFields[0].summarize ?? "sum";
        const colAllValues = [];
        const dfIdx0 = dataFieldIndices[0];
        for (const record of sourceData.records) if (colFieldIndices.map((fi) => String(record[fi])).join("|") === colKey && dfIdx0 !== void 0) {
          const val = record[dfIdx0];
          if (typeof val === "number") colAllValues.push(val);
        }
        const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + ci)) + currentRow;
        const result = aggregate(colAllValues, subtotal);
        gtCells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
      }
      {
        const subtotal = dataFields[0].summarize ?? "sum";
        const dfIdx0 = dataFieldIndices[0];
        const allValues = sourceData.records.map((r) => dfIdx0 !== void 0 ? r[dfIdx0] : void 0).filter((v) => typeof v === "number");
        const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + numColVals)) + currentRow;
        const result = aggregate(allValues, subtotal);
        gtCells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
      }
      addCells(currentRow, gtCells);
    } else {
      const endCol = startCol + rowFieldNames.length + dataFields.length - 1;
      minCol = Math.min(minCol, startCol);
      maxCol = Math.max(maxCol, endCol);
      const headerCells = [];
      for (const rfName of rowFieldNames) {
        const cellRef = colIndexToLetter(startCol + headerCells.length) + startRow;
        const strIdx = sharedStrings.register(rfName);
        headerCells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
      }
      for (const df of dataFields) {
        const cellRef = colIndexToLetter(startCol + headerCells.length) + startRow;
        const subtotal = df.summarize ?? "sum";
        const dfName = df.name ?? `${subtotal === "sum" ? "Sum" : subtotal} of ${df.field}`;
        const strIdx = sharedStrings.register(dfName);
        headerCells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
      }
      addCells(startRow, headerCells);
      let currentRow = startRow + 1;
      for (const [, group] of groupMap) {
        const cells = [];
        for (const [ri, key] of group.keys.entries()) {
          const cellRef = colIndexToLetter(startCol + ri) + currentRow;
          const strIdx = sharedStrings.register(String(key));
          cells.push(`<c r="${cellRef}" t="s"><v>${strIdx}</v></c>`);
        }
        for (const [di, df] of dataFields.entries()) {
          const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + di)) + currentRow;
          const subtotal = df.summarize ?? "sum";
          const result = aggregate(group.values[di] ?? [], subtotal);
          cells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
        }
        addCells(currentRow, cells);
        currentRow++;
      }
      const gtCells = [];
      const gtStrIdx = sharedStrings.register("Grand Total");
      gtCells.push(`<c r="${colIndexToLetter(startCol)}${currentRow}" t="s"><v>${gtStrIdx}</v></c>`);
      for (const [di, df] of dataFields.entries()) {
        const cellRef = colIndexToLetter(startCol + (rowFieldNames.length + di)) + currentRow;
        const subtotal = df.summarize ?? "sum";
        const dfIdx = dataFieldIndices[di];
        const result = aggregate(sourceData.records.map((r) => dfIdx !== void 0 ? r[dfIdx] : void 0).filter((v) => typeof v === "number"), subtotal);
        gtCells.push(`<c r="${cellRef}"><v>${result}</v></c>`);
      }
      addCells(currentRow, gtCells);
    }
  }
  if (rowCells.size === 0) return {
    sheetData: "",
    dimensionRef: ""
  };
  const parts = ["<sheetData>"];
  const sortedRows = [...rowCells.entries()].sort((a, b) => a[0] - b[0]);
  for (const [rowIdx, cells] of sortedRows) {
    parts.push(`<row r="${rowIdx}" x14ac:dyDescent="0.25">`);
    for (const c of cells) parts.push(c);
    parts.push("</row>");
  }
  parts.push("</sheetData>");
  const dimensionRef = `${colIndexToLetter(minCol === Infinity ? 0 : minCol)}${minRow === Infinity ? 1 : minRow}:${colIndexToLetter(maxCol)}${maxRow}`;
  return {
    sheetData: parts.join(""),
    dimensionRef
  };
}
function colIndexToLetter(col) {
  return columnToLetter(col + 1);
}
var XLSX_CONTENT_TYPE_RESOLVER = resolverFromRegistry(XLSX_PARTS);
var Packer = createPacker({
  compile: (options, overrides, mediaLevel) => compileWorkbook(options, overrides, mediaLevel),
  mimeType: OoxmlMimeType.XLSX
});
function hasSheetContent(options) {
  return (options.worksheets?.length ?? 0) > 0 || (options.chartsheets?.length ?? 0) > 0 || (options.dialogsheets?.length ?? 0) > 0;
}
function encryptedPassthrough(options, type) {
  assertEncryptedExclusive(options, hasSheetContent(options));
  return encryptedContainerOutput(options, type, OoxmlMimeType.XLSX);
}
function generateWorkbookSync(options, packerOptions) {
  const encrypted = encryptedPassthrough(options, packerOptions?.type ?? "nodebuffer");
  if (encrypted) return encrypted;
  return Packer.packSync(options, packerOptions);
}
export {
  generateWorkbookSync,
  parseWorkbook
};
/*! Bundled license information:

@office-open/core/dist/ext-uri-BHBcIrW7.mjs:
  (*!
  * The buffer module from node.js, for the browser.
  *
  * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
  * @license  MIT
  *)
*/
