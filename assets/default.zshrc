# Flying-Z .zshrc
#
# To add Oh My Zsh (or another framework) on top of this config, see the
# project README:
#   https://github.com/Flying-Z-Terminal/Flying-Z#installing-oh-my-zsh-alongside-flying-z

# Auto-dedupe PATH so re-sourcing this file never piles up duplicates
typeset -U path

export PATH=$PATH:~/.flying-z/scripts:~/.local/bin

# NOTE: Do not use Git for Windows, it breaks Windows Terminal. # TODO: Document relevant issue
# export PATH=$PATH:"/cygdrive/c/Program Files/Gitbin" # Breaks Windows Terminal

# Theme -- ships in ~/.flying-z/themes/
ZSH_THEME="hapin-z"
#ZSH_THEME="hapin-z-light"

autoload -U colors && colors # Fix colors - https://stackoverflow.com/a/2534676/

# Cached compinit: skip the slow audit + dump rebuild unless the dump is
# missing or older than 24h.
ZSH_COMPDUMP="${ZDOTDIR:-$HOME}/.zcompdump-${HOST/.*/}-${ZSH_VERSION}"
autoload -Uz compinit
if [[ -n $ZSH_COMPDUMP(#qNmh-24) ]]; then
  compinit -C -d "$ZSH_COMPDUMP"
else
  compinit -d "$ZSH_COMPDUMP"
fi

source "$HOME/.flying-z/themes/$ZSH_THEME.zsh-theme"

if (( $+commands[zoxide] )); then
  eval "$(zoxide init zsh)"
fi

export LESS="-R --mouse" # Wheel scroll in `git log`

# Ensure `cd` command opens path matching underlying filesystem casing because case insensitive paths can break some applications + handle `cd /z` as a safer alternative to `ln -s /ɀ /z`
cd() {
  emulate -L zsh
  setopt extended_glob

  # If the -i flag is passed, fallback to the original cd
  if [[ "$1" == "-i" ]]; then
    shift
    builtin cd "$@"
    return $?
  fi

  # Custom behavior: redirect `cd /z` to `cd /ɀ`
  if [[ "$1" == "/z" ]]; then
    builtin cd "/ɀ"
    return $?
  fi

  # If no arguments are provided, go to the home directory
  if [[ -z "$1" ]]; then
    builtin cd
    return $?
  fi

  # Split the argument into dir + base without forking dirname/basename.
  # Strip a single trailing slash so `cd foo/` behaves like `cd foo`.
  local arg="${1%/}"
  if [[ -z "$arg" ]]; then
    builtin cd "/"
    return $?
  fi

  local dir base
  if [[ "$arg" == */* ]]; then
    dir="${arg%/*}"
    [[ -z "$dir" ]] && dir="/"
    base="${arg##*/}"
  else
    dir="."
    base="$arg"
  fi

  # Case-correct by iterating $dir and matching against a lowercased basename.
  # We can't use a (#i) glob here: on Cygwin's case-insensitive NTFS, zsh
  # returns the pattern's casing, not the on-disk casing, which would defeat
  # the whole point of this function. Iterating is fork-free and gives us the
  # actual filesystem casing via ${entry:t}. (ND-/) → nullglob, include
  # dotfiles, follow symlinks, directories only.
  local entry corrected=
  local lower_base=${base:l}
  for entry in $dir/*(ND-/); do
    if [[ ${entry:t:l} == $lower_base ]]; then
      corrected=$entry
      break
    fi
  done

  if [[ -n $corrected ]]; then
    builtin cd "$corrected"
  else
    # Fall back to the original path if correction fails
    builtin cd "$1"
  fi
}
