cd "$(dirname "${BASH_SOURCE[0]}")/.."
mix compile
mix encrypt "$1" "$2"