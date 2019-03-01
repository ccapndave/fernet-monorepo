cd "$(dirname "${BASH_SOURCE[0]}")/.."
mix compile
mix decrypt "$1" "$2"