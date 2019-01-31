import { encrypt as sharedEncrypt, decrypt as sharedDecrypt } from "./passphrase";

(<any>window).Buffer = require("buffer").Buffer;

export async function encrypt(passphrase: string, plainText: string) {
  return sharedEncrypt(window.crypto, passphrase, plainText);
}

export async function decrypt(passphrase: string, cipherText: string) {
  return sharedDecrypt(window.crypto, passphrase, cipherText);
}
