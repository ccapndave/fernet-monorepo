import { generate, verify } from "./fernet";

export async function encrypt(crypto: Crypto, passphrase: string, plainText: string) {
  const key = await makeFernetKeyFromPassphrase(crypto, passphrase);
  const token = await generate(crypto, key.fernetKey, new Date().toISOString(), crypto.getRandomValues(new Uint8Array(16)), plainText);

  return JSON.stringify({
    config: key.config,
    token
  });
}

export async function decrypt(crypto: Crypto, passphrase: string, cipherText: string) {
  const { config, token } = JSON.parse(cipherText);
  const key = await makeFernetKeyFromPassphrase(crypto, passphrase, config);

  return verify(crypto, key.fernetKey, token);
}

/**
 * Derive a secret key from the given passphrase using PBKDF2 with the given number of iterations.  This returns the
 * salt, the number of iterations to use and the secret generated (all three of these bits of information are required
 * to rebuild the secret from the passphrase).
 * 
 * @param crypto The web-crypto api.  Either window.crypto or require("node-webcrypto-ossl").
 * @param passphrase The passphrase to use for encryption
 * @param iterations The number of iterations to use, or this defaults to 10000.
 */
export async function makeFernetKeyFromPassphrase(crypto: Crypto, passphrase: string, config: Config = { iterations: 10000 }): Promise<{ config: Config, fernetKey: string }> {
  // Get the salt from the config, or create a random one
  const saltBuffer = config.salt ? Buffer.from(config.salt, "base64") : crypto.getRandomValues(new Uint8Array(16));

  if (saltBuffer.byteLength !== 16) {
    throw new Error("Illegal salt length");
  }

  // Make a key from the passphrase
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    Buffer.from(passphrase, "utf-8"),
    "PBKDF2",
    false,
    [ "deriveKey" ]
  );

  // Derive a stretched key from the key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: config.iterations,
      hash: "SHA-256"
    },
    cryptoKey,
    {
      name: "AES-CBC",
      length: 256
    },
    true,
    [ "encrypt", "decrypt" ]
  );

  // Export the key
  const exportedKey = await crypto.subtle.exportKey(
    "raw",
    derivedKey
  );

  return {
    config: {
      iterations: config.iterations,
      salt: Buffer.from(saltBuffer).toString("base64")
    },
    fernetKey: Buffer.from(exportedKey).toString("base64")
  }
}

interface Config {
  iterations: number;
  salt?: string;
}
