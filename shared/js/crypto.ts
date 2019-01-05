export interface Params {
  crypto: Crypto;
  stringToBuffer: (str: string) => ArrayBuffer;
  base64ToBuffer: (b64: string) => ArrayBuffer;
  bufferToBase64: (buffer: ArrayBuffer) => string;
}

export async function encrypt({ crypto, stringToBuffer, bufferToBase64 }: Params, passphrase: string, plainText: string) {
  const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
  const iterations = 1000;

  // Make a key from the passphrase
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(passphrase),
    "PBKDF2",
    false,
    [ "deriveKey" ]
  );

  // Derive a stretched key from the key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations,
      hash: "SHA-256"
    },
    cryptoKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    [ "encrypt", "decrypt" ]
  );

  // Use the key to encrypt the plaintext
  const cipherTextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(8)
    },
    derivedKey,
    stringToBuffer(plainText)
  );

  return `PBKDF2:HMAC-SHA256:${bufferToBase64(saltBuffer)}:${iterations.toString()}:${bufferToBase64(cipherTextBuffer)}`;
}

export async function decrypt({ crypto, stringToBuffer, base64ToBuffer, bufferToBase64 }: Params, passphrase: string, encrpytedString: string) {
  const [ kdf, algorithm, salt, iterations, cipherText ] = encrpytedString.split(":");

  // Make a key from the passphrase
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(passphrase),
    "PBKDF2",
    false,
    [ "deriveKey" ]
  );

  // Derive a stretched key from the key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: base64ToBuffer(salt),
      iterations: parseInt(iterations),
      hash: "SHA-256"
    },
    cryptoKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    [ "encrypt", "decrypt" ]
  );

  // Use the key to decrypt the ciphertext
  const plainText = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(8)
    },
    derivedKey,
    base64ToBuffer(cipherText)
  );

  return String.fromCharCode(...new Uint8Array(plainText));
}