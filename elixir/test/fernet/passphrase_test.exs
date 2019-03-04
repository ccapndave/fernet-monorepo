defmodule Fernet.PassphraseTest do
  use ExUnit.Case
  import Fernet.Passphrase
  doctest Fernet.Passphrase

  test "encryption symmetry" do
    passphrase = "password"
    plaintext = "something to encrypt"

    {:ok, ciphertext} = encrypt(passphrase, plaintext)
    {:ok, decrypted_text} = decrypt(passphrase, ciphertext)

    assert plaintext == decrypted_text
  end

  test "reused key" do
    passphrase = "password"
    {:ok, key} = generate_key(passphrase)

    plaintext = "something to encrypt"
    {:ok, ciphertext} = encrypt(key, plaintext)
    {:ok, decrypted_text} = decrypt(passphrase, ciphertext)
    assert plaintext == decrypted_text

    plaintext = "something else to encrypt"
    {:ok, ciphertext} = encrypt(key, plaintext)
    {:ok, decrypted_text} = decrypt(passphrase, ciphertext)
    assert plaintext == decrypted_text

    plaintext = "and something else to encrypt"
    {:ok, ciphertext} = encrypt(key, plaintext)
    {:ok, decrypted_text} = decrypt(passphrase, ciphertext)
    assert plaintext == decrypted_text

    plaintext = "this should fail"
    {:ok, ciphertext} = encrypt(key, plaintext)
    {:error, _} = decrypt(passphrase <> "wrong", ciphertext)
  end
end
