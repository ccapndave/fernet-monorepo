import "mocha";
import { assert } from "chai";
import * as casual from "casual";
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const implementations = fs
  .readdirSync(".", { withFileTypes: true })
  .filter(dirent => !dirent.name.startsWith(".") && dirent.name !== "node_modules")
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const flatten = list => list.reduce((a, b) => a.concat(b), []);

let implementationMatrix;
if (process.argv[ process.argv.length - 1 ] === "test-all.ts") {
  implementationMatrix = flatten(
    implementations.map(i =>
      implementations.map(j =>
        [ i, j ]
      )
    )
  );
} else {
  implementationMatrix = [ [ process.argv[ process.argv.length - 2 ], process.argv[ process.argv.length - 1 ] ] ];
}

const numberOfTests = 1;

implementationMatrix.forEach(([ fromImplementation, toImplementation ]) => {
  describe(`${fromImplementation} => ${toImplementation}`, function () {

    for (let n = 0; n < numberOfTests; n++) {
      const passphrase = casual.word;
      const plainText = casual.text;

      it(`passphrase=${passphrase}, plaintext=${plainText}`, async function () {
        try {
          this.timeout(10000);

          const encrypted = await encrypt(fromImplementation, passphrase, plainText);
          const decrypted = await decrypt(toImplementation, passphrase, encrypted.trim());

          assert.equal(decrypted.trim(), plainText.trim());
        } catch (e) {
          console.log(e);
          throw e;
        };
      });
    }

  });
});

const encrypt = async (implemention: string, passphrase: string, plaintext: string) => {
  return promisify(execFile)(
    path.resolve(".", implemention, "bin", "encrypt.sh"),
    [ passphrase, plaintext ]
  ).then(({ stdout }) => stdout);
};

const decrypt = async (implemention: string, passphrase: string, cipherText: string) => {
  return promisify(execFile)(
    path.resolve(".", implemention, "bin", "decrypt.sh"),
    [ passphrase, cipherText ]
  ).then(({ stdout }) => stdout);
};