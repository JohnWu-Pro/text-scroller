'use strict';

class Settings {
  static DEFAULT = Object.freeze({
    version: APP_VERSION,

    activeTab: 'text',

    text: '',
    speed: 10,      // [0:OFF, 1..10..100] --log()--> [-step, 0..1..2]
                    // 10 == Config.full-screen-scrolling-ms
    foreground: Object.freeze({
      color: Object.freeze({
        red: 240,   // 0..255
        green: 240, // 0..255
        blue: 240   // 0..255
      }),
      size: 32,     // [2..4..16] x 4vmin --log()--> [½..1..2]
    }),

    glow: Object.freeze({
      RADIUS_RATIOS: [0.04, 0.15, 0.40],
      radius: 5,    // [0:OFF, 1..5..10]
                    // 10 == foreground-font-size
      use: 'customized', // foreground | customized
      COLOR_RATIOS: [0.2, 0.7, 1.0],
      color: Object.freeze({
        red: 192,   // 0..255
        green: 255, // 0..255
        blue: 192   // 0..255
      }),
      duration: 0,  // [0:OFF, 1..10..100] x 100ms --log()--> [-step, 0..1..2]
    }),

    background: Object.freeze({
      use: 'color', // color | image
      color: Object.freeze({
        red: 16,    // 0..255
        green: 16,  // 0..255
        blue: 64    // 0..255
      }),
      url: '',
    })
  })

  static #instance = undefined
  static load() {
    return State.load()
      .then((cache) => Settings.merge(cache.settings))
      .then((settings) => {
        if(settings.version < Settings.DEFAULT.version) {
          settings.version = Settings.DEFAULT.version
          Settings.save()
        }
      })
      // .then(() => console.debug("[DEBUG] Loaded settings: %s", JSON.stringify(Settings.#instance)))
  }

