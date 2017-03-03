# Hey, Pane! 👋

Enlarge the active pane, either with a shortcut or with a super handy follow mode. Inspired by Origami for Sublime Text.

![Basic Usage](https://timomeh.github.io/hey-pane/zero.gif?raw=true)

## Usage

<kbd>cmd-shift-k</kbd> to toggle the focus on the active Pane.  
... or override this shortcut with your own by using the command `hey-pane:toggle-focus-of-active-pane`.

Enable/Disable Follow Mode via the Command Palette.  
... or make your own shortcut by using the command `hey-pane:toggle-follow-mode`.

### Focus

With _Hey, Pane!_ you can temporarily zoom/focus/enlarge (call it what you want) your active pane without losing sight of all other panes. The active pane get's really big, and all other panes will just peak around the corner. Perfect for focusing on your work or to make more space on a small screen.

It works with all kinds of pane arrangements.

![Works with all pane arrangements](https://timomeh.github.io/hey-pane/two.gif?raw=true)

If you want to see all your panes like they were before, just toggle _Hey, Pane!_ again and everything will be back to normal, like nothing happened. _Hey, Pane!_ temporarily saves all the sizes of your panes before focusing on one of them.

Resize your panes, _Hey, Pane!_ will recover them.

![Resize your panes](https://timomeh.github.io/hey-pane/one.gif?raw=true)

### Follow Mode

_Hey, Pane!_ can also follow your active pane and resize it, as soon as you change your Pane. Perfect for working with a small screen.

![It follows your active pane](https://timomeh.github.io/hey-pane/four.gif?raw=true)

You can also use Follow Mode and manually toggling Focus, to get an overview of all active panes. It's a bit like magic<sup>\*</sup>. 💫

Really, it works with all crazy arrangements! Just look at this pane mess, no problem for _Hey, Pane!_

![Works with all kind of arrangements](https://timomeh.github.io/hey-pane/five.gif?raw=true)


## ⚠️ Incompatible with Nuclide

Unfortunately this package does not work with [Nuclide](https://nuclide.io/). You can track progress on this issue in [#3](https://github.com/timomeh/hey-pane/issues/3).


## Commands

- `hey-pane:toggle-focus-of-active-pane` zooms/unzooms the active Pane
- `hey-pane:toggle-follow-mode` activates/deactivates Follow Mode


## TODOs

- [ ] Status Bar Indicator if Focus/Follow is active
- [ ] Darken minimized panes /w option
- [ ] Write tests
- [x] Add configuration for size of focused pane


<sup>\*</sup> No real magic involved
