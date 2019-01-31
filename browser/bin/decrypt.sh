#!/usr/bin/env node

const util = require("util");
const path = require("path");
const { execFile } = require("child_process");

const puppetRunPath = path.resolve(__dirname, "..", "node_modules", ".bin", "puppet-run");
const scriptPath = path.resolve(__dirname, "decrypt.js");

util.promisify(execFile)(puppetRunPath, [ "--secure-origin", scriptPath, process.argv[2], Buffer.from(process.argv[3], "base64").toString() ])
  .then(result => console.log(result.stdout.trim()))
  .catch(error => {
    console.error(error.toString());
    process.exit(1);
  });
