#!/usr/bin/env php
<?php
require __DIR__ . '/../vendor/autoload.php';

use Passphrase\Passphrase;

echo((new Passphrase())->decrypt($argv[1], base64_decode($argv[2]))."\n");