## Flying-Z: One-click Cygwin/Zsh Installer for Windows Terminal

![image](https://github.com/user-attachments/assets/44f5af79-3522-4a04-ac86-ddea3fce9488)

## Why

Working on Linux and macOS most of the time, I wanted a more unified terminal experience when working on Windows.

While WSL is great, it has limitations: native filesystem access is slow, using it alongside other virtualization tools can be challenging, and it can be a pain to set up. Additionally, you can't use native Windows commands inside of it.

Setting up a nice Cygwin environment was such a chore, but that's no more!

## Features

- Polished Linux-like terminal on Windows 11 with one-click installation
- Installs [Cygwin](https://www.cygwin.com/index.html) and selected utils
- Installs [Zoxide](https://github.com/ajeetdsouza/zoxide)
- Installs [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- Installs [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts) (`CaskaydiaCove Nerd Font Mono`)
- Custom light/dark Windows-focused ZSH theme based on [Hapin](https://github.com/hanamiyuna/hapin-zsh-theme) — see [Switching to the light theme](#switching-to-the-light-theme)
- Fast shell startup (~0.2 s cold) — no shell framework, cached completion init, cached `zoxide` init, and fork-free prompt plumbing
- Familiar directory niceties (`l`/`ll`/`la`, `md`/`rd`, `d` + numbered dirstack jumps) — Oh My Zsh's `lib/directories.zsh`, vendored without the framework loader
- One-command in-place updates via `flying-z-update` (signature-verified Cygwin upgrade + zoxide/GCM refresh) — see [Keeping up to date](#keeping-up-to-date)
- Automatic Windows Terminal profile configuration
- Integration with **Context Menu → Open in Terminal**
- Linux-style <kbd>Ctrl+Alt+T</kbd> hotkey to open the terminal
- Custom `cd` command silently corrects casing to match the underlying filesystem
- Sets Windows Terminal delimiter to Linux-like behavior
- Includes simple helper scripts for better Windows integration
  - `wpwd` – Return Windows path of current directory
  - `xplor` – Open Explorer in current directory

## Limitations of Flying-Z

- Not a full Linux environment (Cygwin-based)
- `git` status indicators are slow in large repos [(help wanted)](https://github.com/Flying-Z-Terminal/Flying-Z/issues/3)
- Hotkey relies on a desktop shortcut and requires logout or reboot to activate
- Mouse and wheel interactions are imperfect. Must hold <kbd>Shift</kbd> to select text under certain circumstances
- Terminal icon color cannot be set per theme [(help wanted - external)](https://github.com/microsoft/terminal/issues/15264#issuecomment-2491023334)
- Some applications can detect paths incorrectly (eg. `subl ~/.zshrc`). Flying-Z resolves the common case via root junctions (see [How native apps resolve POSIX paths](#how-native-apps-resolve-posix-paths)), but only while the app's working directory is on the `C:` drive [(help wanted)](https://github.com/Flying-Z-Terminal/Flying-Z/issues/2)

## Tips

#### How native apps resolve POSIX paths

Cygwin doesn't translate POSIX paths when it launches a **native** Windows app, so `subl ~/.zshrc` hands Sublime the literal string `/home/<you>/.zshrc`, and `git`/editors/etc. get raw `/…` paths. Windows resolves those against the current drive root. Flying-Z makes that land on the real files by creating two junctions at the `C:` root during install:

- `C:\home` → `C:\Flying-Z\home` (covers `/home/<you>/…`)
- `C:\ɀ\c` → `C:\` (covers `/ɀ/c/…` — `ɀ` is Flying-Z's short cygdrive prefix, replacing `/cygdrive`)

Both junctions are **hardened**: an `icacls` deny-"List Folder" ACE for Everyone blocks *enumeration* through them, so junction-following recursive deleters (`git clean`, `del /s`, `robocopy /MIR`, `Remove-Item -Recurse`) can't descend into the target. Opening a path that goes **into a subdirectory** of the target still works (descending needs Traverse, which isn't denied — only List is), which covers every normal path: `/ɀ/c/Users/…`, `/ɀ/c/Projects/…`, `/home/<you>/…`.

The `C:\ɀ\c → C:\` junction points at the whole drive, so the installer **proves** on your machine that this hardening actually blocks enumeration and deletion *before* forming any junction; if it can't prove it, it forms none (path resolution is disabled rather than risked).

**When the deny-List can bite (rare):** because List is denied, a **native Windows app** handed one of these prefixed paths can't open a file that sits *directly at the junction's target root*, nor list that root itself. Concretely:

- For `C:\ɀ\c → C:\`: a file living right at `C:\` (e.g. `/ɀ/c/pagefile.sys`, or `/ɀ/c/note.txt` for a `C:\note.txt` you created), and a bare listing of `/ɀ/c`.
- For `C:\home → C:\Flying-Z\home`: a file dropped directly in the home *root* (`/home/somefile`).

Anything that descends into a **subdirectory** is fine — which is every real path, including `/home/<you>/.zshrc` (it's inside your user folder `C:\home\<you>\`, reached by descending, not by listing the home root). Two things keep this from mattering in practice: your **Cygwin shell** is unaffected — it reaches `/ɀ/c` through Cygwin's own fstab mount, not the Windows junction, so `ls /ɀ/c` works normally — and real native-app paths descend into a subdirectory. If you ever hit it, hand the app the file's real Windows path (`C:\note.txt`) instead of the prefixed one.

Caveat: resolution only works while the native app's working directory is on the `C:` drive (POSIX paths resolve against the *current* drive).



#### Switching to the light theme

Flying-Z ships both Hapin variants to `~/.flying-z/themes/` and installs a light color scheme into Windows Terminal alongside the default dark one:

1. In `~/.zshrc`, set `ZSH_THEME="hapin-z-light"` (the toggle is right there, commented out).
2. In Windows Terminal settings, switch the Flying-Z profile's color scheme from `zenwritten_dark_flying_z` to `one_half_light_z`.

#### Installing Oh My Zsh alongside Flying-Z

Flying-Z does not install Oh My Zsh — sourcing OMZ's framework loader on every shell adds ~600 ms hot path (plus occasional multi-second freezes when its completion dump invalidates). The Hapin theme, `zoxide`, a cached `compinit`, and OMZ's directory aliases (its `lib/directories.zsh`, vendored to `~/.flying-z/lib/`) are wired up directly in `~/.zshrc`.

If you want OMZ's plugin ecosystem (or its built-in aliases) on top of Flying-Z, you can install it yourself without losing the Hapin theme:

1. Install OMZ:
   ```
   sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --keep-zshrc
   ```
   The `--keep-zshrc` flag preserves Flying-Z's `~/.zshrc`. (If you skip it, OMZ will back yours up to `~/.zshrc.pre-oh-my-zsh` and overwrite it with its own.)

2. Add OMZ's loader to your `~/.zshrc`, right above the line that sources the Hapin theme:
   ```
   export ZSH="$HOME/.oh-my-zsh"
   plugins=(git zoxide)        # or whichever OMZ plugins you want
   source $ZSH/oh-my-zsh.sh
   ```

3. Keep the existing `source "$HOME/.flying-z/themes/$ZSH_THEME.zsh-theme"` line right where it is — sourcing it *after* OMZ ensures the Hapin prompt wins. (Flying-Z ships Hapin to `~/.flying-z/themes/` rather than to `~/.oh-my-zsh/custom/themes/`, so OMZ's `ZSH_THEME` lookup won't find it; sourcing directly is simpler than symlinking.)

#### Git Credential Manager

GCM comes installed, but you'll still need to configure it.

Add to `~/.gitconfig`:

```
[credential]
        helper = /usr/libexec/git-core/git-credential-manager.exe
        credentialStore = wincredman
```

You may also wish to add:

```
[core]
        pager = less -R --mouse
```

## Keeping up to date

Flying-Z ships a `flying-z-update` command that upgrades your whole environment in place — you never have to visit cygwin.com or click through the installer wizard yourself. From any Flying-Z terminal:

```
flying-z-update
```

It will:

1. Download the **official Cygwin installer** and **verify its PGP signature** before running anything (a bad signature aborts the update).
2. Upgrade **every installed Cygwin package** to the latest version (`setup --upgrade-also`), and pull in any packages newly added to the Flying-Z default set.
3. Refresh the bundled extras that don't come from Cygwin: **[zoxide](https://github.com/ajeetdsouza/zoxide)** and **[Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)** (latest release).

Options:

| Flag | Effect |
| --- | --- |
| `--packages-only` | Upgrade Cygwin packages only (skip zoxide / GCM) |
| `--apps-only` | Refresh zoxide + Git Credential Manager only |
| `--mirror <url>` | Use a specific Cygwin mirror (default: `mirrors.rit.edu`) |
| `-y`, `--yes` | Skip the "close other tabs" confirmation prompt |
| `-h`, `--help` | Show usage |

> [!IMPORTANT]
> Upgrading replaces core files that running shells hold open — most notably `cygwin1.dll`, and Cygwin does not allow one process to straddle two DLL versions. **Close your other terminal tabs before updating, and restart your tabs once it finishes.** If the installer reports that it deferred any in-use files, reboot to complete them. `flying-z-update` warns you about this and pauses (unless you pass `-y`).

### Adding additional packages

`flying-z-update` upgrades what you already have; it doesn't pick new packages for you. To add packages, run the Cygwin installer's package screen once — `flying-z-update` keeps them upgraded afterward. Either launch `setup-x86_64.exe` from cygwin.com and point it at your Flying-Z root (`C:\Flying-Z`), or install a single package non-interactively, e.g.:

```
setup-x86_64.exe --quiet-mode --no-admin --root C:\Flying-Z \
  --site https://mirrors.rit.edu/cygwin/ --packages tmux
```

## Why did you:

- **Write it in JavaScript?** Because I wouldn't have had the time otherwise.
- **Drop Oh My Zsh?** Earlier versions of Flying-Z installed it; its framework loader was responsible for ~70% of shell startup time. Most of what it did (theme loading, `zoxide`, completion init) is a few lines of vanilla zsh, and the aliases people actually expect (`l`, `ll`, `md`, …) are kept by vendoring OMZ's `lib/directories.zsh` alone. See [Installing Oh My Zsh alongside Flying-Z](#installing-oh-my-zsh-alongside-flying-z) if you want it back.
- **Make any other choice?** Since the code is open source, I didn't necessarily think a huge amount of customizability was worth my effort. I'm happy to accept PRs to improve this project.

## License

**This project uses separate licenses for different aspects.**

- [**Code** - MIT licensed.](/LICENSE_CODE)
- [**Flying-Z name, logo, icons, and images** - Proprietary.](./LICENSE_ASSETS)
  - These assets are not covered by the MIT License and may not be used, modified, or distributed without explicit written permission. All rights to the art and Flying-Z brand are reserved.

_[© 2025 Remie Smith](https://remiesmith.com)_

---

**Inspired by** [**babun**](https://github.com/babun/babun)
