'use strict';

const APP_ID = 'text-scroller'

window.App = window.App ?? (() => {

  function launch() {
    document.title = T('document.title')

    document.addEventListener("visibilitychange", () => {
      if(document.visibilityState === 'visible') {
        onActivate()
      } else {
        onDeactivate()
      }
    })
    window.addEventListener('beforeunload', () => {
      // console.debug("[DEBUG] About to unload the page ...")
      onDeactivate()
    })

    window.addEventListener("menu-clicked", () => window.dispatchEvent(new CustomEvent('show-settings')))
    window.addEventListener("scroller-touched", () => window.dispatchEvent(new CustomEvent('close-settings')))
    window.addEventListener("settings-closed", () => window.dispatchEvent(new CustomEvent('show-menu')))

    return State.load()
        .then(() => TextScroller.init())
        .then(() => TextScroller.start())
        .then(() => Menu.init())
        .then(() => Menu.show())
        .then(() => appendElement('div', {className: 'overlay hidden'}))
        .then(() => Settings.View.init())
  }

  function onActivate() {
  }

  function onDeactivate() {
    window.dispatchEvent(new CustomEvent('close-settings'))
  }

  //
  // Initialize
  //
  document.addEventListener("DOMContentLoaded", () =>
    Promise.resolve()
        .then(launch)
        .then(() => console.info("[INFO] Launched TextScroller App."))
        .catch(error => console.error("[ERROR] Error occurred: %o", error))
  )

})()
