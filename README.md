# Flying-Z: One-click Cygwin/ZSH Installer for Windows 11

![image](https://github.com/user-attachments/assets/dd7ebac2-d8da-4839-90b9-fc482fb203c2)

## Why

Working on Linux and macOS most of the time, I wanted a more unified terminal experience when working on Windows.

While WSL is great, it has limitations: native filesystem access is slow, using it alongside other virtualization tools can be challenging, and it can be a pain to set up. Additionally, you can't use native Windows commands inside of it.

## Features

- Polished terminal with one-click installation
- Installs [Oh My Zsh](https://ohmyz.sh/)
- Installs [Zoxide](https://github.com/ajeetdsouza/zoxide)
- Installs [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- Installs [Nerd Fonts](https://github.com/ryanoasis/nerd-fonts) (`CaskaydiaCove Nerd Font Mono`)
- Custom light/dark Windows-focused ZSH theme based on [Hapin](https://github.com/hanamiyuna/hapin-zsh-theme) and other work
- Automatic Windows Terminal profile configuration
- Integration with **Context Menu → Open in Terminal**
- Linux-style <kbd>Ctrl+Alt+T</kbd> hotkey to open the terminal
- Includes `wpwd` helper script (returns Windows path equivalent to `pwd`)
- Custom `cd` command silently corrects casing to match the underlying filesystem
- Sets Windows Terminal delimiter to Linux-like behavior

## Limitations of Flying-Z

- Not a full Linux environment [(Cygwin-based)](https://www.cygwin.com/index.html)
- `git` status indicators are slow in large repos [(help wanted)](https://github.com/Flying-Z-Terminal/Flying-Z/issues/3)
- Hotkey relies on a desktop shortcut and requires logout or reboot to activate
- Mouse and wheel interactions are imperfect. Must hold <kbd>Shift</kbd> to select text under certain circumstances
- Terminal icon color cannot be set per theme [(issue)](https://github.com/microsoft/terminal/issues/15264)
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

## Why did you:

- **Write it in JavaScript?** Because I wouldn't have had the time otherwise.
- **Choose Oh My Zsh?** Some claim it's outdated. I personally still favor it - and most importantly, it works on Windows.
- **Make any other choice?** Since the code is open source, I didn't necessarily think a huge amount of customizability was worth my effort. I'm happy to accept PRs to improve this project.

## License

**This project uses separate licenses for different aspects.**

- [**Code** - MIT licensed.](/LICENSE_CODE)
- [**Project name, logo, and other art** - Proprietary.](./LICENSE_ASSETS)
  - These assets are not covered by the MIT License and may not be used, modified, or distributed without explicit written permission. All rights to the art and Flying-Z brand are reserved.

_[© 2024 Remie Smith](https://remiesmith.com)_

---

**Inspired by** [**babun**](https://github.com/babun/babun)
