const version = new Uint8Array([ 128 ]);  // This field denotes which version of the format is being used by the token. Currently there is only one version defined, with the value 128 (0x80).

/**
 * Given a key and message, generate a fernet token.
 * 
 * @param crypto The web-crypto api.  Either window.crypto or require("node-webcrypto-ossl").
 * @param secret A base64 encoded fernet key (https://github.com/fernet/spec/blob/master/Spec.md#key-format)
 * @param now The current timestamp encoded as an ISO8601 time string
 * @param iv The IV to use, represented as a 16 byte Uint8Array
 * @param src The string to encode
 */
export async function generate(crypto: Crypto, secret: string, now: string, iv: Uint8Array, src: string): Promise<string> {
  if (iv.byteLength !== 16) {
    throw new Error("The IV must be 16 bytes long");
  }

  const key = new Key(secret);

  const plaintext = Buffer.from(src, "utf8");

  // Pad the message to a multiple of 16 bytes
  const padCount = 16 - (src.length % 16);
  const paddedPlaintext = concatArrayBuffers(plaintext, new Uint8Array(Array(padCount).fill(padCount)));

  // Encrypt the padded message using AES 128 in CBC mode with the chosen IV and user-supplied encryption-key.
  const cryptoKey = await makeCryptoKey(crypto, key);
  const cipherText = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-CBC",
        iv
      },
      cryptoKey,
      paddedPlaintext
    )
  );

  // Compute the token
  const timestamp = packInt(new Date(now).getTime() / 1000); // This field is a 64-bit unsigned big-endian integer. It records the number of seconds elapsed between January 1, 1970 UTC and the time the token was created.
  const hmac = await makeHMAC(crypto, key, timestamp, iv, cipherText);
  const token = concatArrayBuffers(version, timestamp, iv, cipherText, hmac);

  // base64url encode the entire token and return it
  return base64UrlEncode(token);
}

/**
 * Given a key and token, verify that the token is valid and recover the original message.
 * 
 * @param crypto The web-crypto api.  Either window.crypto or require("node-webcrypto-ossl").
 * @param secret A base64 encoded fernet key (https://github.com/fernet/spec/blob/master/Spec.md#key-format)
 * @param encodedToken A fernet token
 * @param ttl The time-to-live; if set, the token must be less than ttl seconds old otherwise it won't be decoded
 */
export async function verify(crypto: Crypto, secret: string, encodedToken: string, ttl?: number): Promise<string> {
  const key = new Key(secret);

  // base64url decode the token.
  const token = base64urlDecode(encodedToken);

  // Ensure the first byte of the token is 0x80.
  if (token[ 0 ] !== 0x80) {
    throw new Error("Illegal Fernet version");
  }

  // Get all remaining pieces from the token
  const timestamp = token.subarray(1, 9);
  const iv = token.subarray(9, 25);
  const cipherText = token.subarray(25, token.byteLength - 32);
  const hmac = token.subarray(token.byteLength - 32);

  // If the user has specified a maximum age (or "time-to-live") for the token, ensure the recorded timestamp is not too far in the past.
  if (ttl !== undefined) {
    if (unpackInt(timestamp) + ttl <= new Date().getTime() / 1000) {
      throw new Error("This token has expired");
    }
  }

  // Recompute the HMAC from the other fields and the user-supplied signing-key.
  const recomputedHmac = await makeHMAC(crypto, key, timestamp, iv, cipherText);

  // Ensure the recomputed HMAC matches the HMAC field stored in the token, using a constant-time comparison function.
  for (var n = 0; n < Math.min(recomputedHmac.byteLength, hmac.byteLength); n++) {
    if (recomputedHmac[ n ] !== hmac[ n ]) {
      throw new Error("HMACs do not match");
    }
  }

  // Decrypt the ciphertext field using AES 128 in CBC mode with the recorded IV and user-supplied encryption-key.
  const cryptoKey = await makeCryptoKey(crypto, key);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv
    },
    cryptoKey,
    cipherText
  );

  // Unpad the decrypted plaintext, yielding the original message.
  const plaintextView = new Uint8Array(plaintext);
  const padCount = plaintextView[ plaintextView.byteLength - 1 ];

  return Buffer.from(plaintextView.slice(0, plaintextView.byteLength - padCount)).toString();
}

async function makeCryptoKey(crypto: Crypto, key: Key) {
  return crypto.subtle.importKey(
    "raw",
    key.encryptionKey,
    "AES-CBC",
    false,
    [ "encrypt", "decrypt" ]
  );
}

/**
 * Compute the 256-bit SHA256 HMAC, under signing-key, of the concatenation of the following fields:
 * 
 * Version ‖ Timestamp ‖ IV ‖ Ciphertext
 * 
 * Note that the HMAC input is the entire rest of the token verbatim, and that this input is not base64url encoded.
 * 
 * @param signingKey 
 * @param timestamp 
 * @param iv 
 * @param cipherText 
 */
async function makeHMAC(crypto: Crypto, key: Key, timestamp: Uint8Array, iv: Uint8Array, cipherText: Uint8Array): Promise<Uint8Array> {
  const hmacInput = concatArrayBuffers(version, timestamp, iv, cipherText);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.signingKey,
    {
      name: "HMAC",
      hash: {
        name: "SHA-256"
      }
    },
    false,
    [ "sign", "verify" ] //can be any combination of "sign" and "verify"
  );

  const hmac = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    hmacInput
  );

  return new Uint8Array(hmac);
}

/**
 * Pack an integer as a 64 bit unsigned int (big-endian)
 * 
 * @param timestamp 
 */
function packInt(value: number): Uint8Array {
  const arrayBuffer = new Uint8Array(8);
  new DataView(arrayBuffer.buffer).setUint32(4, value);
  return arrayBuffer;
}

function unpackInt(arrayBuffer: Uint8Array): number {
  // Some silliness to get around the underlying buffer being shared
  const tmpBuffer = new Uint8Array(arrayBuffer.length);
  tmpBuffer.set(arrayBuffer);
  return new DataView(tmpBuffer.buffer).getUint32(4);
}

function base64UrlEncode(arrayBuffer: Uint8Array): string {
  return Buffer.from(arrayBuffer).toString("base64").replace(/-/g, "+").replace(/\//g, "_");
}

function base64urlDecode(data: string): Uint8Array {
  return Buffer.from(data.replace(/-/g, "+").replace(/\//g, "_"), "base64");
}

/**
 * Concatenate multiple ArrayBuffers together
 * 
 * @param arrayBuffers 
 */
function concatArrayBuffers(...arrayBuffers: Uint8Array[]): Uint8Array {
  const totalByteLength = arrayBuffers.reduce((byteLength, arrayBuffer) => byteLength + arrayBuffer.byteLength, 0);

  var result = new Uint8Array(totalByteLength);
  arrayBuffers.reduce((currentBytePosition, arrayBuffer) => {
    result.set(arrayBuffer, currentBytePosition);
    return currentBytePosition + arrayBuffer.byteLength;
  }, 0);

  return result;
}

class Key {
  readonly signingKey: Uint8Array;
  readonly encryptionKey: Uint8Array;

  constructor(secret: string) {
    const decodedKey = base64urlDecode(secret);

    // Get the signing and encryption key from the secret
    if (decodedKey.byteLength !== 32) {
      throw new Error("Incorrect key");
    }

    this.signingKey = decodedKey.slice(0, 16);
    this.encryptionKey = decodedKey.slice(16, 32);
  }
}
