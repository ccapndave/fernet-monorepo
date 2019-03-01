defmodule Fernet.PassphraseTest do
  use ExUnit.Case
  doctest Fernet.Passphrase

  test "greets the world" do
    assert Fernet.Passphrase.hello() == :world
  end
end
