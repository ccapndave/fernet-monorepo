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
  Generate a key from the given passphrase.  Since generating a key is costly, this function
  is exposed separately from `encrypt`

  ## Options

    - iterations: The number of iterations to use during PBKDF2 key derivation (default 10000).

  """
  def generate_key(passphrase, options \\ []) do
    iterations = Keyword.get(options, :iterations, 100_000)
    salt = :crypto.strong_rand_bytes(16)

    with {:ok, key} <-
           :pbkdf2.pbkdf2(
             :sha256,
             passphrase,
             salt,
             iterations,
             32
           ) do
      {:ok,
       %{
         iterations: iterations,
         salt: salt,
         key: key
       }}
    end
  end

  @doc ~S"""
  Encrypt the given text with the given passphrase.

  ## Options

    - iterations: The number of iterations to use during PBKDF2 key derivation (default 10000).

  """
  def encrypt(passphrase, plaintext, options \\ [])

  def encrypt(passphrase, plaintext, options) when is_binary(passphrase) do
    with {:ok, key} <- generate_key(passphrase, options) do
      encrypt(key, plaintext, options)
    end
  end

  def encrypt(%{iterations: iterations, salt: salt, key: key}, plaintext, _options) do
    with {:ok, _, token} <- Fernet.generate(plaintext, key: key) do
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
