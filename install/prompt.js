'use strict';

window.InstallPrompt = window.InstallPrompt ?? (() => {

var $panel, $button
var promptEvent = null

function onBeforePrompt(event) {
  event.preventDefault()
  promptEvent = event

  show()
}

function onClick() {
  // console.debug("[DEBUG] Calling InstallPrompt.onClick() ...")

  if(!promptEvent) {
    console.warn("[WARN] The install prompt event isn't available!")
    return
  }

  // Hide the prompt button
  hide()

  // Prompt the installation
  const event = promptEvent
  event.prompt()
    .then(() => event.userChoice)
    .then(choice => {
      // either "accepted" or "dismissed"
      console.info("[INFO] Install prompt user choice: %s", choice.outcome)
    })
    .then(onAfterPrompted)
}

function onAfterPrompted() {
  promptEvent = null
}

function show() {
  // console.debug("[DEBUG] Calling InstallPrompt.show() ...")

  // Preload install icon
  appendElement('link', {rel: "preload", href: "../install/icon.png", as: "image"}, document.head)

  // Load style and div
  appendElement('style', {type: "text/css", id: "install-prompt"}, document.head).innerHTML = css()

  $panel = appendElement('div', {className: "install-prompt-panel"})
  $panel.innerHTML = `
    <button type="button">
      <img src="../install/icon.png">
      <span>${T('install.add-to-home-screen')}</span>
    </button>
    `

  $button = $E('button', $panel)
  $button.addEventListener('click', onClick)

  // Slide in
  return Promise.resolve()
  .then(() => $panel.style.top = `calc(99.6% - ${$panel.offsetHeight}px)`)
  .then(() => $button.style.left = `${$button.offsetWidth}px`)
  .then(() => $on($button).perform('slide-in'))
  .then(() => $button.style.left = '')
  .then(() => delay(180000))
  .then(() => { hide(); onAfterPrompted(); })
}

function hide() {
  if(!$button) return

  $on($button)
  .perform('slide-out')
  .then(() => {
    $E('div.install-prompt-panel').remove()
    $E('style#install-prompt', document.head).remove()
    $E('link[href="../install/icon.png"]', document.head).remove()
  })

  $button = null
  $panel = null
}

function css() { return `
  .install-prompt-panel {
    z-index: 999; position: absolute;
    margin: 0.5vmin 0;
    width: 64vw;
    left: 36vw; top: 93.6%;
    text-align: right;
    overflow: hidden;
  }

  .install-prompt-panel > button {
    position: relative;
    border: 1px outset #eaeaea;
    border-radius: 6vmin 0 0 6vmin;
    padding: 1.5vmin 3vmin 1.5vmin 4.5vmin;
    display: inline-block;
    font: normal 4.5vmin var(--main-font-family);
    text-align: center;
    cursor: pointer;
    background: #f0f0ff;
    color: #e066ff;
    white-space: nowrap;
  }

  .install-prompt-panel > button.slide-in {
    transform: translateX(-100%);
    transition: transform 1s 0.3s;
  }

  .install-prompt-panel > button.slide-out {
    transform: translateX(100%);
    transition: transform 1s 0.3s;
  }

  .install-prompt-panel > button > img {
    position: relative;
    top: 0.6vmin;
    height: 6vmin;
    width: 6vmin;
  }

  .install-prompt-panel > button > span {
    position: relative;
    top: -1vmin;
    padding: 0 1vmin;
  }`
}

return {onBeforePrompt, onAfterPrompted}

})()