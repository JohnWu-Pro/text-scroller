'use strict';

window.Menu = window.Menu ?? (() => {

  var $overlay

  function init() {
    $overlay = appendElement('div', {className: 'menu-overlay hidden'})
    $overlay.innerHTML = `<div class="menu"></div>`

    $E('.menu', $overlay).addEventListener('click', onClicked)

    window.addEventListener("show-menu", show)

    return Promise.resolve()
  }

  function show() {
    $show($overlay)

    return Promise.resolve()
  }

  function onClicked() {
    // console.debug("[DEBUG] Calling Menu.onClicked() ...")
    $hide($overlay)
    window.dispatchEvent(new CustomEvent('menu-clicked'))
  }

  return {
    init,
    show
  }

})()
