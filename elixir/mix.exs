defmodule Fernet.Passphrase.MixProject do
  use Mix.Project

  def project do
    [
      app: :fernet_passphrase,
      version: "1.1.0",
      elixir: "~> 1.8",
      start_permanent: Mix.env() == :prod,
      description: description(),
      package: package(),
      deps: deps(),
      source_url: "https://github.com/ccapndave/fernet-monorepo"
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
      {:jason, "~> 1.1.2"},
      {:ex_doc, ">= 0.0.0", only: :dev}
    ]
  end

  defp description() do
    "A package to encrypt and decrypt a string based on a passphrase."
  end

  defp package() do
    [
      licenses: ["MIT"],
      links: %{"GitHub" => "https://github.com/ccapndave/fernet-monorepo"}
    ]
  end
end
