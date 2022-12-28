'use strict';

const APP_ID = 'text-scroller'

window.App = window.App ?? (() => {

  function launch() {
    document.title = T('app.name')

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

    return loadSettings()
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

  function loadSettings() {
    const encoded = new URLSearchParams(location.search).get('settings')
    if(encoded) {
      return Promise.resolve()
        .then(() => JSON.parse(LZString.decompressFromUint8Array(Base64.UrlSafe.decode(encoded))))
        .then((settings) => Settings.merge(settings))
        .then((settings) => settings.version = Settings.DEFAULT.version)
        .then(() => Settings.save())
        .catch(error => {
          console.error("[ERROR] Error occurred while trying to resolve and/or import settings: %o", error)
          return Settings.load()
        })
    } else {
      return Settings.load()
    }
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
