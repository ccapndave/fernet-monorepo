import { Params, encrypt as sharedEncrypt, decrypt as sharedDecrypt } from "../../shared/js/crypto";
import * as WebCrypto from "node-webcrypto-ossl";

const params: Params = {
  crypto: new WebCrypto(),
  stringToBuffer: str => Buffer.from(str, "utf-8"),
  base64ToBuffer: base64 => Buffer.from(base64, "base64"),
  bufferToBase64: buffer => btoa(String.fromCharCode(...new Uint8Array(buffer))),
};

export async function encrypt(passphrase: string, plainText: string) {
  return sharedEncrypt(params, passphrase, plainText);
}

export async function decrypt(passphrase: string, cipherText: string) {
  return sharedDecrypt(params, passphrase, cipherText);
}
