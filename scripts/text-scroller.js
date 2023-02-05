'use strict';

window.TextScroller = window.TextScroller ?? (() => {

  const scrollers = {}

  function init() {
    const div = appendElement('div', {className: 'scroller-background'})
    div.addEventListener('click', () => window.dispatchEvent(new CustomEvent('scroller-touched')))
    div.innerHTML = /*html*/`
      <div class="scroller-container"></div>
    `

    const rootStyle = $E(':root').style
    Settings.applyFont(rootStyle)
    Settings.applyBackground(rootStyle)

    const container = $E('div.scroller-container')
    scrollers.portrait = Scroller.portrait(rootStyle, container)
    scrollers.landscape = Scroller.landscape(rootStyle, container)

    screen.orientation.addEventListener('change', start)

    return Promise.resolve()
  }

  function start() {
    return scroller().start()
  }

  function scroller() {
    // console.debug("[DEBUG] screen.orientation.type: %s", screen.orientation.type)
    switch (screen.orientation.type) {
      case "landscape-primary":
      case "landscape-secondary": // the screen is upside down!
        return scrollers.landscape
      case "portrait-primary":
      case "portrait-secondary":
        return scrollers.portrait
      default:
        console.warn("The orientation API isn't supported in this browser :(")
        return scrollers.landscape
    }
  }

  class Scroller {

    static portrait(rootStyle, container) {
      return new Scroller(rootStyle, container, 'top', 'Height')
    }

    static landscape(rootStyle, container) {
      return new Scroller(rootStyle, container, 'left', 'Width')
    }

    #rootStyle
    #container
    #position
    #dimension

    constructor(rootStyle, container, position, dimension) {
      this.#rootStyle = rootStyle
      this.#container = container
      this.#position = position
      this.#dimension = dimension
    }

    start() {
      this.#container.innerHTML = `
        <div class="scroller-content hidden">${Settings.text || T('settings.default.text')}</div>
      `
      Settings.applyGlowEffect(this.#rootStyle)
      this.#rolling($E('div.scroller-content', this.#container))
    }

    #rolling(div) {
      return Settings.scrollable
        ? Promise.resolve()
            .then(() => this.#slide(div))
            .then(() => delay(1))
            .then(() => div.isConnected ? this.#rolling(div) : null)
        : Promise.resolve($show(div))
    }

    #slide(div) {
      return Promise.resolve($show(div), this.#onInit(div))
        .then(() => $on(div).perform('slide'))
        .then(() => $hide(div))
        // .catch(error => {
        //   console.error("[ERROR] Error occurred: %o", error)
        //   appendElement('div', {className: 'error'}).innerHTML = 'ERROR: ' + error
        // })
    }

    #onInit(div) {
      const containerSize = this.#container['offset'+this.#dimension]
      const scrollerSize = div['scroll'+this.#dimension]

      div.style[this.#position] = containerSize + 'px'
      Settings.applyScrolling(this.#rootStyle, containerSize, scrollerSize)
    }
  }

  return {
    init,
    start
  }

})()
