'use babel'

import { CompositeDisposable } from 'atom'
import { getSiblings } from './utils'

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
  ActivePane: null,
  FollowObserver: null,
  modifiedPanes: [],
  incompatiblePlugins: ['nuclide'],

  activate(state) {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.packages.onDidActivatePackage(
      this.checkIncompatibility.bind(this)))

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'hey-pane:toggle-focus-of-active-pane': () => this.toggleFocus(),
      'hey-pane:toggle-follow-mode': () => this.followMe()
    }))
  },

  deactivate() {
    this.subscriptions.dispose()

    if (this.FollowObserver != null)
      this.FollowObserver.dispose()
  },

  // Activate/deactivate follow mode
  followMe() {
    if (this.FollowObserver != null) {
      this.FollowObserver.dispose()
      this.FollowObserver = null
    } else {
      this.FollowObserver = atom.workspace.onDidStopChangingActivePaneItem(
        (pane) => { this.setAutoFocus() }
      )
    }
  },

  setAutoFocus() {
    if (this.ActivePane != null) {
      this.undoFocus()
    }
    this.doFocus()
  },

  // Toggle Focus of active pane
  toggleFocus() {
    if (this.ActivePane != null) {
      this.undoFocus()
    } else {
      this.doFocus()
    }
  },

  doFocus() {
    this.ActivePane = this.getActivePane()
    this.ActivePane.classList.add('hey-pane-focus')

    const expandedWidth = atom.config.get('hey-pane.expandedWidth') / 100
    const collapsedWidth = 1 - expandedWidth

    var recursiveSet = (node) => {
      if (node.parentNode.nodeName === 'ATOM-PANE-AXIS') {
        this.saveElementStateAndSetFlex(node, expandedWidth)
        getSiblings(node)
        .filter(pane => pane.nodeName !== 'ATOM-PANE-RESIZE-HANDLE')
        .forEach(pane => {
          this.saveElementStateAndSetFlex(pane, collapsedWidth)
        })

        if (node.parentNode.parentNode.nodeName !== 'ATOM-PANE-CONTAINER') {
          recursiveSet(node.parentNode)
        }
      }
    }

    recursiveSet(this.ActivePane);
  },

  undoFocus() {
    this.ActivePane.classList.remove('hey-pane-focus')
    this.ActivePane = null
    this.restorePanes()
    this.emptyPaneStates()
  },

  saveElementStateAndSetFlex(el, newFlexValue) {
    const oldFlexValue = el.style.flexGrow
    this.modifiedPanes.push({ el, oldFlexValue })
    el.style.flexGrow = newFlexValue
  },

  restorePanes() {
    const Container = this.getPanesContainer()
    this.modifiedPanes.forEach(pane => {
      if (Container.contains(pane.el)) {
        pane.el.style.flexGrow = pane.oldFlexValue
      }
    })
  },

  emptyPaneStates() {
    this.modifiedPanes = []
  },

  getPanesContainer() {
    const View = atom.views.getView(atom.workspace)
    return View.querySelector('.panes')
  },

  getActivePane() {
    const View = atom.views.getView(atom.workspace)
    return View.querySelector('.pane.active')
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
