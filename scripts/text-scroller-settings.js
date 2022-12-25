'use strict';

class Settings {
  static DEFAULT = Object.freeze({
    activeTab: 'text',

    text: '',
    speed: 10,      // [0:OFF, 1..10..100] --log()--> [-step, 0..1..2]
                    // 10 == Config.full-screen-scrolling-ms
    foreground: Object.freeze({
      color: Object.freeze({
        red: 255,   // 0..255
        green: 192, // 0..255
        blue: 255   // 0..255
      }),
      size: 32,     // [2..4..16] x 4vmin --log()--> [½..1..2]
    }),

    glow: Object.freeze({
      radius: 5,    // [0:OFF, 1..5..10]
                    // 10 == foreground-font-size
      use: 'customized', // foreground | customized
      color: Object.freeze({
        red: 128,   // 0..255
        green: 255, // 0..255
        blue: 128   // 0..255
      }),
      interval: 0,// [0:OFF, 1..10..100] x 100ms --log()--> [-step, 0..1..2]
    }),

    background: Object.freeze({
      use: 'color', // color | image
      color: Object.freeze({
        red: 64,    // 0..255
        green: 64,  // 0..255
        blue: 192   // 0..255
      }),
      url: '',
    })
  })
  static #RADIUS_RATIOS = [0.04, 0.15, 0.40]
  static #COLOR_RATIOS = [0.1, 0.3, 1.0]

