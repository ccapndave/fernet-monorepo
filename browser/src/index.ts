import { Params, encrypt as sharedEncrypt, decrypt as sharedDecrypt } from "../../shared/js/crypto";

const params: Params = {
  crypto: window.crypto,
  stringToBuffer: str => new TextEncoder().encode(str),
  base64ToBuffer: base64 => new TextEncoder().encode(atob(base64)),
  bufferToBase64: buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)))
};

export async function encrypt(passphrase, plainText) {
  return sharedEncrypt(params, passphrase, plainText);
}

export async function decrypt(passphrase, cipherText) {
  return sharedDecrypt(params, passphrase, cipherText);
}
