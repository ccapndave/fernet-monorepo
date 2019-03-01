defmodule Fernet.Passphrase.MixProject do
  use Mix.Project

  def project do
    [
      app: :fernet_passphrase,
      version: "0.1.0",
      elixir: "~> 1.8",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:pbkdf2, "~> 2.0"},
      {:fernetex, "~> 0.3.1"},
      {:jason, "~> 1.1.2"}
    ]
  end
end
