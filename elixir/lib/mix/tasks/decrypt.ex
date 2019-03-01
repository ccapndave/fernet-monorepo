defmodule Mix.Tasks.Decrypt do
  use Mix.Task

  @impl Mix.Task
  def run([passphrase, ciphertext]) do
    {:ok, plaintext} = Fernet.Passphrase.decrypt(passphrase, ciphertext |> Base.decode64!())
    IO.puts(plaintext)
  end
end