  static get text() { return Settings.#instance.text }
  static get scrollable() { return Settings.#instance.speed > 0 }

  static merge(settings) {
    // console.debug("Importing settings: %s", JSON.stringify(settings))
    Settings.#instance = Settings.#instance ?? PlainObject.copy(Settings.DEFAULT) 
    if(settings?.version && settings.version <= Settings.#instance.version) {
      PlainObject.merge(settings, Settings.#instance)
    }
    // console.debug("Merged settings: %s", JSON.stringify(Settings.#instance))
    return Settings.#instance
  }

  static save() { return State.set({settings: Settings.#instance}) }

  static applyFont(rootStyle) {
    const settings = Settings.#instance
    rootStyle.setProperty('--scroller-font-color', Settings.#Color.stringOf(settings.foreground.color))
    rootStyle.setProperty('--scroller-font-size', settings.foreground.size + 'vmin')
  }

  static applyScrolling(rootStyle, containerSize, scrollerSize) {
    const base = Config.fullScreenScrollingMillis * Settings.DEFAULT.speed / Settings.#instance.speed
    const duration = Math.round(base * (1 + scrollerSize / containerSize))
    rootStyle.setProperty('--scrolling-duration', duration + 'ms')
    rootStyle.setProperty('--scrolling-offset', (-containerSize - scrollerSize) + 'px')
  }

  static applyGlowEffect(rootStyle) {
    const settings = Settings.#instance
    const content = $E('div.scroller-content')
    content.classList.remove('shadow-animation', 'static-shadow')
    if(settings.glow.radius === 0) {
      rootStyle.setProperty('--text-shadow', 'none')
      rootStyle.setProperty('--animation-duration', '0ms')
      return
    }

    const base = settings.foreground.size * settings.glow.radius / 10
    const sizes = settings.glow.RADIUS_RATIOS.map(it => it * base)
    const colors = settings.glow.use === 'foreground'
        ? Array(settings.glow.COLOR_RATIOS.length).fill(settings.foreground.color)
        : settings.glow.COLOR_RATIOS.map(ratio => Settings.#Color.interpolate(settings.foreground.color, settings.glow.color, ratio))
    rootStyle.setProperty('--text-shadow', sizes.map((size, index) => `0 0 ${size}vmin ${Settings.#Color.stringOf(colors[index])}`).join(', '))
    rootStyle.setProperty('--animation-duration', settings.glow.duration + 'ms')
    content.classList.add(settings.glow.duration > 0 ? 'shadow-animation' : 'static-shadow')
  }

  static applyBackground(rootStyle) {
    const settings = Settings.#instance
    if(settings.background.use === 'image') {
      const color = Settings.#Color.stringOf(Settings.DEFAULT.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      const background = `center / cover no-repeat url("${settings.background.url}")`
      rootStyle.setProperty('--scroller-background', background)
    } else {
      const color = Settings.#Color.stringOf(settings.background.color)
      rootStyle.setProperty('--scroller-background-color', color)
      rootStyle.setProperty('--scroller-background', color)
    }
  }

  // [2..4..16] x 4vmin --log()--> [½..1..2]
  static #Size = {
    labelOf: (value) => value,
    rangeOf: (value) => Math.log2(value/4)/2,
    valueOf: (range) => Math.round(Math.pow(4, range)*4),
  }

  // [0:OFF, 1..10..100] --log()--> [-step, 0..1..2]
  static #SPEED_STEP = 0.1
  static #Speed = {
    labelOf: (value) => value===0 ? T('settings.speed.zero') : value,
    rangeOf: (value) => value===0 ? -Settings.#SPEED_STEP : Math.log10(value),
    valueOf: (range) => range < 0 ? 0 : Math.round(Math.pow(10, range)),
  }

  static #Color = {
    labelOf: (value) => value,
    rangeOf: (value) => value,
    valueOf: (range) => Math.min(range, 255),
    interpolate: (from, to, ratio) => {
      const inter = (from, to, ratio) => from + Math.round((to - from) * ratio)
      return {
        red: inter(from.red, to.red, ratio),
        green: inter(from.green, to.green, ratio),
        blue: inter(from.blue, to.blue, ratio)
      }
    },
    stringOf: (color) => `rgb(${color.red},${color.green},${color.blue})`
  }

  // [0:OFF, 1..5..10]
  static #Radius = {
    labelOf: (value) => value===0 ? T('settings.glow.radius.zero') : value,
    rangeOf: (value) => value,
    valueOf: Number.parseInt,
  }

  // [0:OFF, 1..10..100] x 100ms --log()--> [-step, 0..1..2]
  static #DURATION_STEP = 0.1
  static #Duration = {
    labelOf: (value) => {
      if(value===0) return T('settings.glow.duration.zero')
      if(value < 1000) return value + 'ms'
      if(value < 10000) return (value / 1000).toFixed(1) + 's'
      return (value / 1000).toFixed(0) + 's'
    },
    rangeOf: (value) => value===0 ? -Settings.#DURATION_STEP : Math.log10(value/100),
    valueOf: (range) => range < 0 ? 0 : Math.round(Math.pow(10, range)) * 100,
  }

  static View = (() => {

    const rootStyle = $E(':root').style

    class RangeInput {
      #div
      #object
      #property
      #labelOf
      #rangeOf
      #valueOf

      constructor(div, object, property, converter = {}) {
        this.#div = div
        this.#object = object
        this.#property = property
        this.#labelOf = converter.labelOf ?? (o=>o)
        this.#rangeOf = converter.rangeOf ?? (o=>o)
        this.#valueOf = converter.valueOf ?? (o=>o)
      }

      label() {
        return `<span name="${this.#property}" class="hint">${this.#labelOf(this.#object[this.#property])}</span>`
      }

      input(min, step, max) {
        return `<input type="range" min="${min}" step="${step}" max="${max}" value="${this.#rangeOf(this.#object[this.#property])}">`
      }

      onChanged(handler) {
        const range = {
          input: $E(`.${this.#property} input[type="range"]`, this.#div),
          label: $E(`span[name="${this.#property}"]`, this.#div),
          value: 0
        }
        range.input.addEventListener('input', (event) => {
          range.value = this.#valueOf(event.target.value)
          range.label.innerHTML = this.#labelOf(range.value)
        })
        range.input.addEventListener('change', () => {
          const oldValue = this.#object[this.#property]
          this.#object[this.#property] = range.value
          if(handler) handler(range.value, oldValue)
        })
      }
    }

    class ColorPanel {
      #div
      #color

      constructor(div, color) {
        this.#div = div
        this.#color = color
      }

      lables() {
        return `
          <span>${T('settings.color.red')}</span><span name="red" class="hint">${this.#color.red}</span>
          <span>${T('settings.color.green')}</span><span name="green" class="hint">${this.#color.green}</span>
          <span>${T('settings.color.blue')}</span><span name="blue" class="hint">${this.#color.blue}</span>`
      }

      inputs() {
        return `
          <span class="no-wrap"><span class="color-name red">${T('settings.color.red')}</span><input class="red" type="range" min="0" step="4" max="256" value="${this.#color.red}"></span>
          <span class="no-wrap"><span class="color-name green">${T('settings.color.green')}</span><input class="green" type="range" min="0" step="4" max="256" value="${this.#color.green}"></span>
          <span class="no-wrap"><span class="color-name blue">${T('settings.color.blue')}</span><input class="blue" type="range" min="0" step="4" max="256" value="${this.#color.blue}"></span>`
      }

      onChanged(handler) {
        ['red', 'green', 'blue'].forEach((name) => {
          const color = {
            range: $E(`.color input[type="range"].${name}`, this.#div),
            label: $E(`span[name="${name}"]`, this.#div),
            value: 0
          }
          color.range.addEventListener('input', function() {
            color.value = Settings.#Color.valueOf(Number.parseInt(this.value))
            color.label.innerHTML = color.value
          })
          color.range.addEventListener('change', () => {
            this.#color[name] = color.value
            if(handler) handler(this.#color)
          })
        })
      }

      refresh() {
        ['red', 'green', 'blue'].forEach((name) => {
          $E(`.color input[type="range"].${name}`, this.#div).value = this.#color[name]
          $E(`span[name="${name}"]`, this.#div).innerHTML = this.#color[name]
        })
      }
    }

    function updateRadios(radios, value) {
      radios.forEach((it) => it.checked = it.value === value)
    }

    const TABS = {
      text: {
        div: undefined,
        renderWithin(div) {
          this.div = div
          const settings = Settings.#instance
          div.innerHTML = `
            <div>
              <textarea rows="5" wrap="soft" placeholder="${T('settings.text.placeholder')}">${settings.text}</textarea>
            </div>
            <div>
              <button type="button" value="OK">${T('settings.text.button.ok')}</button>
            </div>
          `
          $E('button', div).addEventListener('click', () => {
            settings.text = $E('textarea', div).value
            TextScroller.start()
            Settings.View.close()
          })
          this.onRendered()
        },
        onRendered() {
          const input = $E('textarea', this.div)
          input.focus()
          const length = input.value?.length
          input.setSelectionRange(length, length)
        }
      },
      foreground: {
        renderWithin(div) {
          const settings = Settings.#instance

          const size = new RangeInput(div, settings.foreground, 'size', Settings.#Size)
          const speed = new RangeInput(div, settings, 'speed', Settings.#Speed)

          const colorPanel = new ColorPanel(div, settings.foreground.color)
          div.innerHTML = `
            <div class="size">
              <div class="label">
                <span>${T('settings.size')}:</span>
                ${size.label()}
              </div>
              <div class="input">
                ${size.input(0.5, 0.125, 2)}
              </div>
            </div>
            <div class="speed">
              <div class="label">
                <span>${T('settings.speed')}:</span>
                ${speed.label()}
              </div>
              <div class="input">
                ${speed.input(-Settings.#SPEED_STEP, Settings.#SPEED_STEP, 2)}
              </div>
            </div>
            <div class="color">
              <div class="label">
                <span>${T('settings.foreground.color')}:</span>
                ${colorPanel.lables()}
              </div>
              <div class="input">
                ${colorPanel.inputs()}
              </div>
            </div>
          `
          size.onChanged((newValue) => rootStyle.setProperty('--scroller-font-size', newValue + 'vmin'))
          speed.onChanged((newValue, oldValue) => { if(oldValue === 0 || newValue === 0) TextScroller.start() })
          colorPanel.onChanged((color) => rootStyle.setProperty('--scroller-font-color', Settings.#Color.stringOf(color)))
        }
      },
      glow: {
        renderWithin(div) {
          const settings = Settings.#instance

          const radius = new RangeInput(div, settings.glow, 'radius', Settings.#Radius)
          const duration = new RangeInput(div, settings.glow, 'duration', Settings.#Duration)

          const delegated = {
            get red() { return this.delegate().red },
            set red(value) { this.delegate().red = value },
            get green() { return this.delegate().green },
            set green(value) { this.delegate().green = value },
            get blue() { return this.delegate().blue },
            set blue(value) { this.delegate().blue = value },
            delegate() { return settings.glow.use === 'foreground' ? settings.foreground.color : settings.glow.color }
          }
          const colorPanel = new ColorPanel(div, delegated)

          div.innerHTML = `
            <div class="radius">
              <div class="label">
                <span>${T('settings.glow.radius')}:</span>
                ${radius.label()}
              </div>
              <div class="input">
                ${radius.input(0, 1, 10)}
              </div>
            </div>
            <div class="color">
              <div class="label">
                <span>${T('settings.glow.color')}:</span>
                <input is="labelled-switch" name="use"
                    on-value="foreground" on-label="${T('settings.glow.use.foreground')}"
                    off-value="customized" off-label="${T('settings.glow.use.customized')}"
                    value="${settings.glow.use}">
                <br/>
                <span>&nbsp;&nbsp;&nbsp;</span>${colorPanel.lables()}
              </div>
              <div class="input">
                ${colorPanel.inputs()}
              </div>
            </div>
            <div class="duration">
              <div class="label">
                <span>${T('settings.glow.duration')}:</span>
                ${duration.label()}
              </div>
              <div class="input">
                ${duration.input(-Settings.#DURATION_STEP, Settings.#DURATION_STEP, 2)}
              </div>
            </div>
          `
          $A('div.color, div.duration', div).forEach((div) => $toggle(div, settings.glow.radius===0))

          radius.onChanged(() => {
            $A('div.color, div.duration', div).forEach((div) => $toggle(div, settings.glow.radius===0))
            Settings.applyGlowEffect(rootStyle)
          })
          duration.onChanged(() => Settings.applyGlowEffect(rootStyle))

          function updateColorRanges() {
            const $div = $E('.color > div.input', div)
            const disabled = settings.glow.use !== 'customized'
            $div.classList.toggle('disabled', disabled)
            $A('input', $div).forEach((input) => input.disabled = disabled)
          }
          updateColorRanges()

          $E('.color input[name="use"]', div).addEventListener('change', function() {
            settings.glow.use = this.value
            colorPanel.refresh()
            updateColorRanges()
            Settings.applyGlowEffect(rootStyle)
          })

          colorPanel.onChanged(() => Settings.applyGlowEffect(rootStyle))
        }
      },
      background: {
        renderWithin(div) {
          const settings = Settings.#instance
          const colorPanel = new ColorPanel(div, settings.background.color)
          const canReadClipboard = !!navigator.clipboard?.readText 
          div.innerHTML = `
            <div class="color">
              <div class="label">
                <input type="radio" id="use-color" name="use" value="color">
                <label for="use-color">${T('settings.background.color')}:</label>` + colorPanel.lables() + `
              </div>
              <div class="input">` + colorPanel.inputs() + `
              </div>
            </div>
            <div class="image">
              <div class="label">
                <input type="radio" id="use-image" name="use" value="image">
                <label for="use-image">${T('settings.image')}:</label>
                <label for="bg-image">${T('settings.image.select')}</label>
                <label id="paste-image-url">${T('settings.image.paste')}</label>
              </div>
              <div class="input">
                <input type="file" id="bg-image" accept="image/*" class="visually-hidden">
                <div id="image-prompt"></div>` + (canReadClipboard ? '' :
                  `<textarea class="hidden" readonly placeholder="${T('settings.image.paste.prompt')}" rows="6"></textarea>`) + `
              </div>
            </div>
          `
          const radios = $A('.background input[type="radio"]', div)
          updateRadios(radios, settings.background.use)
          radios.forEach((radio) => {
            radio.addEventListener('change', function() {
              radios.forEach((it) => { if(it.checked) settings.background.use = it.value })
              Settings.applyBackground(rootStyle)
            })
          })

          colorPanel.onChanged(() => {
            updateRadios(radios, (settings.background.use = 'color'))
            Settings.applyBackground(rootStyle)
          })

          function onPasteBackgroundUrl(url) {
            $prompt.innerHTML = truncate(url, 160)
            return fetch(url, {method: 'GET', mode: 'cors', cache: 'default', credentials: 'omit'})
              .then((response) => {
                // console.debug("[DEBUG] Response: %o", response)
                // for(const pair of response.headers) {
                //   console.debug("[DEBUG] %s: %s", pair[0], pair[1])
                // }
                if(response.ok) {
                  const contentType = response.headers.get('Content-Type')
                  if(contentType?.startsWith('image/')) {
                    setBackgroundUrl(url)
                    $prompt.innerHTML += 
                      `<br/> --> <span class="success">${T('settings.image.succeeded')}</span>`
                  } else {
                    console.error("[ERROR] Unexpected Content-Type: %s", contentType)
                    $prompt.innerHTML +=
                      `<br/> --> <span class="error">${T('settings.image.error.contentType')}: ${contentType}</span>`
                  }
                } else {
                  console.error("[ERROR] Unexpected Response Status: %d", response.status)
                  $prompt.innerHTML +=
                    `<br/> --> <span class="error">${T('settings.image.error')}: ${response.status}</span>`
                }
              }).catch((error) => {
                console.error("[ERROR] Unexpected Error: %o", error)
                $prompt.innerHTML +=
                  `<br/> --> <span class="error">${T('settings.image.error')}: ${error}</span>`
              })
          }
          
          function setBackgroundUrl(url) {
            settings.background.url = url
            updateRadios(radios, (settings.background.use = 'image'))
            Settings.applyBackground(rootStyle)
          }

          const $prompt = $E('.image #image-prompt', div)
          $E('.image input[type="file"]', div).addEventListener('change', function() {
            $prompt.innerHTML = ''
            const file = this.files[0]
            const reader = new FileReader()
            reader.onload = (event) => {
              // console.debug("Calling FileReader.onload(%o) ...", event)
              if(event.total > 1000*1024 && /Firefox/.test(navigator.userAgent)) {
                $prompt.innerHTML = T('settings.image.local.size-gt-1000k')
              } else {
                setBackgroundUrl(event.target.result)
              }
            }
            reader.readAsDataURL(file)
          })
          function truncate(string, maxLength) {
            return string?.length < maxLength ? string : (string.substring(0, maxLength-3)+'...')
          }

          if(canReadClipboard) {
            $E('.image #paste-image-url', div).addEventListener('click', function() {
              navigator.clipboard.readText().then(onPasteBackgroundUrl)
            })
          } else {
            const input = $prompt.nextSibling
            $E('.image #paste-image-url', div).addEventListener('click', function() {
              $prompt.innerHTML = ''
              input.value = ''
              $show(input)
              input.focus()
            })
            input.addEventListener('paste', function(event) {
              const text = (event || window).clipboardData.getData('text')
              // console.debug("Calling TextArea.onPaste(%s) ...", text)
              onPasteBackgroundUrl(text)
              $hide(this)
            })
          }
        }
      },
      more: {
        renderWithin(div) {
          div.innerHTML = `
            <div class="share">
              <div class="label">
                <span>${T('settings.share')}:</span>
                <input type="checkbox" checked id="including-settings" name="including-settings"><label for="including-settings">${T('settings.share.including-settings')}</label>
              </div>
              <div class="input">
                <div class="qrcode"></div>
              </div>
            </div>
            <div class="app no-wrap">
              <a href="javascript:openMarkdown('${T('app.name')}', '${CONTEXT_PATH}/README.md')">${T('app.name')}</a>
              <span>${APP_VERSION}</span>
              ${renderUpgrade()}
            </div>
            <div class="copyright">
              <span class="no-wrap"><a href="javascript:openMarkdown('${T('footer.license')}', '${CONTEXT_PATH}/LICENSE.md')">${T('footer.copyright')} &copy; 2022-${(new Date().getFullYear())}</a></span>
              <span class="no-wrap"><a href="mailto: johnwu.pro@gmail.com" target="_blank">${T('footer.owner')}</a>,</span>
              <span class="no-wrap">${T('footer.licensed-under')} <a href="https://mozilla.org/MPL/2.0/" target="_blank">MPL-2.0</a>.</span>
            </div>
          `
          const includingSettings = $E('.share input[name="including-settings"]', div)
          const container = $E('div.qrcode', div)

          function renderQrcode() {
            const url = new URL(location.href)
            url.search = ''
            url.searchParams.set('v', new Date().toISOString().replace(/^(\d{4})-(\d{2})-(\d{2}).{10}(\d{3}).+$/, '$1$2$3$4'))
            if(includingSettings.checked) {
              const settings = PlainObject.copy(Settings.#instance)
              settings.activeTab = Settings.DEFAULT.activeTab
              if(/^data:image\/.+/.test(settings.background.url)) settings.background.url = ''

              url.searchParams.set('settings', Base64.UrlSafe.encode(LZString.compressToUint8Array(JSON.stringify(settings))))
            }
            const text = url.href
            // console.debug("QR code text(%o): %s", text.length, text)
            
            container.innerHTML = ''
            new QRCode(container, {
              text,
              width: 216,
              height: 216,
              quietZone: 8,
              quietZoneColor: '#40C040',
              logo: HREF_BASE + '/images/icon-64x64.png',
              logoWidth: 64,
              logoHeight: 64,
              logoBackgroundTransparent: true,
            })
          }
          Promise.resolve().then(renderQrcode)

          includingSettings.addEventListener('change', renderQrcode)

          function renderUpgrade() {
            return !(activatedVersion > APP_VERSION) ? ''
                : `<button id="upgrade">${T('app.upgrade')} ${activatedVersion}</button>`
          }
          $E('.app #upgrade')?.addEventListener('click', () => window.location.reload())
        }
      },
    }

    var $overlay, $view, isVisible = false, $content, activatedVersion

    function init() {
      $overlay = $E('div.overlay')
      $view = appendElement('div', {className: `settings-view ${LOCALE} hidden`}, $overlay)
      $view.innerHTML = `
        <div class="settings-content"></div>
        <div class="settings-tabs">` +
      Object.keys(TABS).reduce((html, tab) => html + `
          <div class="settings-tab ${tab}">
            <div class="tab-icon"></div>
            <div class="tab-label">${T('settings.tab-label.' + tab)}</div>
          </div>`, '') + `
        </div>
        <div class="settings-pad"></div>
      `
      $content = $E('.settings-content', $view)

      // Attach tab event listeners
      $A('.settings-tab', $view).forEach((div) => div.addEventListener('click', () => renderTab(div)))

      window.addEventListener("show-settings", show)
      window.addEventListener("close-settings", close)

      navigator.serviceWorker?.addEventListener('message', (event) => {
        // console.debug("[DEBUG] Received Service Worker message: %s", JSON.stringify(event.data))
        if(event.data.type === 'SW_ACTIVATED') activatedVersion = event.data.version
      })

      return Promise.resolve()
    }

    function renderTab(tabDiv) {
      const settings = Settings.#instance
      // console.debug("Live settings: %s", JSON.stringify(settings))
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

      // Render active tab
      renderTab($E('.settings-tab.' + Settings.#instance.activeTab, $view))

      $show($view)
      $show($overlay)
      return $stateful($overlay).perform('slide-in')
        .then(() => isVisible = true)
        .then(() => {
          const renderer = TABS[Settings.#instance.activeTab]
          if(renderer.onRendered) renderer.onRendered()
        })
    }

    function close() {
      if(!isVisible) return

      Settings.save()

      return $stateful($overlay).revert('slide-in')
        .then(() => {
          isVisible = false
          $hide($overlay)
          $hide($view)

          $content.innerHTML = ''
          $E('.settings-tab.' + Settings.#instance.activeTab, $view).classList.remove('selected')

          window.dispatchEvent(new CustomEvent('settings-closed'))
        })
    }

    return {
      init,
      show,
      close
    }
  })()

}
