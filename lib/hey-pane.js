'use babel'

import { CompositeDisposable } from 'atom'

export default {
  config: {
    expandedWidth: {
      title: 'Focused Pane Width',
      description:
        'Sets the Percentage between 0 and 100 of how much the focused pane will grow',
      type: 'integer',
      default: 94,
      minimum: 1,
      maximum: 100
    },
    focusDelay: {
      title: 'Delay (in Follow Mode)',
      description:
        "If you're in follow mode, this delay (in ms) will be applied before the focused pane will grow",
      type: 'integer',
      default: 0,
      minimum: 0
    },
    followLocations: {
      title: 'Follow Mode Locations',
      description:
        'Specifies the locations within follow mode will be available',
      type: 'object',
      collapsed: true,
      properties: {
        center: {
          title: 'Workspace Center',
          type: 'boolean',
          default: true
        },
        left: {
          title: 'Left Dock',
          type: 'boolean',
          default: true
        },
        bottom: {
          title: 'Bottom Dock',
          type: 'boolean',
          default: true
        },
        right: {
          title: 'Right Dock',
          type: 'boolean',
          default: true
        }
      }
    },
    followModeByDefault: {
      title: 'Activate Follow Mode on start',
      description:
        'Follow Mode will be enabled when you start Atom (restart required)',
      type: 'boolean',
      default: false
    }
  },

  subscriptions: null,
  FollowObserver: null,
  modifiedPanes: [],
  incompatiblePlugins: [],
  isFocused: false,

  activate(state) {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      atom.packages.onDidActivatePackage(this.checkIncompatibility.bind(this))
    )

    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'hey-pane:toggle-focus-of-active-pane': () => this.toggleFocus(),
        'hey-pane:toggle-follow-mode': () => this.toggleFollow()
      })
    )

    if (atom.config.get('hey-pane.followModeByDefault')) {
      this.toggleFollow()
    }
  },

  deactivate() {
    this.subscriptions.dispose()
    this.FollowObserver != null && this.FollowObserver.dispose()
  },

  toggleFollow() {
    if (this.FollowObserver != null) {
      this.FollowObserver.dispose()
      this.FollowObserver = null
      return
    }

    const targets = atom.config.get('hey-pane.followLocations')
    const targetLocations = [
      targets.center && 'center',
      targets.left && 'left',
      targets.bottom && 'bottom',
      targets.right && 'right'
    ].filter(Boolean)

    this.FollowObserver = atom.workspace.onDidStopChangingActivePaneItem(
      item => {
        const pane = atom.workspace.paneContainerForItem(item)

        if (!pane) return
        if (!targetLocations.includes(pane.getLocation())) return

        this.startFollow()
      }
    )
  },

  startFollow() {
    const delay = atom.config.get('hey-pane.focusDelay')

    // Only use setTimeout if the delay is bigger than 0.
    // I'm not quite sure if this is necessary, but waiting for the next tick
    // COULD MAYBE change behavior for existing users, so
    // ... better safe than sorry.
    if (delay > 0) {
      clearTimeout(this.focusTimeout)
      this.focusTimeout = setTimeout(() => {
        this.undoFocus()
        this.doFocus()
      }, delay)
    } else {
      this.undoFocus()
      this.doFocus()
    }
  },

  toggleFocus() {
    if (this.isFocused) this.undoFocus()
    else this.doFocus()
  },

  doFocus() {
    this.isFocused = true
    const activePane = atom.workspace.getActivePane()

    // For custom styling possibilities.
    // Check if element is available for API < 1.17.
    activePane.element && activePane.element.classList.add('hey-pane-focus')

    const expandedWidth = atom.config.get('hey-pane.expandedWidth') / 100
    const collapsedWidth = 1 - expandedWidth
    const paneRoot = atom.workspace.getCenter().paneContainer.getRoot()

    // Recursive set expanded-/collapsedWidth on Panes or PaneAxes.
    // PaneAxes are nested into each other. There is a single parent axis.
    // We go from a pane all the way down until we're at the parent axis.
    const resursiveSet = pane => {
      // Only do something, if the pane is a child of an axis.
      // A pane has no axis, if there are no split windows.
      if (pane.getParent().constructor.name === 'PaneAxis') {
        // Expand the pane...
        this.savePaneState(pane).setFlexScale(expandedWidth)

        // ...and collapse all its siblings.
        pane
          .getParent()
          .children.filter(el => el !== pane) // bcuz only siblings
          .forEach(sibling => {
            this.savePaneState(sibling).setFlexScale(collapsedWidth)
          })

        // Do the same with the adjacent panes, until we're on the root axis.
        if (pane.getParent() !== paneRoot) {
          resursiveSet(pane.getParent())
        }
      }
    }

    // shoot da lazr
    resursiveSet(activePane)
  },

  undoFocus() {
    this.isFocused = false
    this.restorePanes()
    this.emptyPaneStates()
  },

  // Saves the pane and its flexScale for later restoring.
  // IDs would be nicer, but I couldn't find a way to search a pane or axis by
  // its ID.
  // Note: `pane` can be an instanceof Pane or PaneAxis.
  //   I treat them basically as the same.
  savePaneState(pane) {
    this.modifiedPanes.push({ pane, flexScale: pane.flexScale })
    return pane
  },

  restorePanes() {
    this.modifiedPanes.forEach(({ pane, flexScale }) => {
      if (!pane.isAlive()) return // pane is dead: loop continue
      pane.element && pane.element.classList.remove('hey-pane-focus')
      pane.setFlexScale(flexScale)
    })
  },

  emptyPaneStates() {
    this.modifiedPanes = []
  },

  checkIncompatibility(plugin) {
    if (this.incompatiblePlugins.includes(plugin.name)) {
      atom.notifications.addError('Incompatible Package Detected', {
        dismissable: true,
        detail: `hey-pane does not work when package "${
          plugin.name
        }" is activated.`
      })
    }
  }
}
