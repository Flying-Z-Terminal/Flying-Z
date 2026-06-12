# Vendored unmodified (below this header) from Oh My Zsh, MIT licensed:
#   https://github.com/ohmyzsh/ohmyzsh/blob/ca5471fe496f00007727fd26db762d19519c2e8f/lib/directories.zsh
# Gives `l`/`ll`/`la`/`lsa`, `md`/`rd`, and the auto_pushd dirstack
# (`d`, `1`..`9`, `-`) the exact behavior OMZ users expect, without the
# framework loader. The installer ships this to ~/.flying-z/lib/.

# Changing/making/removing directory
setopt auto_cd
setopt auto_pushd
setopt pushd_ignore_dups
setopt pushdminus


alias -g ...='../..'
alias -g ....='../../..'
alias -g .....='../../../..'
alias -g ......='../../../../..'

alias -- -='cd -'
alias 1='cd -1'
alias 2='cd -2'
alias 3='cd -3'
alias 4='cd -4'
alias 5='cd -5'
alias 6='cd -6'
alias 7='cd -7'
alias 8='cd -8'
alias 9='cd -9'

alias md='mkdir -p'
alias rd=rmdir

function d () {
  if [[ -n $1 ]]; then
    dirs "$@"
  else
    dirs -v | head -n 10
  fi
}
compdef _dirs d

# List directory contents
alias lsa='ls -lah'
alias l='ls -lah'
alias ll='ls -lh'
alias la='ls -lAh'
