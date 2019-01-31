<?php
namespace Passphrase;

use Fernet\Fernet;

class Passphrase {

  function __construct() {

  }

  public function encrypt(string $passphrase, string $plaintext): string {
    $iterations = 10000;
    $salt = openssl_random_pseudo_bytes(16);

    $cryptoKey = hash_pbkdf2("sha256", $passphrase, $salt, $iterations, 43);
    $token = (new Fernet($cryptoKey))->encode($plaintext);

    return json_encode([
      "config" => [
        "iterations" => $iterations,
        "salt" => self::base64url_encode($salt)
      ],
      "token" => $token
    ]);
  }

  public function decrypt(string $passphrase, string $cipherText): string {
    $decoded = json_decode($cipherText);

    $cryptoKey = hash_pbkdf2("sha256", $passphrase, self::base64url_decode($decoded->config->salt), $decoded->config->iterations, 43);
    $token = (new Fernet($cryptoKey))->decode($decoded->token);

    if (!$token) {
      throw new \Exception("Unable to decrypt");
    }

    return $token;
  }

  /**
   * Encodes data encoded with Base 64 Encoding with URL and Filename Safe Alphabet.
   *
   * @param string $data the data to encode
   * @param bool $pad whether padding characters should be included
   * @return string the encoded data
   * @link http://tools.ietf.org/html/rfc4648#section-5
   */
  static public function base64url_encode($data, $pad = true) {
    $encoded = strtr(base64_encode($data), '+/', '-_');
    if (!$pad) $encoded = trim($encoded, '=');
    return $encoded;
  }

  /**
   * Decodes data encoded with Base 64 Encoding with URL and Filename Safe Alphabet.
   *
   * @param string $data the encoded data
   * @return string|bool the original data or FALSE on failure. The returned data may be binary.
   * @link http://tools.ietf.org/html/rfc4648#section-5
   */
  static public function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
  }

}