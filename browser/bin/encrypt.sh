#!/usr/bin/env node

const util = require("util");
const path = require("path");
const { execFile } = require("child_process");

const puppetRunPath = path.resolve(__dirname, "..", "node_modules", ".bin", "puppet-run");
const scriptPath = path.resolve(__dirname, "encrypt.js");

util.promisify(execFile)(puppetRunPath, [ "--secure-origin", scriptPath, process.argv[2], process.argv[3] ])
  .then(result => console.log(Buffer.from(result.stdout.trim()).toString("base64")))
  .catch(error => {
    console.error(error.toString());
    process.exit(1);
  });
