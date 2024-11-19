# Hapin-Z theme for Zsh
#
# Hapin-Z modifications by Remie Smith
#
# Hapin Author: Hanami Yuna <github@yutsuki.moe>
# 
# Original from Oxide
# Author: Diki Ananta <diki1aap@gmail.com>
# Repository: https://github.com/dikiaap/dotfiles
# License: MIT

# Define colors and styles before setting PROMPT_SUBST option
# This makes sure they are only defined once.

# Use True color (24-bit) if available.
hapin_turquoise="%F{73}"
hapin_orange="%F{179}"
hapin_red="%F{167}"
hapin_limegreen="%F{107}"
hapin_lightblue="%F{#46a7b9}"

# Reset color.
hapin_reset_color="%f"

# VCS style formats.
FMT_UNSTAGED="%{$hapin_reset_color%} %{$hapin_orange%}●"
FMT_STAGED="%{$hapin_reset_color%} %{$hapin_limegreen%}✚"
FMT_ACTION="(%{$hapin_limegreen%}%a%{$hapin_reset_color%})"
FMT_VCS_STATUS="on %{$hapin_turquoise%} %b%u%c%{$hapin_reset_color%}"

# Turn on the PROMPT_SUBST option.
setopt PROMPT_SUBST;

autoload -U add-zsh-hook
autoload -Uz vcs_info # TODO: Investigate using gitstatus instead of vcs_info - https://github.com/romkatv/gitstatus

zstyle ':vcs_info:*' enable git svn
zstyle ':vcs_info:*' check-for-changes true
zstyle ':vcs_info:*' unstagedstr    "${FMT_UNSTAGED}"
zstyle ':vcs_info:*' stagedstr      "${FMT_STAGED}"
zstyle ':vcs_info:*' actionformats  "${FMT_VCS_STATUS} ${FMT_ACTION}"
zstyle ':vcs_info:*' formats        "${FMT_VCS_STATUS}"
zstyle ':vcs_info:*' nvcsformats    ""
zstyle ':vcs_info:git*+set-message:*' hooks git-untracked

# Optimized check for untracked files.
+vi-git-untracked() {
    if [[ $(git rev-parse --is-inside-work-tree 2> /dev/null) == 'true' ]]; then
        if [[ -n $(git ls-files --others --exclude-standard) ]]; then
            hook_com[staged]+="%{$hapin_reset_color%} %{$hapin_red%}●"
        fi
    fi
}

# Executed before each prompt.
add-zsh-hook precmd vcs_info

# Oxide prompt style.
PROMPT=$'\n%{$hapin_lightblue%}%~%{$hapin_reset_color%} ${vcs_info_msg_0_}\n%(?.%{%F{white}%}.%{$hapin_red%})%(!.#.❯)%{$hapin_reset_color%} '

RPROMPT='%F{#333}$(cygpath -w "$PWD")%f'
