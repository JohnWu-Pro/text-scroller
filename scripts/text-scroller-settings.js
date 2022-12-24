'use strict';

class Settings {
  static DEFAULT = Object.freeze({
    activeTab: 'text',

    text: '',
    speed: 10,      // [0:OFF, 1..10..100] --log()--> [-step, 0..1..2]

    foreground: Object.freeze({
      color: Object.freeze({
        red: 255,   // 0..255
        green: 192, // 0..255
        blue: 255   // 0..255
      }),
      size: 32,     // [2..4..16] x 4 --log()--> [½..1..2] x 4
      // TODO glow:
    }),

    background: Object.freeze({
      use: 'color', // color | image
      color: Object.freeze({
        red: 64,    // 0..255
        green: 64,  // 0..255
        blue: 192   // 0..255
      }),
      image: {
        url: '',
        orientation: 'up' // left | up | right | down
      },
    })
  })

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

  static rgb(color) {
    return `rgb(${color.red},${color.green},${color.blue})`
  }

  static setBackground(rootStyle) {
    if(Settings.instance.background.use === 'image') {
      const color = Settings.rgb(Settings.DEFAULT.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      // TODO Build background style based on image settings
      let background = `url("${Settings.instance.background.image.url}") center / cover no-repeat`
      rootStyle.setProperty('--scroller-background', background)
    } else {
      const color = Settings.rgb(Settings.instance.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      rootStyle.setProperty('--scroller-background', color)
    }
  }

  static View = (() => {

    const Size = {
      rangeOf: (value) => Math.log2(value/4)/2,
      valueOf: (range) => Math.round(Math.pow(4, range)*4),
    }

    const SPEED_STEP = 0.1
    const Speed = {
      rangeOf: (value) => value===0 ? -SPEED_STEP : Math.log10(value),
      labelOf: (value) => value===0 ? T('settings.speed.zero') : value,
      valueOf: (range) => range < 0 ? 0 : Math.round(Math.pow(10, range)),
    }

    const Color = {
      valueOf: (range) => range > 255 ? 255 : range
    }

    const rootStyle = $E(':root').style

    const TABS = {
      text: {
        renderWithin(div) {
          div.innerHTML = `
            <div>
              <textarea rows="5" wrap="soft" placeholder="${T('settings.text.placeholder')}">${Settings.instance.text}</textarea>
            </div>
            <div>
              <button type="button">${T('settings.text.button.label')}</button>
            </div>
          `
          $E('button', div).addEventListener('click', () => {
            Settings.instance.text = $E('textarea', div).value
            TextScroller.start()
            Settings.View.close()
          })
        }
      },
      foreground: {
        renderWithin(div) {
          div.innerHTML = `
            <div class="size">
              <div class="label">
                <span>${T('settings.size.label')}:</span>
                <input name="size" type="text" readonly size="3" value="${Settings.instance.foreground.size}">
              </div>
              <div class="input">
                <input type="range" min="0.5" step="0.125" max="2" value="${Size.rangeOf(Settings.instance.foreground.size)}">
              </div>
            </div>
            <div class="speed">
              <div class="label">
                <span>${T('settings.speed.label')}:</span>
                <input name="speed" type="text" readonly size="3" value="${Speed.labelOf(Settings.instance.speed)}">
              </div>
              <div class="input">
                <input type="range" min="-${SPEED_STEP}" step="${SPEED_STEP}" max="2" value="${Speed.rangeOf(Settings.instance.speed)}">
              </div>
            </div>
            <div class="color">
              <div class="label">
                <span>${T('settings.color.label')}:</span>
                <span>${T('settings.color.red')}</span><input name="red" type="text" disabled size="3" value="${Settings.instance.foreground.color.red}">
                <span>${T('settings.color.green')}</span><input name="green" type="text" disabled size="3" value="${Settings.instance.foreground.color.green}">
                <span>${T('settings.color.blue')}</span><input name="blue" type="text" disabled size="3" value="${Settings.instance.foreground.color.blue}">
              </div>
              <div class="input">
                <span><span class="red">${T('settings.color.red')}</span><input class="red" type="range" min="0" step="4" max="256" value="${Settings.instance.foreground.color.red}"></span>
                <span><span class="green">${T('settings.color.green')}</span><input class="green" type="range" min="0" step="4" max="256" value="${Settings.instance.foreground.color.green}"></span>
                <span><span class="blue">${T('settings.color.blue')}</span><input class="blue" type="range" min="0" step="4" max="256" value="${Settings.instance.foreground.color.blue}"></span>
              </div>
            </div>
          `
          const $size = $E('input[name="size"]', div)
          $E('.size input[type="range"]', div).addEventListener('change', function() {
            const size = Size.valueOf(Number.parseFloat(this.value))
            // console.debug("[DEBUG] onSizeChanged :: range: %s, value: %d", this.value, size)
            $size.value = size
            Settings.instance.foreground.size = size
            rootStyle.setProperty('--scroller-font-size', size + 'vmin')
          })

          const $speed = $E('input[name="speed"]', div)
          $E('.speed input[type="range"]', div).addEventListener('change', function() {
            const speed = Speed.valueOf(Number.parseFloat(this.value))
            // console.debug("[DEBUG] onSpeedChanged :: range: %s, value: %d", this.value, speed)
            $speed.value = Speed.labelOf(speed)
            const forceStart = Settings.instance.speed === 0 || speed === 0
            Settings.instance.speed = speed
            if(forceStart) TextScroller.start()
          })

          $A('.color input[type="range"]', div).forEach((input) => {
            input.addEventListener('change', function() {
              const value = Color.valueOf(Number.parseInt(this.value))
              // console.debug("[DEBUG] onColorChanged(%s) :: range: %s, value: %d", this.className, this.value, value)
              $E(`input[name="${this.className}"]`, div).value = value
              Settings.instance.foreground.color[this.className] = value
              rootStyle.setProperty('--scroller-font-color', Settings.rgb(Settings.instance.foreground.color))
            })
          })
        }
      },
      glow: {
        renderWithin(div) {
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
          div.innerHTML = `
            <div class="color">
              <div class="label">
                <input type="radio" name="use" value="color" ${Settings.instance.background.use==='color' ? 'checked' : ''}>
                <span>${T('settings.color.label')}:</span>
                <span>${T('settings.color.red')}</span><input name="red" type="text" disabled size="3" value="${Settings.instance.background.color.red}">
                <span>${T('settings.color.green')}</span><input name="green" type="text" disabled size="3" value="${Settings.instance.background.color.green}">
                <span>${T('settings.color.blue')}</span><input name="blue" type="text" disabled size="3" value="${Settings.instance.background.color.blue}">
              </div>
              <div class="input">
                <span><span class="red">${T('settings.color.red')}</span><input class="red" type="range" min="0" step="4" max="256" value="${Settings.instance.background.color.red}"></span>
                <span><span class="green">${T('settings.color.green')}</span><input class="green" type="range" min="0" step="4" max="256" value="${Settings.instance.background.color.green}"></span>
                <span><span class="blue">${T('settings.color.blue')}</span><input class="blue" type="range" min="0" step="4" max="256" value="${Settings.instance.background.color.blue}"></span>
              </div>
            </div>
            <div class="image">
              <div class="label">
                <input type="radio" name="use" value="image" ${Settings.instance.background.use==='image' ? 'checked' : ''}>
                <span>${T('settings.image.label')}:</span>
                <label for="bg-image">${T('settings.image.select.label')}</label>
                <br/>
                <br/>
                <span class="spacer">&nbsp;</span><span>${T('settings.image.orientation.label')}:</span>
                <span class="orientation">
                  <span data-value="left">⮘</span>
                  <span data-value="up">⮙</span>
                  <span data-value="right">⮚</span>
                  <span data-value="down">⮛</span>
                </span>
              </div>
              <div class="input">
                <input type="file" id="bg-image" accept="image/*" class="visually-hidden">
              </div>
            </div>
          `
          $A('.background input[type="radio"]', div).forEach((input, _, inputs) => {
            input.addEventListener('change', function() {
              inputs.forEach((it) => {
                if(it.checked) Settings.instance.background.use = it.value
              })
              Settings.setBackground(rootStyle)
            })
          })
          $A('.color input[type="range"]', div).forEach((input) => {
            input.addEventListener('change', function() {
              const value = Color.valueOf(Number.parseInt(this.value))
              $E(`input[name="${this.className}"]`, div).value = value
              Settings.instance.background.color[this.className] = value
              Settings.setBackground(rootStyle)
            })
          })
          $E('.image input[type="file"]', div).addEventListener('change', function() {
            const file = this.files[0]
            const reader = new FileReader()
            reader.onload = (event) => {
              Settings.instance.background.image.url = event.target.result
              Settings.setBackground(rootStyle)
            }
            reader.readAsDataURL(file)
          })
          const orientation = Settings.instance.background.image.orientation
          const orientations = $A('.orientation > span', div)
          orientations.forEach((span) => {
            if(span.dataset.value === orientation) span.classList.add('selected')

            span.addEventListener('click', function() {
              orientations.forEach((it) => it.classList.remove('selected'))
              this.classList.add('selected')
              Settings.instance.background.image.orientation = this.dataset.value
              Settings.setBackground(rootStyle)
            })
          })
        }
      },
      more: {
        renderWithin(div) {
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
      const prevTab = $E('.settings-tab.' + Settings.instance.activeTab, $view)
      if(prevTab !== tabDiv) prevTab.classList.remove('selected')

      const [_, tab] = tabDiv.classList
      Settings.instance.activeTab = tab
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
