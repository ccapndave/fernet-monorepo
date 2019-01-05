/* import "mocha";
import { assert } from "chai";
import * as casual from "casual";
import { encrypt, decrypt } from "../src";

describe("Node encrypt decrypt", () => {

  for (let n = 1; n < 100; n++) {
    const passphrase = casual.word;
    const plainText = casual.text;

    it(`passphrase=${passphrase}, plaintext=${plainText}`, async () => {
      const encrypted = await encrypt(passphrase, plainText);
      const decrypted = await decrypt(passphrase, encrypted);

      assert.equal(plainText, decrypted);
    });
  }

}); */

console.log("yy");