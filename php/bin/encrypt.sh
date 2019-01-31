#!/usr/bin/env php
<?php
require __DIR__ . '/../vendor/autoload.php';

use Passphrase\Passphrase;

echo(base64_encode((new Passphrase())->encrypt($argv[1], $argv[2]))."\n");