  static #instance = JSON.parse(JSON.stringify(Settings.DEFAULT))
  static {
    State.load()
    .then((cache) => Object.assign(Settings.#instance, cache.settings ?? {}))
    // .then(() => console.debug("[DEBUG] Loaded settings: %s", JSON.stringify(Settings.#instance)))
  }

  static get instance() { return Settings.#instance }

  static save() {
    return State.set({settings: Settings.#instance})
  }

  static applyGlowEffect(rootStyle) {
    const settings = Settings.instance
    const content = $E('div.scroller-content')
    content.classList.remove('shadow-animation', 'static-shadow')
    if(settings.glow.radius === 0) {
      rootStyle.setProperty('--text-shadow', 'none')
      rootStyle.setProperty('--animation-duration', '0ms')
      return
    }

    const base = settings.foreground.size * settings.glow.radius / 10
    const sizes = Settings.#RADIUS_RATIOS.map(it => it * base)
    const colors = settings.glow.use === 'foreground'
        ? Array(Settings.#COLOR_RATIOS.length).fill(settings.foreground.color)
        : Settings.#COLOR_RATIOS.map(ratio => Settings.#Color.interpolate(settings.foreground.color, settings.glow.color, ratio))
    rootStyle.setProperty('--text-shadow', sizes.map((size, index) => `0 0 ${size}vmin ${Settings.rgb(colors[index])}`).join())
    rootStyle.setProperty('--animation-duration', settings.glow.interval + 'ms')
    content.classList.add(settings.glow.interval > 0 ? 'shadow-animation' : 'static-shadow')
  }

  static applyBackground(rootStyle) {
    const settings = Settings.instance
    if(settings.background.use === 'image') {
      const color = Settings.rgb(Settings.DEFAULT.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      const background = `center / cover no-repeat url("${settings.background.url}")`
      rootStyle.setProperty('--scroller-background', background)
    } else {
      const color = Settings.rgb(settings.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      rootStyle.setProperty('--scroller-background', color)
    }
  }

  static rgb(color) {
    return `rgb(${color.red},${color.green},${color.blue})`
  }

  static #Size = {
    rangeOf: (value) => Math.log2(value/4)/2,
    valueOf: (range) => Math.round(Math.pow(4, range)*4),
  }

  static #SPEED_STEP = 0.1
  static #Speed = {
    rangeOf: (value) => value===0 ? -Settings.#SPEED_STEP : Math.log10(value),
    labelOf: (value) => value===0 ? T('settings.speed.zero') : value,
    valueOf: (range) => range < 0 ? 0 : Math.round(Math.pow(10, range)),
  }

  static #Color = {
    valueOf: (range) => range > 255 ? 255 : range,
    interpolate: (from, to, ratio) => {
      const inter = (from, to, ratio) => from + Math.round((to - from) * ratio)
      return {
        red: inter(from.red, to.red, ratio),
        green: inter(from.green, to.green, ratio),
        blue: inter(from.blue, to.blue, ratio)
      }
    }
  }

  static View = (() => {

    const rootStyle = $E(':root').style

    const TABS = {
      text: {
        renderWithin(div) {
          const settings = Settings.instance
          div.innerHTML = `
            <div>
              <textarea rows="5" wrap="soft" placeholder="${T('settings.text.placeholder')}">${settings.text}</textarea>
            </div>
            <div>
              <button type="button">${T('settings.text.button.label')}</button>
            </div>
          `
          $E('button', div).addEventListener('click', () => {
            settings.text = $E('textarea', div).value
            TextScroller.start()
            Settings.View.close()
          })
        }
      },
      foreground: {
        renderWithin(div) {
          const settings = Settings.instance
          div.innerHTML = `
            <div class="size">
              <div class="label">
                <span>${T('settings.size.label')}:</span>
                <input name="size" type="text" disabled size="3" value="${settings.foreground.size}">
              </div>
              <div class="input">
                <input type="range" min="0.5" step="0.125" max="2" value="${Settings.#Size.rangeOf(settings.foreground.size)}">
              </div>
            </div>
            <div class="speed">
              <div class="label">
                <span>${T('settings.speed.label')}:</span>
                <input name="speed" type="text" disabled size="3" value="${Settings.#Speed.labelOf(settings.speed)}">
              </div>
              <div class="input">
                <input type="range" min="-${Settings.#SPEED_STEP}" step="${Settings.#SPEED_STEP}" max="2" value="${Settings.#Speed.rangeOf(settings.speed)}">
              </div>
            </div>
            <div class="color">
              <div class="label">
                <span>${T('settings.color.label')}:</span>
                <span>${T('settings.color.red')}</span><input name="red" type="text" disabled size="3" value="${settings.foreground.color.red}">
                <span>${T('settings.color.green')}</span><input name="green" type="text" disabled size="3" value="${settings.foreground.color.green}">
                <span>${T('settings.color.blue')}</span><input name="blue" type="text" disabled size="3" value="${settings.foreground.color.blue}">
              </div>
              <div class="input">
                <span><span class="red">${T('settings.color.red')}</span><input class="red" type="range" min="0" step="4" max="256" value="${settings.foreground.color.red}"></span>
                <span><span class="green">${T('settings.color.green')}</span><input class="green" type="range" min="0" step="4" max="256" value="${settings.foreground.color.green}"></span>
                <span><span class="blue">${T('settings.color.blue')}</span><input class="blue" type="range" min="0" step="4" max="256" value="${settings.foreground.color.blue}"></span>
              </div>
            </div>
          `
          const $size = $E('input[name="size"]', div)
          $E('.size input[type="range"]', div).addEventListener('change', function() {
            const size = Settings.#Size.valueOf(Number.parseFloat(this.value))
            // console.debug("[DEBUG] onSizeChanged :: range: %s, value: %d", this.value, size)
            $size.value = size
            settings.foreground.size = size
            rootStyle.setProperty('--scroller-font-size', size + 'vmin')
          })

          const $speed = $E('input[name="speed"]', div)
          $E('.speed input[type="range"]', div).addEventListener('change', function() {
            const speed = Settings.#Speed.valueOf(Number.parseFloat(this.value))
            // console.debug("[DEBUG] onSpeedChanged :: range: %s, value: %d", this.value, speed)
            $speed.value = Settings.#Speed.labelOf(speed)
            const forceStart = settings.speed === 0 || speed === 0
            settings.speed = speed
            if(forceStart) TextScroller.start()
          })

          $A('.color input[type="range"]', div).forEach((input) => {
            input.addEventListener('change', function() {
              const value = Settings.#Color.valueOf(Number.parseInt(this.value))
              // console.debug("[DEBUG] onColorChanged(%s) :: range: %s, value: %d", this.className, this.value, value)
              $E(`input[name="${this.className}"]`, div).value = value
              settings.foreground.color[this.className] = value
              rootStyle.setProperty('--scroller-font-color', Settings.rgb(settings.foreground.color))
            })
          })
        }
      },
      glow: {
        renderWithin(div) {
          const settings = Settings.instance
          div.innerHTML = `
            <div>
            </div>
            <div>
            </div>
          `
        }
      },
      background: {
        renderWithin(div) {
          const settings = Settings.instance
          div.innerHTML = `
            <div class="color">
              <div class="label">
                <input type="radio" id="use-color" name="use" value="color">
                <label for="use-color">${T('settings.color.label')}:</label>
                <span>${T('settings.color.red')}</span><input name="red" type="text" disabled size="3" value="${settings.background.color.red}">
                <span>${T('settings.color.green')}</span><input name="green" type="text" disabled size="3" value="${settings.background.color.green}">
                <span>${T('settings.color.blue')}</span><input name="blue" type="text" disabled size="3" value="${settings.background.color.blue}">
              </div>
              <div class="input">
                <span><span class="red">${T('settings.color.red')}</span><input class="red" type="range" min="0" step="4" max="256" value="${settings.background.color.red}"></span>
                <span><span class="green">${T('settings.color.green')}</span><input class="green" type="range" min="0" step="4" max="256" value="${settings.background.color.green}"></span>
                <span><span class="blue">${T('settings.color.blue')}</span><input class="blue" type="range" min="0" step="4" max="256" value="${settings.background.color.blue}"></span>
              </div>
            </div>
            <div class="image">
              <div class="label">
                <input type="radio" id="use-image" name="use" value="image">
                <label for="use-image">${T('settings.image.label')}:</label>
                <label for="bg-image">${T('settings.image.select.label')}</label>
              </div>
              <div class="input">
                <input type="file" id="bg-image" accept="image/*" class="visually-hidden">
              </div>
            </div>
          `
          const radios = $A('.background input[type="radio"]', div)
          function setRadios() {
            const value = settings.background.use
            radios.forEach((it) => it.checked = it.value === value)
          }

          setRadios()
          radios.forEach((input, _, inputs) => {
            input.addEventListener('change', function() {
              radios.forEach((it) => { if(it.checked) settings.background.use = it.value })
              Settings.applyBackground(rootStyle)
            })
          })
          $A('.color input[type="range"]', div).forEach((input) => {
            input.addEventListener('change', function() {
              const value = Settings.#Color.valueOf(Number.parseInt(this.value))
              $E(`input[name="${this.className}"]`, div).value = value
              settings.background.color[this.className] = value
              settings.background.use = 'color'; setRadios()
              Settings.applyBackground(rootStyle)
            })
          })
          $E('.image input[type="file"]', div).addEventListener('change', function() {
            const file = this.files[0]
            const reader = new FileReader()
            reader.onload = (event) => {
              settings.background.url = event.target.result
              settings.background.use = 'image'; setRadios()
              Settings.applyBackground(rootStyle)
            }
            reader.readAsDataURL(file)
          })
        }
      },
      more: {
        renderWithin(div) {
          const settings = Settings.instance
          div.innerHTML = `
            <div>
            </div>
            <div>
            </div>
          `
        }
      },
    }

    var $overlay, $view, isVisible = false, $content

    function init() {
      $overlay = $E('div.overlay')
      $view = appendElement('div', {className: 'settings-view hidden'}, $overlay)
      $view.innerHTML = `
        <div class="settings-content"></div>
        <div class="settings-tabs">` +
      Object.keys(TABS).reduce((html, tab) => html + `
          <div class="settings-tab ${tab}">
            <div class="tab-icon"></div>
            <div class="tab-label">${T('settings.tab-label.' + tab)}</div>
          </div>`, '') + `
        </div>
      `
      $content = $E('.settings-content', $view)

      // Attach tab event listeners
      $A('.settings-tab', $view).forEach((div) => div.addEventListener('click', () => renderTab(div)))

      window.addEventListener("show-settings", show)
      window.addEventListener("close-settings", close)

      return Promise.resolve()
    }

    function renderTab(tabDiv) {
      const settings = Settings.instance
      const prevTab = $E('.settings-tab.' + settings.activeTab, $view)
      if(prevTab !== tabDiv) prevTab.classList.remove('selected')

      const [_, tab] = tabDiv.classList
      settings.activeTab = tab
      $E('.settings-tab.' + tab, $view).classList.add('selected')
      $content.className = 'settings-content ' + tab
      TABS[tab].renderWithin($content)
    }

    function show() {
      if(isVisible) return

      $show($view)
      $show($overlay)
      isVisible = true

      // Render active tab
      renderTab($E('.settings-tab.' + Settings.instance.activeTab, $view))

      return Promise.resolve()
    }

    function close() {
      if(!isVisible) return

      Settings.save()

      $content.innerHTML = ''
      $E('.settings-tab.' + Settings.instance.activeTab, $view).classList.remove('selected')

      isVisible = false
      $hide($overlay)
      $hide($view)

      window.dispatchEvent(new CustomEvent('settings-closed'))
    }

    return {
      init,
      show,
      close
    }
  })()

}
