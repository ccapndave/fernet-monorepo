defmodule Fernet.Passphrase do
  @moduledoc """
  Documentation for Fernet.Passphrase.
  """

  @doc """
  Hello world.

  ## Examples

      iex> Fernet.Passphrase.hello()
      :world

  """
  def encrypt(passphrase, plaintext) do
    iterations = 10000
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
