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

# --- Keybindings -------------------------------------------------------------
# Flying-Z ships no shell framework, so keys Linux/macOS users expect (Home/End,
# Delete, Ctrl/Alt+arrow word-nav) must be bound explicitly. Older Cygwin
# consoles silently remapped these onto ^A/^E/^[f/^[b, so an unconfigured zsh
# appeared to "just work"; Cygwin 3.6's ConPTY rework instead passes the raw
# xterm escape sequences through. We bind both the normal-mode (ESC[) and
# application-mode (ESC O) forms so the keys work regardless of cursor mode.
bindkey -e                              # emacs keymap (explicit)
bindkey '^[[H'   beginning-of-line      # Home
bindkey '^[OH'   beginning-of-line
bindkey '^[[1~'  beginning-of-line
bindkey '^[[F'   end-of-line            # End
bindkey '^[OF'   end-of-line
bindkey '^[[4~'  end-of-line
bindkey '^[[3~'  delete-char            # Delete
bindkey '^[[1;5C' forward-word          # Ctrl+Right
bindkey '^[[1;5D' backward-word         # Ctrl+Left
bindkey '^[[1;3C' forward-word          # Alt+Right
bindkey '^[[1;3D' backward-word         # Alt+Left
bindkey ' '       magic-space           # expand !history references on space
bindkey '^[[Z'    reverse-menu-complete # Shift-Tab cycles the completion menu backwards
bindkey '^[[3;5~' kill-word             # Ctrl+Delete deletes the next word

# --- History -----------------------------------------------------------------
# Without a framework, zsh defaults to a tiny, in-memory-only history (HISTFILE
# unset, SAVEHIST=0 -> nothing persisted). Restore real persistence plus
# dedup/sharing, matching what Oh My Zsh's lib/history.zsh provided.
HISTFILE="$HOME/.zsh_history"
HISTSIZE=50000
SAVEHIST=10000
setopt extended_history          # record timestamps
setopt hist_expire_dups_first    # trim duplicates first when over SAVEHIST
setopt hist_ignore_dups          # don't log an immediately repeated command
setopt hist_ignore_space         # don't log commands prefixed with a space
setopt hist_verify               # confirm history-expanded lines before running
setopt share_history             # share history live across open tabs

# --- Colours -----------------------------------------------------------------
# Coloured `ls` + completion lists (Oh My Zsh's lib/theme-and-appearance.zsh).
# LS_COLORS is cached like the zoxide init below, to avoid a dircolors fork on
# every shell start.
if (( $+commands[dircolors] )); then
  _fz_dircolors="$HOME/.flying-z/cache/dircolors.zsh"
  if [[ ! -s $_fz_dircolors || $commands[dircolors] -nt $_fz_dircolors ]]; then
    command mkdir -p "${_fz_dircolors:h}" 2>/dev/null
    dircolors -b 2>/dev/null >| "$_fz_dircolors"
  fi
  [[ -s $_fz_dircolors ]] && source "$_fz_dircolors"
  unset _fz_dircolors
fi
alias ls='ls --color=auto'

# --- Shell options & aliases (Oh My Zsh lib/misc.zsh, lib/grep.zsh) ----------
setopt interactive_comments     # allow `# comments` on the interactive command line
setopt long_list_jobs           # list jobs in the long format by default
# Colourful grep that skips VCS / dependency dirs
alias grep="grep --color=auto --exclude-dir={.bzr,CVS,.git,.hg,.svn,.idea,.tox,.venv,node_modules}"

