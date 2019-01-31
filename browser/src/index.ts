import { encrypt as sharedEncrypt, decrypt as sharedDecrypt } from "./passphrase";

(<any>self).Buffer = require("buffer").Buffer;

export async function encrypt(passphrase: string, plainText: string) {
  return sharedEncrypt(self.crypto, passphrase, plainText);
}

export async function decrypt(passphrase: string, cipherText: string) {
  return sharedDecrypt(self.crypto, passphrase, cipherText);
}
