#!/usr/bin/env node

const { decrypt } = require("../dist/src/index");

decrypt(process.argv[2], Buffer.from(process.argv[3], "base64").toString())
  .then(result => console.log(result))
  .catch(error => {
    console.error(error.toString());
    process.exit(1);
  });