# Cached compinit: skip the slow audit + dump rebuild unless the dump is
# missing or older than 24h.
ZSH_COMPDUMP="${ZDOTDIR:-$HOME}/.zcompdump-${HOST/.*/}-${ZSH_VERSION}"
autoload -Uz compinit
if [[ -n $ZSH_COMPDUMP(#qNmh-24) ]]; then
  compinit -C -d "$ZSH_COMPDUMP"
else
  compinit -d "$ZSH_COMPDUMP"
fi

# Byte-compile the dump so zsh can mmap it instead of re-parsing ~1k lines.
if [[ -s "$ZSH_COMPDUMP" && (! -s "$ZSH_COMPDUMP.zwc" || "$ZSH_COMPDUMP" -nt "$ZSH_COMPDUMP.zwc") ]]; then
  zcompile "$ZSH_COMPDUMP"
fi

# --- Completion styling ------------------------------------------------------
# compinit (above) loads the completion system but configures nothing, leaving
# matching case-sensitive. Restore Oh My Zsh's lib/completion.zsh essentials --
# most importantly case-insensitive matching, so `cd fly<Tab>` finds Flying-Z.
zmodload -i zsh/complist
setopt complete_in_word always_to_end auto_menu
unsetopt menu_complete flowcontrol
WORDCHARS=''
# Case-insensitive, then partial-word, then substring matching.
zstyle ':completion:*' matcher-list 'm:{[:lower:][:upper:]}={[:upper:][:lower:]}' 'r:|=*' 'l:|=* r:|=*'
zstyle ':completion:*' menu select
zstyle ':completion:*' special-dirs true
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}
zstyle ':completion:*' use-cache yes
zstyle ':completion:*' cache-path "$HOME/.flying-z/cache/zcompcache"
zstyle ':completion:*:cd:*' tag-order local-directories directory-stack path-directories
zstyle ':completion:*' rehash true              # spot newly-installed binaries without `rehash`
zstyle '*' single-ignored show                  # if there's a lone ignored match, offer it anyway
# Enable bash-style completion scripts (many tools ship only a bash completer)
autoload -U +X bashcompinit && bashcompinit

# Directory niceties OMZ users expect (l/ll/la/lsa, md/rd, auto_pushd +
# numbered dirstack jumps) -- Oh My Zsh's lib/directories.zsh, vendored to
# ~/.flying-z/lib/ by the installer. Must come after compinit (compdef).
for _fz_lib in "$HOME"/.flying-z/lib/*.zsh(N); do
  source "$_fz_lib"
done
unset _fz_lib

_fz_theme="$HOME/.flying-z/themes/$ZSH_THEME.zsh-theme"
[[ -r $_fz_theme ]] && source $_fz_theme
unset _fz_theme

# Cache `zoxide init zsh` output: the fork costs ~40ms per shell under
# Cygwin. Regenerate whenever the zoxide binary is newer than the cache.
if (( $+commands[zoxide] )); then
  _fz_zoxide_init="$HOME/.flying-z/cache/zoxide-init.zsh"
  if [[ ! -s $_fz_zoxide_init || $commands[zoxide] -nt $_fz_zoxide_init ]]; then
    command mkdir -p "${_fz_zoxide_init:h}" 2>/dev/null
    zoxide init zsh 2>/dev/null >| "$_fz_zoxide_init"
  fi
  if [[ -s $_fz_zoxide_init ]]; then
    source "$_fz_zoxide_init"
  else
    # Cache dir unwritable; take the ~40ms fork rather than a broken shell
    eval "$(zoxide init zsh)"
  fi
  unset _fz_zoxide_init

  # zoxide is a native Windows exe (no Cygwin build exists). When Cygwin
  # spawns a native console app whose stdio is the pty, it attaches it to
  # Windows Terminal's pseudo console (ConPTY) -- which intermittently wedges
  # the tab until a keypress. The init-time fork above is cached; this keeps
  # the per-cd `zoxide add` hook off the pty entirely.
  if (( $+functions[__zoxide_hook] )); then
    __zoxide_hook() { command zoxide add -- "$(__zoxide_pwd)" </dev/null &>/dev/null }
  fi
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
  # NOTE: the `/ɀ` prefix here must match CYGDRIVE_PREFIX in src/constants.mjs
  # (the installer writes it into fstab and builds the C:\ɀ\c root junction from
  # the same value). If you change the prefix, change it there too.
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
