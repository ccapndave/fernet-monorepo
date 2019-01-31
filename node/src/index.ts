import { encrypt as sharedEncrypt, decrypt as sharedDecrypt } from "./passphrase";
import * as WebCrypto from "node-webcrypto-ossl";

const crypto = new WebCrypto();

export async function encrypt(passphrase: string, plainText: string) {
  return sharedEncrypt(crypto, passphrase, plainText);
}

export async function decrypt(passphrase: string, cipherText: string) {
  return sharedDecrypt(crypto, passphrase, cipherText);
}
