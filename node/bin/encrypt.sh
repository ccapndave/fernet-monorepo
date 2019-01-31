#!/usr/bin/env node

const { encrypt } = require("../dist/src/index");

encrypt(process.argv[2], process.argv[3])
  .then(result => console.log(Buffer.from(result).toString("base64")))
  .catch(error => {
    console.error(error.toString());
    process.exit(1);
  });