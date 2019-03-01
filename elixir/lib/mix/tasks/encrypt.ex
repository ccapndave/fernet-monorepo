defmodule Mix.Tasks.Encrypt do
  use Mix.Task

  @impl Mix.Task
  def run([passphrase, plaintext]) do
    {:ok, ciphertext} = Fernet.Passphrase.encrypt(passphrase, plaintext)
    IO.puts(ciphertext |> Base.encode64())
  end
end
