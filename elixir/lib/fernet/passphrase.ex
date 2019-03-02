defmodule Fernet.Passphrase do
  @moduledoc """
  This module provides function to encrypt and decrypt a string using a passphrase.
  The implementation is designed to work cross-language; currently there are
  packages for the browser (using the WebCrypto API), NodeJS and PHP.

  ## Details
  The passphrase is converted to a key using PBKDF2 with a random salt, and then
  this is used as a key for Fernet encryption.
  """

  @doc ~S"""
  Encrypt the given text with the given passphrase.

  ## Options

    - iterations: The number of iterations to use during PBKDF2 key derivation (default 10000).

  """
  def encrypt(passphrase, plaintext, options \\ []) do
    iterations = Keyword.get(options, :iterations, 10000)
    salt = :crypto.strong_rand_bytes(16)

    with {:ok, key} <-
           :pbkdf2.pbkdf2(
             :sha256,
             passphrase,
             salt,
             iterations,
             32
           ),
         {:ok, _, token} <- Fernet.generate(plaintext, key: key) do
      %{
        config: %{
          iterations: iterations,
          salt: salt |> Base.encode64()
        },
        token: token
      }
      |> Jason.encode()
    end
  end

  @doc ~S"""
  Decrypt the given ciphertext with the given passphrase.
  """
  def decrypt(passphrase, ciphertext) do
    %{"config" => %{"iterations" => iterations, "salt" => salt}, "token" => token} =
      Jason.decode!(ciphertext)

    with {:ok, key} <-
           :pbkdf2.pbkdf2(
             :sha256,
             passphrase,
             salt |> Base.decode64!(),
             iterations,
             32
           ),
         {:ok, {_, plaintext}} <- Fernet.verify(token, key: key) do
      {:ok, plaintext}
    end
  end
end
