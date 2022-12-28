'use strict';

window.Base64 = window.Base64 || (function() {

  const VAL64_CP = '='.codePointAt(0)

  function _encode(codec, value) {
    if(value < 0) throw `Illegal encoded value '${value}'.`
    if(value < 26) return value+65 // A~Z
    if(value < 52) return value-26+97 // a~z
    if(value < 62) return value-52+48 // 0~9
    if(value === 62) return codec.VAL62_CP
    if(value === 63) return codec.VAL63_CP
    if(value === 64) return VAL64_CP // =
    throw `Illegal encoded value '${value}'.`
  }

  function _decode(codec, codepoint) {
    if(codepoint === undefined) return 64 // =
    if(65<=codepoint && codepoint<=90) return codepoint-65 // A~Z
    if(97<=codepoint && codepoint<=122) return 26+codepoint-97 // a~z
    if(48<=codepoint && codepoint<=57) return 52+codepoint-48 // 0~9
    if(codepoint===codec.VAL62_CP) return 62
    if(codepoint===codec.VAL63_CP) return 63
    if(codepoint===VAL64_CP) return 64 // =
    throw `Illegal ${codec.name} Base64 character '${String.fromCodePoint(codepoint)}'.`
  }

  class Codec {
    constructor(name, VAL62_CP, VAL63_CP, PADDING) {
      this.name = name
      this.VAL62_CP = VAL62_CP
      this.VAL63_CP = VAL63_CP
      this.PADDING = PADDING
    }

    encodeFromString(string) {
      if(! string) return ''

      return this.encode(new TextEncoder().encode(string))
    }

    encode(bytes) {
      if(! bytes) return ''

      let chars = new Uint8Array((bytes.length+2)/3*4), length=0

      let byte1, byte2, byte3, enc1, enc2, enc3, enc4
      for(let iByte = 0; iByte < bytes.length; ) {
        byte1 = bytes[iByte++]
        byte2 = bytes[iByte++]
        byte3 = bytes[iByte++]

        enc1 = (byte1 & 255) >> 2
        enc2 = ((byte1 & 3) << 4) | ((byte2 & 255) >> 4)
        enc3 = ((byte2 & 15) << 2) | ((byte3 & 255) >> 6)
        enc4 = byte3 & 63

        chars[length++] = _encode(this, enc1)
        chars[length++] = _encode(this, enc2)
        if(byte2 === undefined) {
          // enc3 = enc4 = 64;
          if(this.PADDING) { chars[length++] = VAL64_CP; chars[length++] = VAL64_CP }
        } else if (byte3 === undefined) {
          // enc4 = 64;
          chars[length++] = _encode(this, enc3)
          if(this.PADDING) { chars[length++] = VAL64_CP; }
        } else {
          chars[length++] = _encode(this, enc3)
          chars[length++] = _encode(this, enc4)
        }
      }

      return new TextDecoder().decode(new Uint8Array(chars.buffer, 0, length))
    }

    decodeToString(string, charset = 'utf-8') {
      if(! string) return ''

      return new TextDecoder(charset).decode(this.decode(string))
    }

    decode(string) {
      if(! string) return Uint8Array.from([])

      let bytes = new Uint8Array(((string.length+3) >> 2) * 3), length=0

      let byte1, byte2, byte3, enc1, enc2, enc3, enc4
      for(let iChar = 0; iChar < string.length; ) {
        enc1 = _decode(this, string.codePointAt(iChar++))
        enc2 = _decode(this, string.codePointAt(iChar++))
        enc3 = _decode(this, string.codePointAt(iChar++))
        enc4 = _decode(this, string.codePointAt(iChar++))

        byte1 = (enc1 << 2) | (enc2 >> 4)
        byte2 = ((enc2 & 15) << 4) | (enc3 >> 2)
        byte3 = ((enc3 & 3) << 6) | enc4

        bytes[length++] = byte1
        if(enc3 != 64) bytes[length++] = byte2
        if(enc4 != 64) bytes[length++] = byte3
      }

      return new Uint8Array(bytes.buffer, 0, length)
    }
  }

  const Basic   = new Codec('Basic',    '+'.codePointAt(0), '/'.codePointAt(0), true)
  const UrlSafe = new Codec('URL Safe', '-'.codePointAt(0), '_'.codePointAt(0), false)

  return {
    Basic,
    UrlSafe
  }
})()
