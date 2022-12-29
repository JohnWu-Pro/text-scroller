'use strict';

(function() {

if(! location.href.match(/\bdebug\b/gi)) return

function show(version) {
  window.SW_VERSION = version

  appendElement('div', {id: 'debug'}).innerHTML = `
    <hr/>
    <div>Display mode: ${new URL(location.href).searchParams.get('mode')}</div>
    <div>navigator.language: ${navigator.language}</div>
    <div>Current APP_VERSION: ${APP_VERSION}</div>
    <div>Active Service Worker version: ${version}</div>
  `
}

// document.addEventListener("DOMContentLoaded", show)

navigator.serviceWorker.addEventListener('message', (event) => {
  console.debug("[DEBUG] Received Service Worker message: %s", JSON.stringify(event.data))
  if(event.data.type === 'SW_ACTIVATED') show(event.data.version)
})

})()
