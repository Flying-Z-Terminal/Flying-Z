## Flying-Z: One-click Cygwin/Zsh Installer for Windows Terminal

![image](https://github.com/user-attachments/assets/44f5af79-3522-4a04-ac86-ddea3fce9488)

## Why

Working on Linux and macOS most of the time, I wanted a more unified terminal experience when working on Windows.

While WSL is great, it has limitations: native filesystem access is slow, using it alongside other virtualization tools can be challenging, and it can be a pain to set up. Additionally, you can't use native Windows commands inside of it.

Setting up a nice Cygwin environment was such a chore, but that's no more!

## Features

- Polished Linux-like terminal on Windows 11 with one-click installation
- Installs [Cygwin](https://www.cygwin.com/index.html) and selected utils
- Installs [Oh My Zsh](https://ohmyz.sh/)
- Installs [Zoxide](https://github.com/ajeetdsouza/zoxide)
- Installs [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- Installs [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts) (`CaskaydiaCove Nerd Font Mono`)
- Custom light/dark Windows-focused ZSH theme based on [Hapin](https://github.com/hanamiyuna/hapin-zsh-theme)
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
- Some applications can detect paths incorrectly (eg. `subl ~/.zshrc`) [(help wanted)](https://github.com/Flying-Z-Terminal/Flying-Z/issues/2)

## Tips

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

## Keeping up to date (and adding additional packages)

There's no built-in updater at this time, so it's advised you periodically download the latest Cygwin installer and run it. Unless you have another Cygwin installation on the machine, it should automatically find the installation from Flying-Z. When you run the installer, just press "Next" all the way through to have your environment upgraded.

Similarly, if you need additional packages you can find them and select them on the package management screen of the Cygwin installer.

## Why did you:

- **Write it in JavaScript?** Because I wouldn't have had the time otherwise.
- **Choose Oh My Zsh?** Some claim it's outdated. I personally still favor it - and most importantly, it works on Windows.
- **Make any other choice?** Since the code is open source, I didn't necessarily think a huge amount of customizability was worth my effort. I'm happy to accept PRs to improve this project.

## License

**This project uses separate licenses for different aspects.**

- [**Code** - MIT licensed.](/LICENSE_CODE)
- [**Flying-Z name, logo, icons, and images** - Proprietary.](./LICENSE_ASSETS)
  - These assets are not covered by the MIT License and may not be used, modified, or distributed without explicit written permission. All rights to the art and Flying-Z brand are reserved.

_[© 2025 Remie Smith](https://remiesmith.com)_

---

**Inspired by** [**babun**](https://github.com/babun/babun)
