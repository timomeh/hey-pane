'use babel'

import { CompositeDisposable } from 'atom'

export default {

  config: {
    expandedWidth: {
      title: 'Focused Pane Width',
      description: 'Sets the Percentage between 0 and 100 of how much the focused pane will grow',
      type: 'integer',
      default: 94,
      minimum: 1,
      maximum: 100
    }
  },

  subscriptions: null,
  FollowObserver: null,
  modifiedPanes: [],
  incompatiblePlugins: [],
  isFocused: false,

  activate(state) {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.packages.onDidActivatePackage(
      this.checkIncompatibility.bind(this)))

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'hey-pane:toggle-focus-of-active-pane': () => this.toggleFocus(),
      'hey-pane:toggle-follow-mode': () => this.toggleFollow()
    }))
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

    this.FollowObserver = atom.workspace
      .onDidStopChangingActivePaneItem(pane => this.startFollow())
  },

  startFollow() {
    this.undoFocus()
    this.doFocus()
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

    // Recursive set expanded-/collapsedWidth on Panes or PaneAxes.
    // PaneAxes are nested into each other. There is a single parent axis.
    // We go from a pane all the way down until we're at the parent axis.
    const resursiveSet = (pane) => {
      // Only do something, if the pane is a child of an axis.
      // A pane has no axis, if there are no split windows.
      if (pane.getParent().constructor.name === 'PaneAxis') {
        // Expand the pane...
        this.savePaneState(pane).setFlexScale(expandedWidth)

        // ...and collapse all its siblings.
        pane.getParent().children
          .filter(el => el !== pane) // bcuz only siblings
          .forEach(sibling => {
            this.savePaneState(sibling).setFlexScale(collapsedWidth)
          })

        // Do the same with the adjacent panes, until we're on the root axis.
        if (pane.getParent() !== atom.workspace.paneContainer.getRoot()) {
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
    this.modifiedPanes
      .forEach(({ pane, flexScale }) => {
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
      atom.notifications.addError('Incompatible Package Detected',
        {
          dismissable: true,
          detail: `hey-pane does not work when package "${plugin.name}" is activated.`
        }
      )
    }
  }

};
